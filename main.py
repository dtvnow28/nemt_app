from fastapi import FastAPI, Request, Form, UploadFile, File
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import shutil
from pathlib import Path
from database import get_connection, init_db

app = FastAPI()
init_db()

BASE_DIR = Path(__file__).parent
UPLOADS_DIR = BASE_DIR / 'static' / 'uploads'
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app.mount('/static', StaticFiles(directory=BASE_DIR / 'static'), name='static')
templates = Jinja2Templates(directory=BASE_DIR / 'templates')

def save_upload(file: UploadFile, prefix=''):
    if not file or not file.filename:
        return ''
    dest = UPLOADS_DIR / f"{prefix}_{file.filename}"
    with dest.open('wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    return f"/static/uploads/{dest.name}"

@app.get('/')
def home(request: Request):
    return templates.TemplateResponse('index.html', {'request': request})

@app.get('/clients')
def list_clients(request: Request):
    conn = get_connection()
    clients = conn.execute('SELECT * FROM clients').fetchall()
    conn.close()
    return templates.TemplateResponse('clients.html', {'request': request, 'clients': clients})

@app.get('/clients/new')
def new_client(request: Request):
    return templates.TemplateResponse('client_form.html', {'request': request, 'client': None, 'drop_offs': []})

@app.post('/clients')
async def create_client(
    request: Request,
    first_name: str = Form(...),
    last_name: str = Form(...),
    dob: str = Form(''),
    gender: str = Form(''),
    ssn: str = Form(''),
    address: str = Form(''),
    city: str = Form(''),
    state: str = Form(''),
    zip: str = Form(''),
    phone: str = Form(''),
    email: str = Form(''),
    insurance_carrier: str = Form(''),
    policy_number: str = Form(''),
    group_number: str = Form(''),
    photo_id: UploadFile = File(None),
    ins_card_front: UploadFile = File(None),
    ins_card_back: UploadFile = File(None)
):
    photo_id_path = save_upload(photo_id, 'photoid')
    ins_card_front_path = save_upload(ins_card_front, 'insfront')
    ins_card_back_path = save_upload(ins_card_back, 'insback')
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO clients (first_name, last_name, dob, gender, ssn, address, city, state, zip, phone, email,
        insurance_carrier, policy_number, group_number, photo_id_path, ins_card_front_path, ins_card_back_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        first_name, last_name, dob, gender, ssn, address, city, state, zip, phone, email,
        insurance_carrier, policy_number, group_number, photo_id_path, ins_card_front_path, ins_card_back_path
    ))
    client_id = c.lastrowid
    form_data = await request.form()
    for key, value in form_data.items():
        if key.startswith('drop_off_') and value:
            c.execute('INSERT INTO drop_offs (client_id, address) VALUES (?, ?)', (client_id, value))
    conn.commit()
    conn.close()
    return RedirectResponse(url='/clients', status_code=303)

@app.get('/clients/{client_id}')
def view_client(request: Request, client_id: int):
    conn = get_connection()
    client = conn.execute('SELECT * FROM clients WHERE client_id=?', (client_id,)).fetchone()
    drop_offs = conn.execute('SELECT * FROM drop_offs WHERE client_id=?', (client_id,)).fetchall()
    conn.close()
    return templates.TemplateResponse('client_form.html', {'request': request, 'client': client, 'drop_offs': drop_offs})
