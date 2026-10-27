const db = require("../db/database");

// GET /api/vehicles
function getVehicles(req, res) {
  try {
    const vehicles = db
      .prepare(`
        SELECT
          vehicle_id,
          owner_id,
          vehicle_name,
          registration_number,
          battery_percentage,
          latitude,
          longitude,
          connector_type,
          v2v_capable,
          is_available,
          created_at
        FROM vehicles
        WHERE is_available = 1
        ORDER BY vehicle_id DESC
      `)
      .all();

    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    console.error("Get vehicles error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles",
    });
  }
}

// GET /api/vehicles/:id
function getVehicleById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID",
      });
    }

    const vehicle = db
      .prepare(`
        SELECT *
        FROM vehicles
        WHERE vehicle_id = ?
      `)
      .get(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error("Get vehicle error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle",
    });
  }
}

// POST /api/vehicles
function createVehicle(req, res) {
  try {
    const {
      owner_id,
      vehicle_name,
      registration_number,
      battery_percentage,
      latitude,
      longitude,
      connector_type,
      v2v_capable,
      is_available,
    } = req.body;

    if (!owner_id || !vehicle_name) {
      return res.status(400).json({
        success: false,
        message: "owner_id and vehicle_name are required",
      });
    }

    if (
      battery_percentage !== undefined &&
      battery_percentage !== null &&
      (!Number.isFinite(battery_percentage) ||
        battery_percentage < 0 ||
        battery_percentage > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "battery_percentage must be between 0 and 100",
      });
    }

    const result = db
      .prepare(`
        INSERT INTO vehicles (
          owner_id,
          vehicle_name,
          registration_number,
          battery_percentage,
          latitude,
          longitude,
          connector_type,
          v2v_capable,
          is_available
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        owner_id,
        vehicle_name.trim(),
        registration_number || null,
        battery_percentage ?? null,
        latitude ?? null,
        longitude ?? null,
        connector_type || null,
        v2v_capable ? 1 : 0,
        is_available === undefined ? 1 : is_available ? 1 : 0
      );

    const vehicle = db
      .prepare("SELECT * FROM vehicles WHERE vehicle_id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: "Vehicle registered successfully",
      data: vehicle,
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
      return res.status(400).json({
        success: false,
        message: "The specified owner does not exist",
      });
    }

    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        success: false,
        message: "Registration number already exists",
      });
    }

    console.error("Create vehicle error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to register vehicle",
    });
  }
}

// PATCH /api/vehicles/:id/availability
function updateVehicleAvailability(req, res) {
  try {
    const id = Number(req.params.id);
    const { is_available } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID",
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
        UPDATE vehicles
        SET is_available = ?
        WHERE vehicle_id = ?
      `)
      .run(is_available ? 1 : 0, id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.json({
      success: true,
      message: "Vehicle availability updated successfully",
    });
  } catch (error) {
    console.error("Update availability error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update vehicle availability",
    });
  }
}

// DELETE /api/vehicles/:id
function deleteVehicle(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID",
      });
    }

    const result = db
      .prepare("DELETE FROM vehicles WHERE vehicle_id = ?")
      .run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Delete vehicle error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete vehicle",
    });
  }
}

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicleAvailability,
  deleteVehicle,
};