const db = require("../db/database");

// GET /api/chargers
function getChargers(req, res) {
  try {
    const chargers = db
      .prepare(`
        SELECT
          charger_id,
          owner_id,
          charger_name,
          latitude,
          longitude,
          connector_type,
          power_kw,
          price_per_kwh,
          is_available,
          created_at
        FROM chargers
        WHERE is_available = 1
        ORDER BY charger_id DESC
      `)
      .all();

    return res.status(200).json({
      success: true,
      count: chargers.length,
      data: chargers,
    });
  } catch (error) {
    console.error("Get chargers error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch charging points",
    });
  }
}

// GET /api/chargers/:id
function getChargerById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid charger ID",
      });
    }

    const charger = db
      .prepare("SELECT * FROM chargers WHERE charger_id = ?")
      .get(id);

    if (!charger) {
      return res.status(404).json({
        success: false,
        message: "Charging point not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: charger,
    });
  } catch (error) {
    console.error("Get charger error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch charging point",
    });
  }
}

// POST /api/chargers
function createCharger(req, res) {
  try {
    const {
      owner_id,
      charger_name,
      latitude,
      longitude,
      connector_type,
      power_kw,
      price_per_kwh,
      is_available,
    } = req.body;

    if (
      !Number.isInteger(owner_id) ||
      owner_id <= 0 ||
      typeof charger_name !== "string" ||
      !charger_name.trim() ||
      typeof latitude !== "number" ||
      latitude < -90 ||
      latitude > 90 ||
      typeof longitude !== "number" ||
      longitude < -180 ||
      longitude > 180 ||
      typeof connector_type !== "string" ||
      !connector_type.trim() ||
      typeof power_kw !== "number" ||
      !Number.isFinite(power_kw) ||
      power_kw <= 0 ||
      (price_per_kwh !== undefined &&
        (typeof price_per_kwh !== "number" ||
          !Number.isFinite(price_per_kwh) ||
          price_per_kwh < 0)) ||
      (is_available !== undefined &&
        typeof is_available !== "boolean")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing charging point details",
      });
    }

    const result = db
      .prepare(`
        INSERT INTO chargers (
          owner_id,
          charger_name,
          latitude,
          longitude,
          connector_type,
          power_kw,
          price_per_kwh,
          is_available
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        owner_id,
        charger_name.trim(),
        latitude,
        longitude,
        connector_type.trim(),
        power_kw,
        price_per_kwh ?? 0,
        is_available === undefined ? 1 : Number(is_available)
      );

    const charger = db
      .prepare("SELECT * FROM chargers WHERE charger_id = ?")
      .get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: "Charging point registered successfully",
      data: charger,
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
      return res.status(400).json({
        success: false,
        message: "The specified owner does not exist",
      });
    }

    console.error("Create charger error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to register charging point",
    });
  }
}

// PATCH /api/chargers/:id/availability
function updateChargerAvailability(req, res) {
  try {
    const id = Number(req.params.id);
    const { is_available } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid charger ID",
      });
    }

    if (typeof is_available !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "is_available must be true or false",
      });
    }

    const result = db
      .prepare(`
        UPDATE chargers
        SET is_available = ?
        WHERE charger_id = ?
      `)
      .run(Number(is_available), id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Charging point not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Charging point availability updated successfully",
    });
  } catch (error) {
    console.error("Update charger availability error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update availability",
    });
  }
}

// DELETE /api/chargers/:id
function deleteCharger(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid charger ID",
      });
    }

    const result = db
      .prepare("DELETE FROM chargers WHERE charger_id = ?")
      .run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Charging point not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Charging point deleted successfully",
    });
  } catch (error) {
    console.error("Delete charger error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete charging point",
    });
  }
}

module.exports = {
  getChargers,
  getChargerById,
  createCharger,
  updateChargerAvailability,
  deleteCharger,
};