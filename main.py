from fastapi import FastAPI, Form, Request, HTTPException
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.datastructures import URL

import uvicorn
from pathlib import Path

from . import database


BASE_DIR = Path(__file__).resolve().parent
app = FastAPI(title="NEMT Management App")

# Mount static files
static_dir = BASE_DIR / "static"
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Templates
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


@app.on_event("startup")
def startup_event():
    # Initialize the database
    database.init_db()


@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# ---- Clients ----
@app.get("/clients", response_class=HTMLResponse)
def list_clients(request: Request):
    conn = database.get_connection()
    clients = conn.execute("SELECT * FROM clients").fetchall()
    conn.close()
    return templates.TemplateResponse("clients.html", {"request": request, "clients": clients})


@app.get("/clients/new", response_class=HTMLResponse)
def new_client(request: Request):
    return templates.TemplateResponse("client_form.html", {"request": request})


@app.post("/clients")
async def create_client(
    first_name: str = Form(...),
    last_name: str = Form(...),
    dob: str = Form(""),
    gender: str = Form(""),
    ssn: str = Form(""),
    address_line1: str = Form(""),
    city: str = Form(""),
    state: str = Form(""),
    zip: str = Form(""),
    phone: str = Form(""),
    email: str = Form(""),
    insurance_carrier: str = Form(""),
    policy_number: str = Form(""),
    group_number: str = Form(""),
    signature: str = Form(""),
):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO clients
        (first_name, last_name, dob, gender, ssn, address_line1, city, state, zip, phone, email, insurance_carrier, policy_number, group_number, signature)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (first_name, last_name, dob, gender, ssn, address_line1, city, state, zip, phone, email, insurance_carrier, policy_number, group_number, signature),
    )
    conn.commit()
    conn.close()
    return RedirectResponse(url="/clients", status_code=303)


# ---- Drivers ----
@app.get("/drivers", response_class=HTMLResponse)
def list_drivers(request: Request):
    conn = database.get_connection()
    drivers = conn.execute("SELECT * FROM drivers").fetchall()
    conn.close()
    return templates.TemplateResponse("drivers.html", {"request": request, "drivers": drivers})


@app.get("/drivers/new", response_class=HTMLResponse)
def new_driver(request: Request):
    return templates.TemplateResponse("driver_form.html", {"request": request})


@app.post("/drivers")
async def create_driver(
    first_name: str = Form(...),
    last_name: str = Form(...),
    license_number: str = Form(""),
    license_expiration: str = Form(""),
    employee_number: str = Form(""),
    phone: str = Form(""),
    assigned_vehicle_id: str = Form(""),
    cpr_cert_expiration: str = Form(""),
    first_aid_cert_expiration: str = Form(""),
    defensive_cert_expiration: str = Form(""),
):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO drivers
        (first_name, last_name, license_number, license_expiration, employee_number, phone, assigned_vehicle_id, cpr_cert_expiration, first_aid_cert_expiration, defensive_cert_expiration)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            first_name,
            last_name,
            license_number,
            license_expiration,
            employee_number,
            phone,
            assigned_vehicle_id or None,
            cpr_cert_expiration,
            first_aid_cert_expiration,
            defensive_cert_expiration,
        ),
    )
    conn.commit()
    conn.close()
    return RedirectResponse(url="/drivers", status_code=303)


# ---- Vehicles ----
@app.get("/vehicles", response_class=HTMLResponse)
def list_vehicles(request: Request):
    conn = database.get_connection()
    vehicles = conn.execute("SELECT * FROM vehicles").fetchall()
    conn.close()
    return templates.TemplateResponse("vehicles.html", {"request": request, "vehicles": vehicles})


@app.get("/vehicles/new", response_class=HTMLResponse)
def new_vehicle(request: Request):
    return templates.TemplateResponse("vehicle_form.html", {"request": request})


@app.post("/vehicles")
async def create_vehicle(
    make: str = Form(""),
    model: str = Form(""),
    license_plate: str = Form(""),
    year: str = Form(""),
    vin_number: str = Form(""),
    insurance_expiration: str = Form(""),
    registration_expiration: str = Form(""),
):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO vehicles
        (make, model, license_plate, year, vin_number, insurance_expiration, registration_expiration)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            make,
            model,
            license_plate,
            year,
            vin_number,
            insurance_expiration,
            registration_expiration,
        ),
    )
    conn.commit()
    conn.close()
    return RedirectResponse(url="/vehicles", status_code=303)


# ---- Trips ----
@app.get("/trips", response_class=HTMLResponse)
def list_trips(request: Request):
    conn = database.get_connection()
    trips = conn.execute(
        "SELECT t.*, c.first_name || ' ' || c.last_name as client_name, d.first_name || ' ' || d.last_name as driver_name, v.license_plate as vehicle_plate FROM trips t
         LEFT JOIN clients c ON t.client_id = c.client_id
         LEFT JOIN drivers d ON t.driver_id = d.driver_id
         LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id"
    ).fetchall()
    conn.close()
    return templates.TemplateResponse("trips.html", {"request": request, "trips": trips})


@app.get("/trips/new", response_class=HTMLResponse)
def new_trip(request: Request):
    conn = database.get_connection()
    clients = conn.execute("SELECT client_id, first_name || ' ' || last_name AS name FROM clients").fetchall()
    drivers = conn.execute("SELECT driver_id, first_name || ' ' || last_name AS name FROM drivers").fetchall()
    vehicles = conn.execute("SELECT vehicle_id, license_plate AS name FROM vehicles").fetchall()
    conn.close()
    return templates.TemplateResponse(
        "trip_form.html",
        {
            "request": request,
            "clients": clients,
            "drivers": drivers,
            "vehicles": vehicles,
        },
    )


@app.post("/trips")
async def create_trip(
    client_id: int = Form(...),
    driver_id: int = Form(...),
    vehicle_id: int = Form(...),
    trip_date: str = Form(""),
    pickup_time: str = Form(""),
    dropoff_time: str = Form(""),
    pickup_address: str = Form(""),
    pickup_zip: str = Form(""),
    destination_address: str = Form(""),
    destination_zip: str = Form(""),
    trip_reason: str = Form(""),
    pickup_type: str = Form(""),
    dropoff_type: str = Form(""),
    round_trip: str = Form("0"),
    mileage: float = Form(0.0),
    hcpcs_code: str = Form(""),
    modifier: str = Form(""),
    icd10_code: str = Form(""),
    prior_auth: str = Form(""),
):
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO trips
        (client_id, driver_id, vehicle_id, trip_date, pickup_time, dropoff_time, pickup_address, pickup_zip, destination_address, destination_zip, trip_reason, pickup_type, dropoff_type, round_trip, mileage, hcpcs_code, modifier, icd10_code, prior_auth)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            client_id,
            driver_id,
            vehicle_id,
            trip_date,
            pickup_time,
            dropoff_time,
            pickup_address,
            pickup_zip,
            destination_address,
            destination_zip,
            trip_reason,
            pickup_type,
            dropoff_type,
            1 if round_trip == "1" else 0,
            mileage,
            hcpcs_code,
            modifier,
            icd10_code,
            prior_auth,
        ),
    )
    conn.commit()
    conn.close()
    return RedirectResponse(url="/trips", status_code=303)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)