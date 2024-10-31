const express = require("express");
const userController = require("../controllers/user-controller.js");
const user = require("../Model/user-model.js");
const { basicAuth } = require("../utility/authChecker.js");


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

  userRouter
  .route("/self/pic")
  .get(basicAuth, userController.getProfilePic)
  .post(basicAuth, userController.saveProfilePic)
  .delete(basicAuth, userController.deleteProfilePic)
  .head((request,response) => {
    response.status(405).set('Cache-Control', 'no-cache').send();
  })
  .all((request,response) => {
    response.status(405).set('Cache-Control', 'no-cache').send();
  });

module.exports= userRouter;