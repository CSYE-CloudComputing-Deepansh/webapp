const express = require("express");
const userController = require("../controllers/user-controller.js");
const user = require("../Model/user-model.js");
const { basicAuth, verifyUserMiddleware } = require("../utility/authChecker.js");
const upload = require("../utility/upload-config.js")


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
  .get(basicAuth, verifyUserMiddleware, userController.getUser)
  .put(basicAuth, verifyUserMiddleware, userController.updateUser)
  .head((request,response) => {
    response.status(405).set('Cache-Control', 'no-cache').send();
  })
  .all((request,response) => {
    response.status(405).set('Cache-Control', 'no-cache').send();
  });

  try{
  userRouter
  .route("/self/pic")
  .get(basicAuth, verifyUserMiddleware, userController.getProfilePic)
  .post(basicAuth, verifyUserMiddleware, upload.single('file'), userController.saveProfilePic)
  .delete(basicAuth, verifyUserMiddleware, userController.deleteProfilePic)
  .head((request,response) => {
    response.status(405).set('Cache-Control', 'no-cache').send();
  })
  .all((request,response) => {
    response.status(405).set('Cache-Control', 'no-cache').send();
  });
}
catch(err){
  return res.status(500).json({ message: "Error Multer", error: error.message });
}

module.exports= userRouter;