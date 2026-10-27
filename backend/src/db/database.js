const Database = require("better-sqlite3");
const path = require("path");

// Create or open the SQLite database
const dbPath = path.join(__dirname, "../../chargeshare.db");
const db = new Database(dbPath);

// Enable foreign key constraints
db.pragma("foreign_keys = ON");

// Create all required tables and indexes
db.exec(`
  -- 1. Users table
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT UNIQUE,

    driving_license_status TEXT NOT NULL DEFAULT 'NOT_SUBMITTED'
      CHECK (
        driving_license_status IN (
          'NOT_SUBMITTED',
          'PENDING',
          'VERIFIED',
          'REJECTED'
        )
      ),

    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- 2. Vehicles table
  CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    vehicle_name TEXT NOT NULL,
    registration_number TEXT UNIQUE,

    battery_percentage REAL
      CHECK (
        battery_percentage IS NULL
        OR battery_percentage BETWEEN 0 AND 100
      ),

    latitude REAL,
    longitude REAL,
    connector_type TEXT,

    v2v_capable INTEGER NOT NULL DEFAULT 0
      CHECK (v2v_capable IN (0, 1)),

    is_available INTEGER NOT NULL DEFAULT 0
      CHECK (is_available IN (0, 1)),

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (owner_id)
      REFERENCES users(user_id)
      ON DELETE CASCADE
  );

  -- 3. Charging points table
  CREATE TABLE IF NOT EXISTS chargers (
    charger_id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    charger_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    connector_type TEXT NOT NULL,

    power_kw REAL NOT NULL
      CHECK (power_kw > 0),

    price_per_kwh REAL NOT NULL DEFAULT 0
      CHECK (price_per_kwh >= 0),

    is_available INTEGER NOT NULL DEFAULT 1
      CHECK (is_available IN (0, 1)),

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (owner_id)
      REFERENCES users(user_id)
      ON DELETE CASCADE
  );

  -- 4. Charging requests table
  CREATE TABLE IF NOT EXISTS charging_requests (
    request_id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,

    target_type TEXT NOT NULL
      CHECK (target_type IN ('V2V', 'CHARGER')),

    vehicle_id INTEGER,
    charger_id INTEGER,

    battery_percentage REAL
      CHECK (
        battery_percentage IS NULL
        OR battery_percentage BETWEEN 0 AND 100
      ),

    status TEXT NOT NULL DEFAULT 'PENDING'
      CHECK (
        status IN (
          'PENDING',
          'ACCEPTED',
          'REJECTED',
          'CANCELLED',
          'COMPLETED'
        )
      ),

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    CHECK (
      (
        target_type = 'V2V'
        AND vehicle_id IS NOT NULL
        AND charger_id IS NULL
      )
      OR
      (
        target_type = 'CHARGER'
        AND charger_id IS NOT NULL
        AND vehicle_id IS NULL
      )
    ),

    FOREIGN KEY (requester_id)
      REFERENCES users(user_id)
      ON DELETE CASCADE,

    FOREIGN KEY (vehicle_id)
      REFERENCES vehicles(vehicle_id)
      ON DELETE CASCADE,

    FOREIGN KEY (charger_id)
      REFERENCES chargers(charger_id)
      ON DELETE CASCADE
  );

  -- 5. Driving licence verification table
  CREATE TABLE IF NOT EXISTS driving_license_verifications (
    verification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    license_number TEXT NOT NULL,
    document_path TEXT,

    verification_method TEXT NOT NULL
      CHECK (
        verification_method IN ('MANUAL', 'OCR', 'API')
      ),

    verification_status TEXT NOT NULL DEFAULT 'PENDING'
      CHECK (
        verification_status IN (
          'PENDING',
          'VERIFIED',
          'REJECTED'
        )
      ),

    verified_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(user_id)
      ON DELETE CASCADE
  );

  -- Indexes for faster queries
  CREATE INDEX IF NOT EXISTS idx_vehicles_owner
    ON vehicles(owner_id);

  CREATE INDEX IF NOT EXISTS idx_vehicles_availability
    ON vehicles(is_available, v2v_capable);

  CREATE INDEX IF NOT EXISTS idx_chargers_availability
    ON chargers(is_available, connector_type);

  CREATE INDEX IF NOT EXISTS idx_requests_status
    ON charging_requests(status);

  CREATE INDEX IF NOT EXISTS idx_requests_requester
    ON charging_requests(requester_id);

  CREATE INDEX IF NOT EXISTS idx_license_user
    ON driving_license_verifications(user_id);
`);

// Confirm successful initialization
console.log("SQLite database connected and tables initialized.");

// Export the database connection
module.exports = db;