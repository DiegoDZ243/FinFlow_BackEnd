jest.mock('../../models', () => {
  const t = {
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  };

  return {
    models: {
      Meta: {
        create: jest.fn(),
        findByPk: jest.fn(),
        findAll: jest.fn(),
        update: jest.fn(),
      },
      PlanDeAhorro: {
        create: jest.fn(),
        findAll: jest.fn(),
      },
      Ahorrador: {},
      AporteMeta: {
        create: jest.fn(),
        count: jest.fn(),
        sum: jest.fn(),
      },
    },
    sequelize: {
      transaction: jest.fn().mockResolvedValue(t),
    },
  };
});

jest.mock('../../services/metaMontoSync', () => ({
  ensureLegacyMontoMigrated: jest.fn().mockResolvedValue(undefined),
  recalcularMontoAlcanzado: jest.fn().mockResolvedValue('0.00'),
}));

const {
  crearMeta,
  obtenerTodasMetas,
  obtenerMetaPorId,
  actualizarMeta,
  eliminarMeta,
  obtenerProgreso,
  aportarMeta,
  crearPlanDeAhorro,
  obtenerPlanDeMeta,
} = require('../../controllers/metaController');
const { models } = require('../../models');
const { ensureLegacyMontoMigrated, recalcularMontoAlcanzado } = require('../../services/metaMontoSync');

const { Meta, PlanDeAhorro, AporteMeta } = models;

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const getMockTransaction = () => require('../../models').sequelize.transaction.mock.results[0]?.value;

const createMockMeta = (overrides = {}) => ({
  clave: 'uuid-123',
  identificador: 'Meta test',
  montoObjetivo: 10000,
  montoAlcanzado: 0,
  fechaInicio: '2026-01-01',
  fechaLimite: '2026-12-31',
  descripcion: 'Prueba',
  ahorradorId: 1,
  update: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(undefined),
  ...overrides
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  console.error.mockRestore();
});

describe('crearMeta', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        identificador: 'Meta test',
        montoObjetivo: 10000,
        montoAlcanzado: 0,
        fechaInicio: '2026-01-01',
        fechaLimite: '2026-12-31',
        descripcion: 'Prueba',
      },
      user: { id: 1 },
    };

    res = makeRes();
  });

  test('debe crear una meta y devolver 201', async () => {
    const nuevaMeta = { id: 1, ...req.body, ahorradorId: 1 };

    Meta.create.mockResolvedValue(nuevaMeta);

    await crearMeta(req, res);

    expect(Meta.create).toHaveBeenCalledWith({
      identificador: 'Meta test',
      montoObjetivo: 10000,
      montoAlcanzado: 0,
      fechaInicio: '2026-01-01',
      fechaLimite: '2026-12-31',
      descripcion: 'Prueba',
      ahorradorId: 1,
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(nuevaMeta);
  });

  test('debe devolver 400 si faltan campos obligatorios', async () => {
    req.body.identificador = null;

    await crearMeta(req, res);

    expect(Meta.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Todos los campos requeridos deben ser proporcionados',
    });
  });

  test('debe devolver 500 si ocurre un error', async () => {
    Meta.create.mockRejectedValue(new Error('Error BD'));

    await crearMeta(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error interno del servidor',
    });
  });
});

