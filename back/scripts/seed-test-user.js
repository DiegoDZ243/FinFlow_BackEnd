require('dotenv').config();

const bcrypt = require('bcryptjs');
const { sequelize, models } = require('../models');

async function seedTestUser() {
  await sequelize.sync({ force: false });

  const passwordHash = await bcrypt.hash('1234', 10);

  await models.ahorradoresInteligentes.findOrCreate({
    where: { email: 'c@mail.com' },
    defaults: {
      email: 'c@mail.com',
      password: passwordHash
    }
  });

  await sequelize.close();

  console.log('Usuario de prueba creado correctamente');
}

seedTestUser().catch((error) => {
  console.error('Error creando usuario de prueba:', error);
  process.exit(1);
});