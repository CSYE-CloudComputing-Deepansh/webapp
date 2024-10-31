const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const multer = require("multer");
const registerRouter = require("../app/routes/index.js");
const sequelize = require("./db.js");
const logger = require("./utility/logger");
const StatsD = require("lynx");
require("dotenv").config(); // Load environment variables from .env file

const app = express(); // Create an Express app instance

// StatsD Configuration
const statsdClient = new StatsD(process.env.STATSD_HOST || "localhost", process.env.STATSD_PORT || 8125);

// CORS and Security middleware
app.use(helmet());
app.use(cors());

// File upload configuration using Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type, only JPEG and PNG are allowed!"), false);
    }
  },
});

// Sync database and create tables
sequelize
  .sync({ alter: true })
  .then(() => {
    logger.info("Database & tables are created");
  })
  .catch((err) => {
    logger.error(`Error creating database & tables: ${err.message}`);
  });

// Global Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", express.static("public"));

// Log incoming requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  statsdClient.increment(`api.${req.method}.${req.url.replace("/", "")}.call`);
  next();
});

// Initialize routes
registerRouter(app, upload);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  statsdClient.increment("api.error"); // Increment error metric in StatsD

  if (err.message === "Invalid file type, only JPEG and PNG are allowed!") {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

module.exports = app;
