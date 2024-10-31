require("dotenv").config(); // Load environment variables from .env file
const app = require("./app/app.js"); // Import the already-initialized app

// Define the port and domain from environment variables or use defaults
const APP_DOMAIN = process.env.APP_DOMAIN || "localhost";
const PORT = process.env.APP_PORT || 8000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://${APP_DOMAIN}:${PORT}`);
});
