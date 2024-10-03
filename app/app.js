import express from "express";
import registerRouter from "../app/routes/index.js"
import sequelize from "./db.js"
import User from "./Model/user-model.js"
// import registerRouter from "./routes/index.js";

sequelize.sync({alter: true}).then(() => {
  console.log('Database & tables are created');
})
.catch((err) => {
  console.log("Error", err);
})

// receives an object of app and initializes it
const initialize = (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // Serve uploaded images statically
  app.use('/', express.static('public'));



  // Initialize Routes
  registerRouter(app);

};

export default initialize;
