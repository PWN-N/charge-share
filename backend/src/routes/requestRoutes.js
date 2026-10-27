const express = require("express");
const router = express.Router();

const {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
} = require("../controllers/requestController");

router.post("/", createRequest);
router.get("/", getRequests);
router.get("/:id", getRequestById);
router.patch("/:id/status", updateRequestStatus);

module.exports = router;