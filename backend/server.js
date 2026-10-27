require("dotenv").config();

const app = require("./src/app");

// Initialize the SQLite database
require("./src/db/database");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ChargeShare backend running on port ${PORT}`);
});