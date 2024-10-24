require('dotenv').config();
const app = require('./app/app.js'); // Import the already-initialized app
const port = 8000; // Define the port

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
