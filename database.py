import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parent / "nemt.db"


def get_connection():
    """Return a new database connection with row factory as dict."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they do not exist."""
    conn = get_connection()
    cur = conn.cursor()
    # Clients table
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS clients (
            client_id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            dob TEXT,
            gender TEXT,
            ssn TEXT,
            address_line1 TEXT,
            city TEXT,
            state TEXT,
            zip TEXT,
            phone TEXT,
            email TEXT,
            insurance_carrier TEXT,
            policy_number TEXT,
            group_number TEXT,
            signature TEXT
        )
        """
    )
    # Drivers table
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS drivers (
            driver_id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            license_number TEXT,
            license_expiration TEXT,
            employee_number TEXT,
            phone TEXT,
            assigned_vehicle_id INTEGER,
            cpr_cert_expiration TEXT,
            first_aid_cert_expiration TEXT,
            defensive_cert_expiration TEXT
        )
        """
    )
    # Vehicles table
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS vehicles (
            vehicle_id INTEGER PRIMARY KEY AUTOINCREMENT,
            make TEXT,
            model TEXT,
            license_plate TEXT,
            year TEXT,
            vin_number TEXT,
            insurance_expiration TEXT,
            registration_expiration TEXT
        )
        """
    )
    # Trips table
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS trips (
            trip_id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER,
            driver_id INTEGER,
            vehicle_id INTEGER,
            trip_date TEXT,
            pickup_time TEXT,
            dropoff_time TEXT,
            pickup_address TEXT,
            pickup_zip TEXT,
            destination_address TEXT,
            destination_zip TEXT,
            trip_reason TEXT,
            pickup_type TEXT,
            dropoff_type TEXT,
            round_trip INTEGER DEFAULT 0,
            mileage REAL,
            hcpcs_code TEXT,
            modifier TEXT,
            icd10_code TEXT,
            prior_auth TEXT,
            FOREIGN KEY(client_id) REFERENCES clients(client_id),
            FOREIGN KEY(driver_id) REFERENCES drivers(driver_id),
            FOREIGN KEY(vehicle_id) REFERENCES vehicles(vehicle_id)
        )
        """
    )
    conn.commit()
    conn.close()