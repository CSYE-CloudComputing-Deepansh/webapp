const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DB_CONN_STRING + "//" + process.env.DB_USERNAME + ":" + process.env.DB_PASSWORD + "@" + process.env.DB_INSTANCE + "/" + process.env.DB_NAME)
module.exports = sequelize;