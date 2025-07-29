import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / 'nemt.db'

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS clients (
            client_id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT,
            last_name TEXT,
            dob TEXT,
            gender TEXT,
            ssn TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            zip TEXT,
            phone TEXT,
            email TEXT,
            insurance_carrier TEXT,
            policy_number TEXT,
            group_number TEXT,
            photo_id_path TEXT,
            ins_card_front_path TEXT,
            ins_card_back_path TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS drop_offs (
            drop_off_id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER,
            address TEXT,
            FOREIGN KEY (client_id) REFERENCES clients(client_id)
        )
    ''')
    conn.commit()
    conn.close()