describe('obtenerTodasMetas', () => {
  test('devuelve todas las metas del ahorrador', async () => {
    const req = { user: { id: 10 } };
    const res = makeRes();

    Meta.findAll.mockResolvedValue([{ clave: 'm1' }, { clave: 'm2' }]);

    await obtenerTodasMetas(req, res);

    expect(Meta.findAll).toHaveBeenCalledWith({ where: { ahorradorId: 10 } });
    expect(res.json).toHaveBeenCalledWith([{ clave: 'm1' }, { clave: 'm2' }]);
  });

  test('devuelve 500 si ocurre un error', async () => {
    const req = { user: { id: 10 } };
    const res = makeRes();

    Meta.findAll.mockRejectedValue(new Error('Error BD'));

    await obtenerTodasMetas(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});

describe('obtenerMetaPorId', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: 'uuid-123' },
      user: { id: 1 },
    };

    res = makeRes();
  });

  test('debe devolver la meta si existe y pertenece al usuario', async () => {
    const meta = createMockMeta();
    Meta.findByPk.mockResolvedValue(meta);

    await obtenerMetaPorId(req, res);

    expect(Meta.findByPk).toHaveBeenCalledWith('uuid-123');
    expect(res.json).toHaveBeenCalledWith(meta);
  });

  test('debe devolver 404 si la meta no existe', async () => {
    Meta.findByPk.mockResolvedValue(null);

    await obtenerMetaPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Meta no encontrada' });
  });

  test('debe devolver 403 si la meta pertenece a otro usuario', async () => {
    Meta.findByPk.mockResolvedValue(createMockMeta({ ahorradorId: 2 }));

    await obtenerMetaPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'No tiene permiso para acceder a esta meta' });
  });

  test('debe devolver 500 si ocurre un error', async () => {
    Meta.findByPk.mockRejectedValue(new Error('Error BD'));

    await obtenerMetaPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});

