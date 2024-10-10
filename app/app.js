const express = require("express");
const registerRouter = require("../app/routes/index.js");
const sequelize = require("./db.js");
const User = require("./Model/user-model.js");

const app = express(); // Create an Express app instance

// Sync database and create tables
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database & tables are created');
  })
  .catch((err) => {
    console.log("Error", err);
  });

// Initialize middleware, routes, etc.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', express.static('public'));

// Initialize routes
registerRouter(app);

// Export the app instance directly
module.exports = app;
