/*
 * Captain Med Go App
 *
 * This script manages the client and trip data, navigation between views,
 * and exporting records to an Excel file matching the provided template.
 */

(function() {
    // In‑memory state arrays. These will also persist in localStorage.
    let clients = [];
    let trips = [];

    // Cached DOM references
    const views = {
        list: document.getElementById('client-list-section'),
        addClient: document.getElementById('add-client-section'),
        addTrip: document.getElementById('add-trip-section')
    };
    const navHomeBtn = document.getElementById('nav-home');
    const navAddClientBtn = document.getElementById('nav-add-client');
    const navExportBtn = document.getElementById('nav-export');
    const addClientBtn = document.getElementById('add-client-btn');
    const clientTableBody = document.getElementById('client-table-body');
    const clientForm = document.getElementById('client-form');
    const clientFormTitle = document.getElementById('client-form-title');
    const cancelClientBtn = document.getElementById('cancel-client');
    const addTripBtnForClient = document.getElementById('add-trip-btn');
    const clientTripsContainer = document.getElementById('client-trips-container');
    const clientTripsBody = document.getElementById('client-trips-body');
    const tripForm = document.getElementById('trip-form');
    const cancelTripBtn = document.getElementById('cancel-trip');

    // Initialize application: load data and render list
    function init() {
        loadData();
        renderClientTable();
        attachEventHandlers();
        showView('list');
    }

    // Load state from localStorage
    function loadData() {
        try {
            const c = localStorage.getItem('cmg_clients');
            const t = localStorage.getItem('cmg_trips');
            clients = c ? JSON.parse(c) : [];
            trips = t ? JSON.parse(t) : [];
        } catch (e) {
            console.error('Error loading data:', e);
            clients = [];
            trips = [];
        }
    }

    // Save state to localStorage
    function saveData() {
        localStorage.setItem('cmg_clients', JSON.stringify(clients));
        localStorage.setItem('cmg_trips', JSON.stringify(trips));
    }

    // Display the selected view and hide others
    function showView(viewKey) {
        for (const key in views) {
            if (Object.hasOwnProperty.call(views, key)) {
                const section = views[key];
                if (key === viewKey) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            }
        }
    }

    // Render the client table on the main page
    function renderClientTable() {
        clientTableBody.innerHTML = '';
        if (clients.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 5;
            td.textContent = 'No clients yet. Click "Add New Client" to get started.';
            tr.appendChild(td);
            clientTableBody.appendChild(tr);
            return;
        }
        clients.forEach(client => {
            const tr = document.createElement('tr');
            const tripsCount = trips.filter(trip => trip.clientId === client.id).length;
            tr.innerHTML = `
                <td>${client.firstName || ''} ${client.lastName || ''}</td>
                <td>${client.phone || ''}</td>
                <td>${client.insuranceType || ''}</td>
                <td>${tripsCount}</td>
                <td>
                    <button class="secondary-btn" data-action="edit" data-id="${client.id}">Edit</button>
                    <button class="secondary-btn" data-action="delete" data-id="${client.id}">Delete</button>
                </td>
            `;
            clientTableBody.appendChild(tr);
        });
    }

    // Populate the client form for editing or resetting for new client
    function populateClientForm(client) {
        document.getElementById('client-id').value = client ? client.id : '';
        document.getElementById('first-name').value = client?.firstName || '';
        document.getElementById('last-name').value = client?.lastName || '';
        document.getElementById('dob').value = client?.dob || '';
        document.getElementById('ssn').value = client?.ssn || '';
        document.getElementById('phone').value = client?.phone || '';
        document.getElementById('email').value = client?.email || '';
        document.getElementById('mobility-type').value = client?.mobilityType || '';
        document.getElementById('insurance-type').value = client?.insuranceType || '';
        document.getElementById('authorization-number').value = client?.authorizationNumber || '';
        document.getElementById('broker-name').value = client?.brokerName || '';
        document.getElementById('emergency-contact-name').value = client?.emergencyContactName || '';
        document.getElementById('emergency-contact-phone').value = client?.emergencyContactPhone || '';
        document.getElementById('address').value = client?.address || '';
        document.getElementById('city').value = client?.city || '';
        document.getElementById('state').value = client?.state || '';
        document.getElementById('zip').value = client?.zip || '';
        document.getElementById('billing-notes').value = client?.billingNotes || '';
        // Clear file inputs; browsers won't prefill file values
        document.getElementById('photo-id').value = '';
        document.getElementById('insurance-photo').value = '';
        // Show Add Trip button and trips if editing an existing client
        if (client) {
            clientFormTitle.textContent = 'Edit Client';
            addTripBtnForClient.classList.remove('hidden');
            // Display existing trips for the client
            populateClientTrips(client.id);
        } else {
            clientFormTitle.textContent = 'Add Client';
            addTripBtnForClient.classList.add('hidden');
            clientTripsContainer.classList.add('hidden');
        }
    }

    // Populate trips for a specific client
    function populateClientTrips(clientId) {
        const clientTrips = trips.filter(trip => trip.clientId === clientId);
        if (clientTrips.length === 0) {
            clientTripsContainer.classList.add('hidden');
            clientTripsBody.innerHTML = '';
            return;
        }
        clientTripsContainer.classList.remove('hidden');
        clientTripsBody.innerHTML = '';
        clientTrips.forEach(trip => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${trip.tripDate || ''}</td>
                <td>${trip.pickupAddress || ''}</td>
                <td>${trip.dropoffAddress || ''}</td>
                <td>${trip.mileage || ''}</td>
            `;
            clientTripsBody.appendChild(tr);
        });
    }

    // Event handlers registration
    function attachEventHandlers() {
        // Navigation
        navHomeBtn.addEventListener('click', () => {
            renderClientTable();
            showView('list');
        });
        navAddClientBtn.addEventListener('click', () => {
            prepareAddClient();
        });
        navExportBtn.addEventListener('click', () => {
            exportToExcel();
        });
        // Add new client button
        addClientBtn.addEventListener('click', () => {
            prepareAddClient();
        });
        // Client table actions (edit/delete) - event delegation
        clientTableBody.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName.toLowerCase() === 'button') {
                const id = target.getAttribute('data-id');
                const action = target.getAttribute('data-action');
                if (action === 'edit') {
                    const client = clients.find(c => c.id === id);
                    if (client) {
                        populateClientForm(client);
                        showView('addClient');
                    }
                } else if (action === 'delete') {
                    deleteClient(id);
                }
            }
        });
        // Client form submission
        clientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveClientFromForm();
        });
        // Cancel client button
        cancelClientBtn.addEventListener('click', () => {
            showView('list');
        });
        // Add trip button inside client form
        addTripBtnForClient.addEventListener('click', () => {
            const clientId = document.getElementById('client-id').value;
            if (clientId) {
                prepareAddTrip(clientId);
            }
        });
        // Trip form submission
        tripForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveTripFromForm();
        });
        // Cancel trip button
        cancelTripBtn.addEventListener('click', () => {
            // Return to client form
            showView('addClient');
        });
    }

    // Prepare to add a new client: reset form and show it
    function prepareAddClient() {
        populateClientForm(null);
        showView('addClient');
    }

    // Save client information from form
    function saveClientFromForm() {
        const idField = document.getElementById('client-id');
        const clientId = idField.value || generateId();
        const isEdit = !!idField.value;
        const clientData = {
            id: clientId,
            firstName: document.getElementById('first-name').value.trim(),
            lastName: document.getElementById('last-name').value.trim(),
            dob: document.getElementById('dob').value,
            ssn: document.getElementById('ssn').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
            mobilityType: document.getElementById('mobility-type').value,
            insuranceType: document.getElementById('insurance-type').value.trim(),
            authorizationNumber: document.getElementById('authorization-number').value.trim(),
            brokerName: document.getElementById('broker-name').value.trim(),
            emergencyContactName: document.getElementById('emergency-contact-name').value.trim(),
            emergencyContactPhone: document.getElementById('emergency-contact-phone').value.trim(),
            address: document.getElementById('address').value.trim(),
            city: document.getElementById('city').value.trim(),
            state: document.getElementById('state').value.trim(),
            zip: document.getElementById('zip').value.trim(),
            billingNotes: document.getElementById('billing-notes').value.trim(),
            // We'll read the images separately
            photoIdData: null,
            insurancePhotoData: null
        };
        // Load images asynchronously and then save client
        const photoIdFile = document.getElementById('photo-id').files[0];
        const insurancePhotoFile = document.getElementById('insurance-photo').files[0];
        const imagePromises = [];
        if (photoIdFile) {
            imagePromises.push(readFileAsDataUrl(photoIdFile).then(data => {
                clientData.photoIdData = data;
            }));
        }
        if (insurancePhotoFile) {
            imagePromises.push(readFileAsDataUrl(insurancePhotoFile).then(data => {
                clientData.insurancePhotoData = data;
            }));
        }
        Promise.all(imagePromises).then(() => {
            if (isEdit) {
                const index = clients.findIndex(c => c.id === clientId);
                if (index >= 0) {
                    // Preserve existing images if not updated
                    clientData.photoIdData = clientData.photoIdData || clients[index].photoIdData;
                    clientData.insurancePhotoData = clientData.insurancePhotoData || clients[index].insurancePhotoData;
                    clients[index] = Object.assign({}, clients[index], clientData);
                }
            } else {
                clients.push(clientData);
            }
            saveData();
            renderClientTable();
            showView('list');
        });
    }

    // Delete a client and associated trips
    function deleteClient(clientId) {
        if (!confirm('Are you sure you want to delete this client?')) {
            return;
        }
        clients = clients.filter(c => c.id !== clientId);
        trips = trips.filter(trip => trip.clientId !== clientId);
        saveData();
        renderClientTable();
    }

    // Prepare to add a trip for a specific client
    function prepareAddTrip(clientId) {
        // Clear trip form
        tripForm.reset();
        document.getElementById('trip-client-id').value = clientId;
        showView('addTrip');
    }

    // Save trip information from form
    function saveTripFromForm() {
        const tripClientId = document.getElementById('trip-client-id').value;
        const tripData = {
            id: generateId(),
            clientId: tripClientId,
            tripDate: document.getElementById('trip-date').value,
            pickupTime: document.getElementById('pickup-time').value,
            dropoffTime: document.getElementById('dropoff-time').value,
            pickupAddress: document.getElementById('pickup-address').value.trim(),
            dropoffAddress: document.getElementById('dropoff-address').value.trim(),
            purposeOfVisit: document.getElementById('purpose-of-visit').value.trim(),
            driverName: document.getElementById('driver-name').value.trim(),
            vehicleUsed: document.getElementById('vehicle-used').value.trim(),
            mileage: document.getElementById('mileage').value,
            roundTrip: document.getElementById('round-trip').checked,
            signatureOnFile: document.getElementById('signature-on-file').checked,
            notes: document.getElementById('trip-notes').value.trim()
        };
        trips.push(tripData);
        saveData();
        // Update trips table if editing same client
        populateClientTrips(tripClientId);
        showView('addClient');
    }

    // Export data to Excel using SheetJS
    function exportToExcel() {
        if (trips.length === 0) {
            alert('There are no trips to export.');
            return;
        }
        // Build rows based on the provided template columns
        const rows = [];
        trips.forEach(trip => {
            const client = clients.find(c => c.id === trip.clientId);
            if (!client) return;
            const row = {
                'Full Name': `${client.firstName || ''} ${client.lastName || ''}`.trim(),
                'Date of Birth': client.dob || '',
                'Medi-Cal ID': client.ssn || '',
                'Phone Number': client.phone || '',
                'Email': client.email || '',
                'Residential Address': [client.address, client.city, client.state, client.zip].filter(Boolean).join(', '),
                'Emergency Contact Name': client.emergencyContactName || '',
                'Emergency Contact Phone': client.emergencyContactPhone || '',
                'Mobility Type': client.mobilityType || '',
                'Insurance Type': client.insuranceType || '',
                'Authorization Number': client.authorizationNumber || '',
                'Broker Name': client.brokerName || '',
                'Billing Notes': client.billingNotes || '',
                'Trip Date': trip.tripDate || '',
                'Pick-up Time': trip.pickupTime || '',
                'Drop-off Time': trip.dropoffTime || '',
                'Pick-up Address': trip.pickupAddress || '',
                'Drop-off Address': trip.dropoffAddress || '',
                'Purpose of Visit': trip.purposeOfVisit || '',
                'Round Trip?': trip.roundTrip ? 'Yes' : 'No',
                'Driver Name': trip.driverName || '',
                'Vehicle Used': trip.vehicleUsed || '',
                'Mileage': trip.mileage || '',
                'Signature on File': trip.signatureOnFile ? 'Yes' : 'No',
                'Notes': trip.notes || ''
            };
            rows.push(row);
        });
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows, { header: [
            'Full Name','Date of Birth','Medi-Cal ID','Phone Number','Email','Residential Address','Emergency Contact Name','Emergency Contact Phone','Mobility Type','Insurance Type','Authorization Number','Broker Name','Billing Notes','Trip Date','Pick-up Time','Drop-off Time','Pick-up Address','Drop-off Address','Purpose of Visit','Round Trip?','Driver Name','Vehicle Used','Mileage','Signature on File','Notes'
        ] });
        XLSX.utils.book_append_sheet(wb, ws, 'Client Trip Log');
        // Generate Excel file and trigger download
        const wbout = XLSX.write(wb, { bookType:'xlsx', type:'array' });
        const blob = new Blob([wbout], { type:'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        a.download = `Captain_Med_Go_Client_Trip_Log_${timestamp}.xlsx`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }

    // Generate a simple unique ID using current timestamp and random component
    function generateId() {
        return 'c_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    // Helper to read file as DataURL (for image storage)
    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = err => reject(err);
            reader.readAsDataURL(file);
        });
    }

    // Initialize the app on page load
    document.addEventListener('DOMContentLoaded', init);
})();