const express = require("express");
const verifyController = require("../controllers/verify-controller.js");

const verifyRouter = express.Router();
verifyRouter
  .route("/")
  .post(verifyController.verify)
  .head((request,response) => {
    response.status(405).set('Cache-Control', 'no-cache').send();
  })
  .all((request,response) => {
    response.status(405).set('Cache-Control', 'no-cache').send();
  });

  module.exports = verifyRouter;
  