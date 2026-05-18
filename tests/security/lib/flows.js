import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, DEFAULT_HEADERS } from './config.js';

export function registerUser({ email, password }) {
  const res = http.post(
    `${BASE_URL}/api/ahorradores/registrar`,
    JSON.stringify({ email, password }),
    { headers: DEFAULT_HEADERS }
  );

  return res;
}

export function loginUser({ email, password }) {
  const res = http.post(
    `${BASE_URL}/api/ahorradores/login`,
    JSON.stringify({ email, password }),
    { headers: DEFAULT_HEADERS }
  );

  return res;
}

export function createTestUserAndToken() {
  const password = 'Sec1234!';

  const makeEmail = () => `sec_${Date.now()}_${Math.floor(Math.random() * 1e12)}@finflow.test`;
  let email = makeEmail();

  for (let attempt = 0; attempt < 3; attempt++) {
    const registerRes = registerUser({ email, password });
    check(registerRes, {
      'registro ok (201)': (r) => r.status === 201,
    });

    if (registerRes.status === 201) break;
    email = makeEmail();
  }

  const loginRes = loginUser({ email, password });
  check(loginRes, {
    'login ok (200)': (r) => r.status === 200,
  });

  const token = loginRes.status === 200 ? loginRes.json('token') : null;
  const user = loginRes.status === 200 ? loginRes.json('user') : null;
  return { email, password, token, user };
}

export function authHeaders(token) {
  return {
    ...DEFAULT_HEADERS,
    Authorization: `Bearer ${token}`,
  };
}
