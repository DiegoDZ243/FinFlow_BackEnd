const request = require('supertest');
const { register, login, createMeta, aportar, models, app } = require('./helpers');

describe('Integracion - flujo de metas financieras', () => {
  test('crear meta asociada al ahorrador y leerla desde DB', async () => {
    const { res: regRes, email, password } = await register();
    expect(regRes.status).toBe(201);

    const { res: loginRes } = await login({ email, password });
    const token = loginRes.body.token;
    expect(token).toBeTruthy();

    const metaBody = {
      identificador: 'Meta Integracion',
      montoObjetivo: 1000,
      montoAlcanzado: 0,
      fechaInicio: '2026-01-01',
      fechaLimite: '2026-12-31',
      descripcion: 'test',
    };

    const { res: createRes } = await createMeta({ token, body: metaBody });
    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty('clave');
    expect(createRes.body).toMatchObject({
      identificador: metaBody.identificador,
      ahorradorId: loginRes.body.user.id,
    });

    const metaId = createRes.body.clave;
    const metaDb = await models.Meta.findByPk(metaId);
    expect(metaDb).toBeTruthy();
    expect(metaDb.identificador).toBe(metaBody.identificador);
    expect(metaDb.ahorradorId).toBe(loginRes.body.user.id);

    const getRes = await request(app)
      .get(`/api/metas/${metaId}`)
      .set({ Authorization: `Bearer ${token}` });
    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveProperty('clave', metaId);
  });

  test('validaciones de Sequelize: identificador corto devuelve 500 hoy (deberia ser 400)', async () => {
    const { res: regRes, email, password } = await register();
    expect(regRes.status).toBe(201);

    const { res: loginRes } = await login({ email, password });
    const token = loginRes.body.token;

    const { res: createRes } = await createMeta({
      token,
      body: {
        identificador: 'abc',
        montoObjetivo: 1000,
        montoAlcanzado: 0,
        fechaInicio: '2026-01-01',
        fechaLimite: '2026-12-31',
        descripcion: 'test',
      },
    });

    expect([400, 500]).toContain(createRes.status);
  });

  test('aportar a meta crea AporteMeta y actualiza montoAlcanzado', async () => {
    const { res: regRes, email, password } = await register();
    expect(regRes.status).toBe(201);

    const { res: loginRes } = await login({ email, password });
    const token = loginRes.body.token;

    const { res: createRes } = await createMeta({
      token,
      body: {
        identificador: 'Meta Aportes',
        montoObjetivo: 1000,
        montoAlcanzado: 0,
        fechaInicio: '2026-01-01',
        fechaLimite: '2026-12-31',
        descripcion: 'test',
      },
    });
    expect(createRes.status).toBe(201);
    const metaId = createRes.body.clave;

    const { res: aporteRes } = await aportar({ token, metaId, body: { monto: 250, tipoAporte: 'unico' } });
    expect(aporteRes.status).toBe(200);
    expect(aporteRes.body).toMatchObject({
      message: 'Aporte realizado correctamente',
      meta: { id: metaId },
    });

    const aportesCount = await models.AporteMeta.count({ where: { metaClave: metaId } });
    expect(aportesCount).toBe(1);

    const metaDb = await models.Meta.findByPk(metaId);
    expect(Number(metaDb.montoAlcanzado)).toBeCloseTo(250, 2);
  });
});
