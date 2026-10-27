const express = require("express");
const router = express.Router();

const {
  matchDriver,
} = require("../controllers/matchingController");

router.post("/", matchDriver);

module.exports = router;