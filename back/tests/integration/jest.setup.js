const { sequelize } = require('../../models');

const TRUNCATE_ORDER = [
  'aportesMetas',
  'planesDeAhorro',
  'metasFinancieras',
  'ingresos',
  'egresos',
  'ahorradoresInteligentes',
];

const truncateAll = async () => {
  const qi = sequelize.getQueryInterface();
  for (const table of TRUNCATE_ORDER) {
    await qi.bulkDelete(table, null, { truncate: true, cascade: true });
  }
};

beforeAll(async () => {
  await sequelize.sync({ force: false });
  await truncateAll();
});

afterEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await truncateAll();
  await sequelize.close();
});
