const { findMatches } = require("../services/matchingService");

// POST /api/match
async function matchDriver(req, res) {
  try {
    const {
      mode,
      batteryPercent,
      location,
      vehicle,
      requiredEnergyKwh,
    } = req.body;

    if (
      !["V2V", "V2L", "V2H", "V2G", "CHARGING_POINT"].includes(mode)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid matching mode",
      });
    }

    if (
      !Number.isInteger(batteryPercent) ||
      batteryPercent < 0 ||
      batteryPercent > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "batteryPercent must be an integer from 0 to 100",
      });
    }

    if (
      !location ||
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number" ||
      location.latitude < -90 ||
      location.latitude > 90 ||
      location.longitude < -180 ||
      location.longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid location coordinates are required",
      });
    }

    if (
      !vehicle ||
      typeof vehicle.connectorType !== "string" ||
      !vehicle.connectorType.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "vehicle.connectorType is required",
      });
    }

    if (
      mode === "V2V" &&
      (
        typeof vehicle.v2vProtocol !== "string" ||
        !vehicle.v2vProtocol.trim() ||
        typeof requiredEnergyKwh !== "number" ||
        !Number.isFinite(requiredEnergyKwh) ||
        requiredEnergyKwh <= 0 ||
        requiredEnergyKwh > 200
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "V2V matching requires vehicle.v2vProtocol and requiredEnergyKwh between 0 and 200",
      });
    }

    const matchRequest = {
      mode,
      batteryPercent,
      location,
      vehicle,
    };

    if (requiredEnergyKwh !== undefined) {
      matchRequest.requiredEnergyKwh = requiredEnergyKwh;
    }

    const result = await findMatches(matchRequest);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Matching error:", error.message);

    if (error.details) {
      return res.status(502).json({
        success: false,
        message: "Python matching service rejected the request",
        details: error.details,
      });
    }

    if ([503, 504].includes(error.status)) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to find rescue matches",
    });
  }
}

module.exports = { matchDriver };