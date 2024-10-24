const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DB_CONN_STRING + "//" + process.env.DB_USERNAME + ":" + process.env.DB_PASSWORD + "@" + process.env.DB_INSTANCE + "/" + process.env.DB_NAME)
// try {
//const sequelize = new Sequelize("postgres://dbuser:password@localhost:5432/assignment")
//   await sequelize.authenticate();
//   console.log('Connection has been established successfully.');
// } catch (error) {
//   console.error('Unable to connect to the database:', error);
// }
module.exports = sequelize;