describe('obtenerProgreso', () => {
  test('devuelve progreso, porcentaje y faltante', async () => {
    const req = { params: { id: 'uuid-123' }, user: { id: 1 } };
    const res = makeRes();

    Meta.findByPk.mockResolvedValue(
      createMockMeta({
        montoObjetivo: '1000.00',
        montoAlcanzado: '250.00',
      })
    );

    await obtenerProgreso(req, res);

    expect(res.json).toHaveBeenCalledWith({
      metaId: 'uuid-123',
      montoAlcanzado: 250,
      montoObjetivo: 1000,
      porcentaje: 25,
      faltan: 750,
    });
  });

  test('devuelve 404 si meta no existe', async () => {
    const req = { params: { id: 'uuid-123' }, user: { id: 1 } };
    const res = makeRes();

    Meta.findByPk.mockResolvedValue(null);

    await obtenerProgreso(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Meta no encontrada' });
  });

  test('devuelve 403 si no pertenece al usuario', async () => {
    const req = { params: { id: 'uuid-123' }, user: { id: 1 } };
    const res = makeRes();

    Meta.findByPk.mockResolvedValue(createMockMeta({ ahorradorId: 2 }));

    await obtenerProgreso(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'No tiene permiso para acceder a esta meta' });
  });

  test('devuelve 500 si ocurre un error', async () => {
    const req = { params: { id: 'uuid-123' }, user: { id: 1 } };
    const res = makeRes();

    Meta.findByPk.mockRejectedValue(new Error('Error BD'));

    await obtenerProgreso(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});

describe('actualizarMeta', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: 'uuid-123' },
      body: {
        identificador: 'Meta actualizada',
        montoObjetivo: 20000,
        montoAlcanzado: 5000,
        fechaInicio: '2026-02-01',
        fechaLimite: '2026-11-30',
        descripcion: 'Actualizada',
        estado: true,
      },
      user: { id: 1 },
    };

    res = makeRes();
  });

  test('debe actualizar la meta y devolver 200', async () => {
    const meta = createMockMeta();
    Meta.findByPk.mockResolvedValue(meta);

    await actualizarMeta(req, res);

    expect(Meta.findByPk).toHaveBeenCalledWith('uuid-123');
    expect(meta.update).toHaveBeenCalledWith({
      identificador: 'Meta actualizada',
      montoObjetivo: 20000,
      montoAlcanzado: 5000,
      fechaInicio: '2026-02-01',
      fechaLimite: '2026-11-30',
      descripcion: 'Actualizada',
      estado: true,
    });
    expect(res.json).toHaveBeenCalledWith(meta);
  });

  test('debe actualizar solo los campos proporcionados', async () => {
    const meta = createMockMeta({ estado: true });
    Meta.findByPk.mockResolvedValue(meta);
    req.body = { descripcion: 'Solo descripcion' };

    await actualizarMeta(req, res);

    expect(meta.update).toHaveBeenCalledWith({
      identificador: meta.identificador,
      montoObjetivo: meta.montoObjetivo,
      montoAlcanzado: meta.montoAlcanzado,
      fechaInicio: meta.fechaInicio,
      fechaLimite: meta.fechaLimite,
      descripcion: 'Solo descripcion',
      estado: meta.estado,
    });
  });

  test('debe devolver 404 si la meta no existe', async () => {
    Meta.findByPk.mockResolvedValue(null);

    await actualizarMeta(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Meta no encontrada' });
  });

  test('debe devolver 403 si la meta pertenece a otro usuario', async () => {
    Meta.findByPk.mockResolvedValue(createMockMeta({ ahorradorId: 2 }));

    await actualizarMeta(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'No tiene permiso para actualizar esta meta' });
  });

  test('debe devolver 500 si ocurre un error', async () => {
    Meta.findByPk.mockRejectedValue(new Error('Error BD'));

    await actualizarMeta(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});

describe('eliminarMeta', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: 'uuid-123' },
      user: { id: 1 },
    };

    res = makeRes();
  });

  test('debe eliminar la meta y devolver 200', async () => {
    const meta = createMockMeta();
    Meta.findByPk.mockResolvedValue(meta);

    await eliminarMeta(req, res);

    expect(Meta.findByPk).toHaveBeenCalledWith('uuid-123');
    expect(meta.destroy).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Meta eliminada correctamente' });
  });

  test('debe devolver 404 si la meta no existe', async () => {
    Meta.findByPk.mockResolvedValue(null);

    await eliminarMeta(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Meta no encontrada' });
  });

  test('debe devolver 403 si la meta pertenece a otro usuario', async () => {
    Meta.findByPk.mockResolvedValue(createMockMeta({ ahorradorId: 2 }));

    await eliminarMeta(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'No tiene permiso para eliminar esta meta' });
  });

  test('debe devolver 500 si ocurre un error', async () => {
    Meta.findByPk.mockRejectedValue(new Error('Error BD'));

    await eliminarMeta(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});

describe('aportarMeta', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: 'uuid-123' },
      user: { id: 1 },
      body: { monto: 250, tipoAporte: 'unico' },
    };
    res = makeRes();
  });

  test('devuelve 400 si monto es null/undefined/<=0 y hace rollback', async () => {
    req.body.monto = 0;

    await aportarMeta(req, res);

    const t = await getMockTransaction();
    expect(t.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Monto debe ser mayor a 0' });
    expect(Meta.findByPk).not.toHaveBeenCalled();
  });

  test('devuelve 404 si meta no existe y hace rollback', async () => {
    Meta.findByPk.mockResolvedValue(null);

    await aportarMeta(req, res);

    const t = await getMockTransaction();
    expect(Meta.findByPk).toHaveBeenCalledWith('uuid-123', { transaction: t });
    expect(t.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Meta no encontrada' });
  });

  test('devuelve 403 si meta no pertenece al usuario y hace rollback', async () => {
    Meta.findByPk.mockResolvedValue(createMockMeta({ ahorradorId: 2 }));

    await aportarMeta(req, res);

    const t = await getMockTransaction();
    expect(t.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'No tiene permiso para aportar a esta meta' });
  });

  test('devuelve 400 si el aporte excede el faltante y hace rollback', async () => {
    Meta.findByPk.mockResolvedValue(createMockMeta({ montoObjetivo: 1000, montoAlcanzado: 900 }));
    req.body.monto = 200;

    await aportarMeta(req, res);

    const t = await getMockTransaction();
    expect(t.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error).toContain('El aporte excede el objetivo');
    expect(AporteMeta.create).not.toHaveBeenCalled();
  });

  test('crea aporte, recalcula y hace commit', async () => {
    const meta = createMockMeta({ montoObjetivo: 1000, montoAlcanzado: 0 });
    Meta.findByPk.mockResolvedValue(meta);
    recalcularMontoAlcanzado.mockResolvedValue('250.00');

    await aportarMeta(req, res);

    const t = await getMockTransaction();
    expect(ensureLegacyMontoMigrated).toHaveBeenCalledWith(meta, { transaction: t });
    expect(AporteMeta.create).toHaveBeenCalledWith(
      {
        metaClave: 'uuid-123',
        cantidad: 250,
        tipoAporte: 'unico',
        fechaAporte: expect.any(Date),
      },
      { transaction: t }
    );
    expect(recalcularMontoAlcanzado).toHaveBeenCalledWith('uuid-123', { transaction: t });
    expect(t.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: 'Aporte realizado correctamente',
      meta: {
        id: meta.clave,
        montoAlcanzado: 250,
        montoObjetivo: meta.montoObjetivo,
        porcentaje: 25,
      },
    });
  });

  test('hace rollback y devuelve 500 si ocurre un error', async () => {
    Meta.findByPk.mockRejectedValue(new Error('Error BD'));

    await aportarMeta(req, res);

    const t = await getMockTransaction();
    expect(t.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});

describe('crearPlanDeAhorro', () => {
  test('devuelve 400 si faltan campos', async () => {
    const req = { body: { metaId: null } };
    const res = makeRes();

    await crearPlanDeAhorro(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Todos los campos requeridos deben ser proporcionados' });
    expect(PlanDeAhorro.create).not.toHaveBeenCalled();
  });

  test('devuelve 404 si meta no existe', async () => {
    const req = { body: { metaId: 'uuid-123', montoMensual: 100, mesesEstimados: 10, fechaInicio: '2026-01-01' } };
    const res = makeRes();

    Meta.findByPk.mockResolvedValue(null);

    await crearPlanDeAhorro(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Meta no encontrada' });
  });

  test('crea plan y devuelve 201', async () => {
    const req = { body: { metaId: 'uuid-123', montoMensual: 100, mesesEstimados: 10, fechaInicio: '2026-01-01' } };
    const res = makeRes();

    Meta.findByPk.mockResolvedValue(createMockMeta());
    PlanDeAhorro.create.mockResolvedValue({ clave: 'p1', metaId: 'uuid-123' });

    await crearPlanDeAhorro(req, res);

    expect(PlanDeAhorro.create).toHaveBeenCalledWith({
      metaId: 'uuid-123',
      montoMensual: 100,
      mesesEstimados: 10,
      fechaInicio: '2026-01-01',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ clave: 'p1', metaId: 'uuid-123' });
  });

  test('devuelve 500 si ocurre un error', async () => {
    const req = { body: { metaId: 'uuid-123', montoMensual: 100, mesesEstimados: 10, fechaInicio: '2026-01-01' } };
    const res = makeRes();

    Meta.findByPk.mockRejectedValue(new Error('Error BD'));

    await crearPlanDeAhorro(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});

describe('obtenerPlanDeMeta', () => {
  test('devuelve planes de una meta', async () => {
    const req = { params: { id: 'uuid-123' } };
    const res = makeRes();

    PlanDeAhorro.findAll.mockResolvedValue([{ clave: 'p1' }]);

    await obtenerPlanDeMeta(req, res);

    expect(PlanDeAhorro.findAll).toHaveBeenCalledWith({
      where: { metaId: 'uuid-123' },
      include: [{ model: Meta, as: 'meta' }],
    });
    expect(res.json).toHaveBeenCalledWith([{ clave: 'p1' }]);
  });

  test('devuelve 500 si ocurre un error', async () => {
    const req = { params: { id: 'uuid-123' } };
    const res = makeRes();

    PlanDeAhorro.findAll.mockRejectedValue(new Error('Error BD'));

    await obtenerPlanDeMeta(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});
