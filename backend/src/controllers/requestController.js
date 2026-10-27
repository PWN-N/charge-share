const db = require("../db/database");

// POST /api/requests
function createRequest(req, res) {
  try {
    const {
      requester_id,
      target_type,
      vehicle_id,
      charger_id,
      battery_percentage,
    } = req.body;

    if (
      !Number.isInteger(requester_id) ||
      requester_id <= 0 ||
      !["V2V", "CHARGER"].includes(target_type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid requester_id and target_type are required",
      });
    }

    if (
      battery_percentage !== undefined &&
      battery_percentage !== null &&
      (typeof battery_percentage !== "number" ||
        !Number.isFinite(battery_percentage) ||
        battery_percentage < 0 ||
        battery_percentage > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "battery_percentage must be between 0 and 100",
      });
    }

    if (
      (target_type === "V2V" &&
        (!Number.isInteger(vehicle_id) ||
          vehicle_id <= 0 ||
          charger_id !== undefined && charger_id !== null)) ||
      (target_type === "CHARGER" &&
        (!Number.isInteger(charger_id) ||
          charger_id <= 0 ||
          vehicle_id !== undefined && vehicle_id !== null))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "V2V requests require vehicle_id; CHARGER requests require charger_id",
      });
    }

    // Check that the selected target exists and is available.
    if (target_type === "V2V") {
      const vehicle = db
        .prepare(`
          SELECT vehicle_id
          FROM vehicles
          WHERE vehicle_id = ?
            AND is_available = 1
            AND v2v_capable = 1
        `)
        .get(vehicle_id);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Available V2V-capable vehicle not found",
        });
      }
    }

    if (target_type === "CHARGER") {
      const charger = db
        .prepare(`
          SELECT charger_id
          FROM chargers
          WHERE charger_id = ?
            AND is_available = 1
        `)
        .get(charger_id);

      if (!charger) {
        return res.status(404).json({
          success: false,
          message: "Available charging point not found",
        });
      }
    }

    const user = db
      .prepare("SELECT user_id FROM users WHERE user_id = ?")
      .get(requester_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Requester user not found",
      });
    }

    const result = db
      .prepare(`
        INSERT INTO charging_requests (
          requester_id,
          target_type,
          vehicle_id,
          charger_id,
          battery_percentage
        )
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(
        requester_id,
        target_type,
        target_type === "V2V" ? vehicle_id : null,
        target_type === "CHARGER" ? charger_id : null,
        battery_percentage ?? null
      );

    const request = db
      .prepare(`
        SELECT *
        FROM charging_requests
        WHERE request_id = ?
      `)
      .get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: "Charging request created successfully",
      data: request,
    });
  } catch (error) {
    console.error("Create request error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create charging request",
    });
  }
}

// GET /api/requests
function getRequests(req, res) {
  try {
    const requests = db
      .prepare(`
        SELECT
          cr.*,
          u.full_name AS requester_name,
          v.vehicle_name,
          c.charger_name
        FROM charging_requests cr
        JOIN users u ON u.user_id = cr.requester_id
        LEFT JOIN vehicles v ON v.vehicle_id = cr.vehicle_id
        LEFT JOIN chargers c ON c.charger_id = cr.charger_id
        ORDER BY cr.request_id DESC
      `)
      .all();

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Get requests error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch charging requests",
    });
  }
}

// GET /api/requests/:id
function getRequestById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID",
      });
    }

    const request = db
      .prepare(`
        SELECT
          cr.*,
          u.full_name AS requester_name,
          v.vehicle_name,
          c.charger_name
        FROM charging_requests cr
        JOIN users u ON u.user_id = cr.requester_id
        LEFT JOIN vehicles v ON v.vehicle_id = cr.vehicle_id
        LEFT JOIN chargers c ON c.charger_id = cr.charger_id
        WHERE cr.request_id = ?
      `)
      .get(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Charging request not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error("Get request error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch charging request",
    });
  }
}

// PATCH /api/requests/:id/status
function updateRequestStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = [
      "ACCEPTED",
      "REJECTED",
      "CANCELLED",
      "COMPLETED",
    ];

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const request = db
      .prepare(`
        SELECT request_id, status
        FROM charging_requests
        WHERE request_id = ?
      `)
      .get(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Charging request not found",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(409).json({
        success: false,
        message: "Only pending requests can be updated",
      });
    }

    const result = db
      .prepare(`
        UPDATE charging_requests
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE request_id = ? AND status = 'PENDING'
      `)
      .run(status, id);

    if (result.changes === 0) {
      return res.status(409).json({
        success: false,
        message: "Request status has already changed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Charging request status updated",
      data: {
        request_id: id,
        status,
      },
    });
  } catch (error) {
    console.error("Update request status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update request status",
    });
  }
}

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
};