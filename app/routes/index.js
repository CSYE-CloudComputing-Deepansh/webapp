import healthzRouter from "./healthz-router.js"

export default (app) => {
  console.log("index.js - router")
    app.use('/healthz',healthzRouter)
}