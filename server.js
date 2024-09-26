import express from 'express'
import initialize from './app/app.js'
// import db  from "./app/db.js"; 
// import executeQuery from './app/db.js';
const app = express();
const port = 8000; // You can change the port number if needed


initialize(app)
// Define a route
app.get('/', async (req, res) => {
  // const result = await db.executeStatement();
  res.send('Hello, World!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);

});
