const axios = require("axios");

const PYTHON_API_URL =
  process.env.PYTHON_API_URL || "http://127.0.0.1:8000";

async function findMatches(matchRequest) {
  try {
    const response = await axios.post(
      `${PYTHON_API_URL}/match`,
      matchRequest,
      {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      const details = error.response.data;

      const serviceError = new Error(
        "Python matching service rejected the request"
      );

      serviceError.status = error.response.status;
      serviceError.details = details;

      throw serviceError;
    }

    if (error.code === "ECONNREFUSED") {
      const serviceError = new Error(
        "Python matching service is not running"
      );

      serviceError.status = 503;

      throw serviceError;
    }

    if (error.code === "ECONNABORTED") {
      const serviceError = new Error(
        "Python matching service timed out"
      );

      serviceError.status = 504;

      throw serviceError;
    }

    throw error;
  }
}

module.exports = { findMatches };