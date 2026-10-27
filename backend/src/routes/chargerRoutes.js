const express = require("express");
const router = express.Router();

const {
  getChargers,
  getChargerById,
  createCharger,
  updateChargerAvailability,
  deleteCharger,
} = require("../controllers/chargerController");

router.get("/", getChargers);
router.get("/:id", getChargerById);
router.post("/", createCharger);
router.patch("/:id/availability", updateChargerAvailability);
router.delete("/:id", deleteCharger);

module.exports = router;