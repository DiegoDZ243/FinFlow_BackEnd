jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const { verificarToken } = require('../../middleware/auth');

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('middleware/auth verificarToken', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'secret';
    jest.clearAllMocks();
  });

  test('401 si no hay header authorization', () => {
    const req = { headers: {} };
    const res = makeRes();
    const next = jest.fn();

    verificarToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token no proporcionado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('401 si formato no es Bearer <token>', () => {
    const req = { headers: { authorization: 'Token abc' } };
    const res = makeRes();
    const next = jest.fn();

    verificarToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Formato de token inválido' });
    expect(next).not.toHaveBeenCalled();
  });

  test('401 si jwt.verify lanza error', () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('bad token');
    });

    const req = { headers: { authorization: 'Bearer bad' } };
    const res = makeRes();
    const next = jest.fn();

    verificarToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('bad', 'secret');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('setea req.user y llama next cuando token es valido', () => {
    jwt.verify.mockReturnValue({ id: 1, email: 'a@b.com' });

    const req = { headers: { authorization: 'Bearer ok' } };
    const res = makeRes();
    const next = jest.fn();

    verificarToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('ok', 'secret');
    expect(req.user).toEqual({ id: 1, email: 'a@b.com' });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
