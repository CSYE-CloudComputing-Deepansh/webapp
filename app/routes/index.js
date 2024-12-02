require('dotenv').config();
const healthzRouter = require("./healthz-router.js");
const userRouter = require("./user-router.js");
const verifyRouter = require("./verify.js");

module.exports =  (app) => {
  console.log("index.js - router")
    app.use('/healthz',healthzRouter)
    app.use('/v1/user', userRouter)
    app.use('/verify', verifyRouter)
}