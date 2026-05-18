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

  test('TCU-018-No enviar header authorization y ejecutar verificarToken()', () => {
    const req = { headers: {} };
    const res = makeRes();
    const next = jest.fn();

    verificarToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token no proporcionado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('TCU-019-Enviar authorization con formato inválido y ejecutar verificarToken()', () => {
    const req = { headers: { authorization: 'Token abc' } };
    const res = makeRes();
    const next = jest.fn();

    verificarToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Formato de token inválido' });
    expect(next).not.toHaveBeenCalled();
  });

  test('TCU-020-jwt.verify lanza error y ejecutar verificarToken()', () => {
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

  test('TCU-021-token válido asigna req.user y llama next()', () => {
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
