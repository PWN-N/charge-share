const express = require("express");
const router = express.Router();

const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicleAvailability,
  deleteVehicle,
} = require("../controllers/vehicleController");

router.get("/", getVehicles);
router.get("/:id", getVehicleById);
router.post("/", createVehicle);
router.patch("/:id/availability", updateVehicleAvailability);
router.delete("/:id", deleteVehicle);

module.exports = router;