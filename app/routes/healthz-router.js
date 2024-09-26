import express from "express";
import * as healthzController from "../controllers/healthz-controller.js"

const healthzRouter = express.Router();
healthzRouter
  .route("/")
  .get(healthzController.gethealthz)
  .all((request,response) => {
    response.status(405).set('Cache-Control', 'no-cache').send();
  });

export default healthzRouter;