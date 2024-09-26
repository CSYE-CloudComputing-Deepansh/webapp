import Sequelize from 'sequelize';


const sequelize = new Sequelize(process.env.DB_CONN_STRING+"//"+process.env.DB_USERNAME+":"+process.env.DB_PASSWORD+"@"+process.env.DB_INSTANCE+"/"+process.env.DB_NAME)
try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}
export default sequelize;
