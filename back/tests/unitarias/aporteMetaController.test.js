jest.mock('../../models', () => {
  const t = {
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  };

  return {
    models: {
      Meta: {
        findByPk: jest.fn(),
      },
      AporteMeta: {
        create: jest.fn(),
        findByPk: jest.fn(),
        findAll: jest.fn(),
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
  crearAporteMeta,
  actualizarAporteMeta,
  eliminarAporteMeta,
  listarAportesDeMeta,
} = require('../../controllers/aporteMetaController');

const { models, sequelize } = require('../../models');
const { ensureLegacyMontoMigrated, recalcularMontoAlcanzado } = require('../../services/metaMontoSync');

const { Meta, AporteMeta } = models;

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterAll(() => {
  console.error.mockRestore();
});

afterEach(() => {
  jest.clearAllMocks();
});

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const getMockTransaction = () => sequelize.transaction.mock.results[0]?.value;

describe('controllers/aporteMetaController', () => {
  describe('crearAporteMeta', () => {
    test('TCU-021 400 si faltan metaClave o cantidad y hace rollback', async () => {
      const req = { body: { metaClave: null, cantidad: null }, user: { id: 1 } };
      const res = makeRes();

      await crearAporteMeta(req, res);

      const t = await getMockTransaction();
      expect(t.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'metaClave y cantidad son requeridos' });
      expect(Meta.findByPk).not.toHaveBeenCalled();
    });

    test('TCU-022 404 si meta no existe y hace rollback', async () => {
      Meta.findByPk.mockResolvedValue(null);
      const req = { body: { metaClave: 'm1', cantidad: 10 }, user: { id: 1 } };
      const res = makeRes();

      await crearAporteMeta(req, res);

      const t = await getMockTransaction();
      expect(Meta.findByPk).toHaveBeenCalledWith('m1', { transaction: t });
      expect(t.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Meta no encontrada' });
    });

    test('TCU-023 403 si meta pertenece a otro usuario y hace rollback', async () => {
      Meta.findByPk.mockResolvedValue({ clave: 'm1', ahorradorId: 2 });
      const req = { body: { metaClave: 'm1', cantidad: 10 }, user: { id: 1 } };
      const res = makeRes();

      await crearAporteMeta(req, res);

      const t = await getMockTransaction();
      expect(t.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'No tiene permiso para aportar a esta meta' });
    });

    test('TCU-024 201 crea aporte, recalcula y hace commit', async () => {
      const meta = { clave: 'm1', ahorradorId: 1 };
      Meta.findByPk.mockResolvedValue(meta);
      AporteMeta.create.mockResolvedValue({ claveAporte: 1, metaClave: 'm1', cantidad: 10 });

      const req = {
        body: { metaClave: 'm1', cantidad: 10, tipoAporte: 'unico' },
        user: { id: 1 },
      };
      const res = makeRes();

      await crearAporteMeta(req, res);

      const t = await getMockTransaction();
      expect(ensureLegacyMontoMigrated).toHaveBeenCalledWith(meta, { transaction: t });
      expect(AporteMeta.create).toHaveBeenCalledWith(
        {
          metaClave: 'm1',
          cantidad: 10,
          tipoAporte: 'unico',
          fechaAporte: undefined,
        },
        { transaction: t }
      );
      expect(recalcularMontoAlcanzado).toHaveBeenCalledWith('m1', { transaction: t });
      expect(t.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ claveAporte: 1, metaClave: 'm1', cantidad: 10 });
    });

    test('TCU-025 500 si ocurre error y hace rollback', async () => {
      Meta.findByPk.mockRejectedValue(new Error('Error BD'));
      const req = { body: { metaClave: 'm1', cantidad: 10 }, user: { id: 1 } };
      const res = makeRes();

      await crearAporteMeta(req, res);

      const t = await getMockTransaction();
      expect(t.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    });
  });

  describe('actualizarAporteMeta', () => {
    test('TCU-026 404 si aporte no existe y hace rollback', async () => {
      AporteMeta.findByPk.mockResolvedValue(null);
      const req = { params: { id: '1' }, body: {}, user: { id: 1 } };
      const res = makeRes();

      await actualizarAporteMeta(req, res);

      const t = await getMockTransaction();
      expect(t.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Aporte no encontrado' });
    });

    test('TCU-027 403 si meta no pertenece al usuario y hace rollback', async () => {
      const aporte = { metaClave: 'm1', update: jest.fn() };
      AporteMeta.findByPk.mockResolvedValue(aporte);
      Meta.findByPk.mockResolvedValue({ clave: 'm1', ahorradorId: 2 });

      const req = { params: { id: '1' }, body: { cantidad: 5 }, user: { id: 1 } };
      const res = makeRes();

      await actualizarAporteMeta(req, res);

      const t = await getMockTransaction();
      expect(t.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'No tiene permiso para editar este aporte' });
      expect(aporte.update).not.toHaveBeenCalled();
    });

    test('TCU-028 actualiza y hace commit', async () => {
      const aporte = {
        metaClave: 'm1',
        cantidad: 10,
        tipoAporte: 'unico',
        fechaAporte: '2026-01-01',
        update: jest.fn().mockResolvedValue(true),
      };
      AporteMeta.findByPk.mockResolvedValue(aporte);
      Meta.findByPk.mockResolvedValue({ clave: 'm1', ahorradorId: 1 });

      const req = { params: { id: '1' }, body: { cantidad: 5, tipo: 'mensual' }, user: { id: 1 } };
      const res = makeRes();

      await actualizarAporteMeta(req, res);

      const t = await getMockTransaction();
      expect(aporte.update).toHaveBeenCalledWith(
        {
          cantidad: 5,
          tipoAporte: 'mensual',
          fechaAporte: aporte.fechaAporte,
        },
        { transaction: t }
      );
      expect(recalcularMontoAlcanzado).toHaveBeenCalledWith('m1', { transaction: t });
      expect(t.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(aporte);
    });
  });

  describe('eliminarAporteMeta', () => {
    test('TCU-029 404 si aporte no existe y hace rollback', async () => {
      AporteMeta.findByPk.mockResolvedValue(null);
      const req = { params: { id: '1' }, user: { id: 1 } };
      const res = makeRes();

      await eliminarAporteMeta(req, res);

      const t = await getMockTransaction();
      expect(t.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Aporte no encontrado' });
    });

    test('TCU-030 elimina y hace commit', async () => {
      const aporte = { metaClave: 'm1', destroy: jest.fn().mockResolvedValue(undefined) };
      AporteMeta.findByPk.mockResolvedValue(aporte);
      Meta.findByPk.mockResolvedValue({ clave: 'm1', ahorradorId: 1 });

      const req = { params: { id: '1' }, user: { id: 1 } };
      const res = makeRes();

      await eliminarAporteMeta(req, res);

      const t = await getMockTransaction();
      expect(aporte.destroy).toHaveBeenCalledWith({ transaction: t });
      expect(recalcularMontoAlcanzado).toHaveBeenCalledWith('m1', { transaction: t });
      expect(t.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Aporte eliminado correctamente' });
    });
  });

  describe('listarAportesDeMeta', () => {
    test('TCU-031 404 si meta no existe', async () => {
      Meta.findByPk.mockResolvedValue(null);
      const req = { params: { metaClave: 'm1' }, user: { id: 1 } };
      const res = makeRes();

      await listarAportesDeMeta(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Meta no encontrada' });
    });

    test('TCU-032 403 si meta no pertenece al usuario', async () => {
      Meta.findByPk.mockResolvedValue({ clave: 'm1', ahorradorId: 2 });
      const req = { params: { metaClave: 'm1' }, user: { id: 1 } };
      const res = makeRes();

      await listarAportesDeMeta(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'No tiene permiso para acceder a esta meta' });
      expect(AporteMeta.findAll).not.toHaveBeenCalled();
    });

    test('TCU-033 lista aportes con orden', async () => {
      Meta.findByPk.mockResolvedValue({ clave: 'm1', ahorradorId: 1 });
      AporteMeta.findAll.mockResolvedValue([{ claveAporte: 1 }]);

      const req = { params: { metaClave: 'm1' }, user: { id: 1 } };
      const res = makeRes();

      await listarAportesDeMeta(req, res);

      expect(AporteMeta.findAll).toHaveBeenCalledWith({
        where: { metaClave: 'm1' },
        order: [
          ['fechaAporte', 'DESC'],
          ['claveAporte', 'DESC'],
        ],
      });
      expect(res.json).toHaveBeenCalledWith([{ claveAporte: 1 }]);
    });
  });
});
