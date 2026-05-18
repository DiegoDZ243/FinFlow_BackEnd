import http from 'k6/http';
import { check, sleep, fail } from 'k6';

import { BASE_URL, DEFAULT_HEADERS, JWT_SECRET } from '../lib/config.js';
import { INJECTION_PAYLOADS, MALFORMED_TOKENS } from '../lib/payloads.js';
import { authHeaders, createTestUserAndToken, loginUser, registerUser } from '../lib/flows.js';
import { checkForbidden, checkNot5xx, checkUnauthorized } from '../lib/checks.js';
import { signJwtHs256 } from '../lib/jwt.js';

export const options = {
  scenarios: {
    authn_authz: {
      executor: 'per-vu-iterations',
      vus: 5,
      iterations: 10,
      maxDuration: '1m',
      exec: 'authnAuthz',
    },
    input_validation: {
      executor: 'per-vu-iterations',
      vus: 5,
      iterations: 10,
      maxDuration: '1m',
      exec: 'inputValidation',
      startTime: '0s',
    },
    login_burst: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '20s',
      preAllocatedVUs: 20,
      maxVUs: 100,
      exec: 'loginBurst',
      startTime: '0s',
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
    http_req_duration: ['p(95)<2000'],
  },
};

export function setup() {
  const userA = createTestUserAndToken();
  const userB = createTestUserAndToken();

  if (!userA.token || !userB.token) {
    fail('No se pudo obtener token de prueba');
  }

  return { userA, userB };
}

export function authnAuthz(data) {
  const { userA, userB } = data;

  {
    const res = http.get(`${BASE_URL}/api/metas`);
    checkUnauthorized(res, 'GET /api/metas sin token (401)');
  }

  {
    const res = http.post(
      `${BASE_URL}/api/metas`,
      JSON.stringify({
        identificador: `Sec-${__VU}-${__ITER}-${Date.now()}`,
        montoObjetivo: 1000,
        montoAlcanzado: 0,
        fechaInicio: '2026-01-01',
        fechaLimite: '2026-12-31',
        descripcion: 'security test',
      }),
      { headers: DEFAULT_HEADERS }
    );
    checkUnauthorized(res, 'POST /api/metas sin token (401)');
  }

  for (const tok of MALFORMED_TOKENS) {
    const headers = { ...DEFAULT_HEADERS, Authorization: `Bearer ${tok}` };
    const res = http.get(`${BASE_URL}/api/metas`, { headers });
    checkUnauthorized(res, 'GET /api/metas token malformado (401)');
  }

  {
    const headers = { ...DEFAULT_HEADERS, Authorization: 'Bearer invalid.jwt.value' };
    const res = http.get(`${BASE_URL}/api/metas`, { headers });
    checkUnauthorized(res, 'GET /api/metas token invalido (401)');
  }

  if (JWT_SECRET) {
    const expired = signJwtHs256(
      {
        id: userA.user?.id || userA.email,
        email: userA.email,
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) - 60,
      },
      JWT_SECRET
    );

    const res = http.get(`${BASE_URL}/api/metas`, { headers: authHeaders(expired) });
    checkUnauthorized(res, 'GET /api/metas token expirado (401)');
  }

  {
    const createRes = http.post(
      `${BASE_URL}/api/metas`,
      JSON.stringify({
        identificador: `SecAuthz-${__VU}-${__ITER}-${Date.now()}`,
        montoObjetivo: 2500,
        montoAlcanzado: 0,
        fechaInicio: '2026-01-01',
        fechaLimite: '2026-12-31',
        descripcion: 'security authz test',
      }),
      { headers: authHeaders(userA.token) }
    );

    check(createRes, { 'meta creada por userA (201)': (r) => r.status === 201 });

    if (createRes.status === 201) {
      const metaId = createRes.json('clave') || createRes.json('id');
      if (metaId) {
        const res = http.get(`${BASE_URL}/api/metas/${metaId}`, { headers: authHeaders(userB.token) });
        checkForbidden(res, 'GET /api/metas/:id ajeno (403)');
      }
    }
  }

  sleep(0.1);
}

export function inputValidation() {
  for (const payload of INJECTION_PAYLOADS) {
    const regRes = registerUser(payload);
    checkNot5xx(regRes, 'registrar: no 5xx ante payload sospechoso');

    const loginRes = loginUser(payload);
    checkNot5xx(loginRes, 'login: no 5xx ante payload sospechoso');
  }

  {
    // JSON malformado debe ser 400, nunca 5xx.
    const res = http.post(`${BASE_URL}/api/ahorradores/login`, '{"email":', {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, {
      'login: JSON malformado (400)': (r) => r.status === 400,
    });
  }
}

export function loginBurst() {
  const res = http.post(
    `${BASE_URL}/api/ahorradores/login`,
    JSON.stringify({ email: `nope_${__ITER}@finflow.test`, password: 'wrong' }),
    { headers: DEFAULT_HEADERS }
  );

  checkNot5xx(res, 'login burst: no 5xx');
}

export function teardown(data) {
  for (const u of [data.userA, data.userB]) {
    if (!u?.token) continue;

    http.del(`${BASE_URL}/api/ahorradores/cuenta`, null, {
      headers: {
        Authorization: `Bearer ${u.token}`,
      },
    });
  }
}
