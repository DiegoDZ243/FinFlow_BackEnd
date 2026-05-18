const request = require('supertest');
const app = require('../../app');
const { models } = require('../../models');

const makeEmail = () => `it_${Date.now()}_${Math.floor(Math.random() * 1e12)}@finflow.test`;

const register = async ({ email = makeEmail(), password = 'Test1234!' } = {}) => {
  const res = await request(app)
    .post('/api/ahorradores/registrar')
    .send({ email, password });
  return { res, email, password };
};

const login = async ({ email, password } = {}) => {
  const res = await request(app)
    .post('/api/ahorradores/login')
    .send({ email, password });
  return { res };
};

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const createMeta = async ({ token, body } = {}) => {
  const res = await request(app)
    .post('/api/metas')
    .set(authHeader(token))
    .send(body);
  return { res };
};

const aportar = async ({ token, metaId, body } = {}) => {
  const res = await request(app)
    .post(`/api/metas/${metaId}/aportar`)
    .set(authHeader(token))
    .send(body);
  return { res };
};

module.exports = {
  app,
  models,
  makeEmail,
  register,
  login,
  createMeta,
  aportar,
};
