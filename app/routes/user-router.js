import express from "express";
import * as userController from "../controllers/user-controller.js"
import user from "../Model/user-model.js";
import {basicAuth} from "../utility/authChecker.js";

const userRouter = express.Router();
userRouter
  .route("/")
  // .get("/self",basicAuth, userController.getUser)
  .post(userController.saveUser)
  .head((request,response) => {
    response.status(405).set('Cache-Control', 'no-cache').send();
  })
  .all((request,response) => {
    response.status(405).set('Cache-Control', 'no-cache').send();
  });

  userRouter
  .route("/self")
  .get(basicAuth, userController.getUser)
  .put(basicAuth,userController.updateUser)
  .head((request,response) => {
    response.status(405).set('Cache-Control', 'no-cache').send();
  })
  .all((request,response) => {
    response.status(405).set('Cache-Control', 'no-cache').send();
  });

export default userRouter;