const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "ChargeShare backend is running",
  });
});

const userRoutes = require("./routes/userRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const chargerRoutes = require("./routes/chargerRoutes");
const requestRoutes = require("./routes/requestRoutes");
const matchingRoutes = require("./routes/matchingRoutes");

app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/chargers", chargerRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/match", matchingRoutes);

module.exports = app;