import 'dotenv/config'
import healthzRouter from "./healthz-router.js"


export default (app) => {
  console.log("index.js - router")
  console.log(process.env.DB_CONN_STRING);
  //console.log(process.env.DB_CONN_STRING+"//"+process.env.DB_USERNAME+":"+process.env.DB_PASSWORD+"@"+process.env.DB_INSTANCE+"/"+process.env.DB_NAME);
    app.use('/healthz',healthzRouter)
}