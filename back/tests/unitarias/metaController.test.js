jest.mock('../../models', () => ({
  models: {
    Meta: {
      create: jest.fn(),
      findByPk: jest.fn()
    },
    PlanDeAhorro: {},
    Ahorrador: {},
    AporteMeta: {}
  },
  sequelize: {}
}));

const { crearMeta, obtenerMetaPorId, actualizarMeta, eliminarMeta } = require('../../controllers/metaController');
const { models } = require('../../models');
const Meta = models.Meta;

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

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
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

describe('obtenerMetaPorId', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: 'uuid-123' },
      user: { id: 1 },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
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

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
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

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
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
