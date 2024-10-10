const express =  require("express") ;
const healthzController = require("../controllers/healthz-controller.js");

const healthzRouter = express.Router();
healthzRouter
  .route("/")
  .get(healthzController.gethealthz)
  .all((request,response) => {
    response.status(405).set('Cache-Control', 'no-cache').send();
  });

module.exports = healthzRouter;