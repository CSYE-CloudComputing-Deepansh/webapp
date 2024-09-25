import sequelize from '../db.js';

export const gethealthz = async (request, response) => {
  try {
    if(request.body !== '{}'){
      console.log("No body required");
      console.log(request.body.length);
      console.log(request.body);
      response.status(403).set('Cache-Control', 'no-cache').send();
    }
    else{
      await sequelize.authenticate();
      console.log('Connection has been established successfully.');
      response.status(200).set('Cache-Control', 'no-cache').send();
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    response.status(503).set('Cache-Control', 'no-cache').send();
  }
}