import http from 'k6/http';
import { check, sleep, fail } from 'k6';

const BASE_URL = __ENV.API_BASE_URL || 'http://host.docker.internal:3000';
const MAX_VUS = 100;

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '2m', target:  50},
    { duration: '1m', target: MAX_VUS },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

export function setup() {
  const users = [];
  const ts = Date.now();

  for (let i = 0; i < MAX_VUS; i++) {
    const email = `stress_${i}_${ts}@finflow.test`;
    const password = 'Stress123!';

    const headers = {
      'Content-Type': 'application/json',
    };

    // Registro
    const registerRes = http.post(
      `${BASE_URL}/api/ahorradores/registrar`,
      JSON.stringify({ email, password }),
      { headers }
    );

    if (registerRes.status !== 201) {
      console.log(`❌ Registro falló para ${email}`);
      console.log(`Status: ${registerRes.status}`);
      console.log(registerRes.body);
      continue;
    }

    // Login
    const loginRes = http.post(
      `${BASE_URL}/api/ahorradores/login`,
      JSON.stringify({ email, password }),
      { headers }
    );

    if (loginRes.status !== 200) {
      console.log(`❌ Login falló para ${email}`);
      console.log(`Status: ${loginRes.status}`);
      console.log(loginRes.body);
      continue;
    }

    // Ajusta esta ruta si tu API devuelve el token diferente
    const token = loginRes.json('token');

    if (!token) {
      console.log(`❌ Token vacío para ${email}`);
      console.log(loginRes.body);
      continue;
    }

    users.push({ token, email });
  }

  console.log(`✅ Usuarios válidos creados: ${users.length}`);

  if (users.length === 0) {
    fail('No se pudo crear ningún usuario válido');
  }

  return { users };
}

export default function (data) {
  const user = data.users[(__VU - 1) % data.users.length];

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user.token}`,
  };

  // Crear meta
  const createRes = http.post(
    `${BASE_URL}/api/metas`,
    JSON.stringify({
      identificador: `Stress-${__VU}-${__ITER}-${Date.now()}`,
      montoObjetivo: Math.floor(Math.random() * 90000) + 10000,
      montoAlcanzado: 0,
      fechaInicio: '2026-01-01',
      fechaLimite: '2026-12-31',
      descripcion: 'Generada por stress test',
    }),
    { headers: authHeaders }
  );

  if (createRes.status !== 201) {
    console.log(`❌ Error creando meta`);
    console.log(`VU: ${__VU} | ITER: ${__ITER}`);
    console.log(`Status: ${createRes.status}`);
    console.log(createRes.body);
  }

  check(createRes, {
    'meta creada (201)': (r) => r.status === 201,
  });

  // Listar metas
  const listRes = http.get(
    `${BASE_URL}/api/metas`,
    { headers: authHeaders }
  );

  if (listRes.status !== 200) {
    console.log(`❌ Error listando metas`);
    console.log(`Status: ${listRes.status}`);
    console.log(listRes.body);
  }

  check(listRes, {
    'metas listadas (200)': (r) => r.status === 200,
  });

  sleep(0.1);
}

export function teardown(data) {
  let deleted = 0;

  for (const user of data.users) {
    const res = http.del(
      `${BASE_URL}/api/ahorradores/cuenta`,
      null,
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    if (res.status === 200) {
      deleted++;
    }
  }

  console.log(`🗑️ Cuentas eliminadas: ${deleted}`);
}