const jwt = require('jsonwebtoken');
const { register, login, models } = require('./helpers');

describe('Integracion - flujo de usuario', () => {
  test('registro -> persistencia en DB -> login -> JWT valido', async () => {
    const { res: regRes, email, password } = await register();
    expect(regRes.status).toBe(201);
    expect(regRes.body).toMatchObject({
      message: 'Usuario registrado exitosamente',
      user: { email },
    });

    const dbUser = await models.Ahorrador.findOne({ where: { email } });
    expect(dbUser).toBeTruthy();
    expect(dbUser.email).toBe(email);
    expect(dbUser.password).not.toBe(password);

    const { res: loginRes } = await login({ email, password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    expect(loginRes.body).toMatchObject({ user: { email, id: dbUser.clave } });

    const decoded = jwt.verify(loginRes.body.token, process.env.JWT_SECRET);
    expect(decoded).toMatchObject({ id: dbUser.clave, email });
  });

  test('registro con email invalido devuelve 400', async () => {
    const { res } = await register({ email: 'no-es-email', password: 'Test1234!' });
    expect(res.status).toBe(400);
  });
});
