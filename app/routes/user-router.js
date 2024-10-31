const express = require("express");
const userController = require("../controllers/user-controller.js");
const user = require("../Model/user-model.js");
const { basicAuth } = require("../utility/authChecker.js");
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
  .get(basicAuth, userController.getUser)
  .put(basicAuth,userController.updateUser)
  .head((request,response) => {
    response.status(405).set('Cache-Control', 'no-cache').send();
  })
  .all((request,response) => {
    response.status(405).set('Cache-Control', 'no-cache').send();
  });

  try{
  userRouter
  .route("/self/pic")
  .get(basicAuth, userController.getProfilePic)
  .post(basicAuth, upload.single('file'), userController.saveProfilePic)
  .delete(basicAuth, userController.deleteProfilePic)
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