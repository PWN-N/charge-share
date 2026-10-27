const db = require("../db/database");
const bcrypt = require("bcryptjs");

// POST /api/users/register
async function registerUser(req, res) {
  try {
    const { full_name, email, password, phone } = req.body;

    // Validate input
    if (
      typeof full_name !== "string" ||
      !full_name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, valid email, and password of at least 8 characters are required",
      });
    }

    // Hash password before storing it
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user into SQLite database
    const result = db
      .prepare(`
        INSERT INTO users (full_name, email, password_hash, phone)
        VALUES (?, ?, ?, ?)
      `)
      .run(
        full_name.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        typeof phone === "string" && phone.trim()
          ? phone.trim()
          : null
      );

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user_id: Number(result.lastInsertRowid),
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
      },
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        success: false,
        message: "Email or phone number already registered",
      });
    }

    console.error("Register user error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to register user",
    });
  }
}

// GET /api/users
function getUsers(req, res) {
  try {
    const users = db
      .prepare(`
        SELECT user_id, full_name, email, phone, created_at
        FROM users
        ORDER BY user_id DESC
      `)
      .all();

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
}

module.exports = {
  registerUser,
  getUsers,
};