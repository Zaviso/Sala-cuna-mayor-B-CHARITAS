// --- Initial State / Mock Data ---
const initialStudents = [
    { id: 1, name: "Maximiliano Acuña Espinoza", paidCentro: false, paidMonthly: false },
    { id: 2, name: "Tomás Aguilar Zúñiga", paidCentro: false, paidMonthly: false },
    { id: 3, name: "Milenko Beros Neuman", paidCentro: false, paidMonthly: false },
    { id: 4, name: "Diego Cid Castillo", paidCentro: false, paidMonthly: false },
    { id: 5, name: "Cristobal De Diego Tecay", paidCentro: false, paidMonthly: false },
    { id: 6, name: "Martina Gómez Gómez", paidCentro: false, paidMonthly: false },
    { id: 7, name: "Emiliano Hernández Vidal", paidCentro: false, paidMonthly: false },
    { id: 8, name: "Martina Montecinos Arancibia", paidCentro: false, paidMonthly: false },
    { id: 9, name: "Román Morales Molina", paidCentro: false, paidMonthly: false },
    { id: 10, name: "Lucas Muñoz Hernández", paidCentro: false, paidMonthly: false },
    { id: 11, name: "Samanta Paredes Padilla", paidCentro: false, paidMonthly: false },
    { id: 12, name: "Celine Parra Miranda", paidCentro: false, paidMonthly: false },
    { id: 13, name: "Teodoro Quezada Possel", paidCentro: false, paidMonthly: false },
    { id: 14, name: "Gaela Recabarren Fernández", paidCentro: false, paidMonthly: false },
    { id: 15, name: "Sebastián Rocha Martinez", paidCentro: false, paidMonthly: false },
    { id: 16, name: "Jose Ruiz Fernandez", paidCentro: false, paidMonthly: false },
    { id: 17, name: "Dominga Serón Hijerra", paidCentro: false, paidMonthly: false },
    { id: 18, name: "Sophia Silva Oyarzo", paidCentro: false, paidMonthly: false },
    { id: 19, name: "Martina Soriano Almonacid", paidCentro: false, paidMonthly: false }
];

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDLWLZ4BHGBG-mFWW83ctM5ALWUVfWMW",
  authDomain: "jardin-charitas.firebaseapp.com",
  projectId: "jardin-charitas",
  storageBucket: "jardin-charitas.firebasestorage.app",
  messagingSenderId: "422091278966",
  appId: "1:422091278966:web:5ef29fb7be913f0129b004",
  measurementId: "G-C7Y8ZM9XY2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- Helper: Compress Image ---
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            callback(dataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// --- Global State ---
let state = {
    students: initialStudents.map(s => ({ ...s, proofCentro: null, proofMonthly: null })),
    expenses: [],
    requests: [],
    admins: [{ name: "Mamá Encargada (Tú)", role: "Principal" }],
    balance: 0
};

// --- Sync Logic with Firebase ---
function saveState() {
    // Guardamos en la nube
    db.ref('jardin_state').set(state);
}

// Escuchar cambios en tiempo real
db.ref('jardin_state').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        state = data;
        render(); // Re-renderizar automáticamente cuando alguien cambie algo
    } else {
        // Si la base de datos está vacía, la inicializamos por primera vez
        saveState();
    }
});

// --- Navigation Logic ---

// --- Navigation Logic ---
const btnAdmin = document.getElementById('btn-admin-access');
if (btnAdmin) {
    btnAdmin.addEventListener('click', () => {
        window.location.href = 'admin.html';
    });
}

// --- Rendering Functions ---
function render() {
    console.log("Rendering view...");
    if (document.getElementById('current-balance')) renderBalance();
    if (document.getElementById('expenses-gallery')) renderExpenses();
    if (document.getElementById('requests-list')) renderRequests();
    if (document.getElementById('students-table')) renderAdminStudents();
    if (document.getElementById('public-payments-table')) renderPublicPayments();
    if (document.getElementById('admins-list')) renderAdminsList();
}

function renderBalance() {
    const totalIncome = state.students.reduce((acc, s) => {
        return acc + (s.paidCentro ? 10000 : 0) + (s.paidMonthly ? 2000 : 0);
    }, 0);
    const totalExpenses = state.expenses.reduce((acc, e) => acc + Number(e.amount), 0);
    state.balance = totalIncome - totalExpenses;
    document.getElementById('current-balance').textContent = `$${state.balance.toLocaleString('es-CL')}`;
}

function renderExpenses() {
    const gallery = document.getElementById('expenses-gallery');
    if (!gallery) return;
    if (state.expenses.length === 0) {
        gallery.innerHTML = '<p class="empty-msg">No hay gastos registrados aún.</p>';
        return;
    }
    const isAdmin = !!document.getElementById('students-table');
    gallery.innerHTML = state.expenses.map(exp => `
        <div class="card">
            <img src="${exp.image || 'https://via.placeholder.com/300x200?text=Comprobante'}" alt="Comprobante" style="width:100%; border-radius:10px; margin-bottom:10px;">
            <h4>${exp.desc}</h4>
            <p style="color: var(--p-red); font-weight: bold;">Monto: $${Number(exp.amount).toLocaleString('es-CL')}</p>
            <p style="font-size: 0.8rem; color: var(--p-text-light);">Fecha: ${exp.date}</p>
            ${isAdmin ? `<button class="btn" style="background:var(--p-red); color:white; margin-top:10px; padding: 5px 10px; font-size: 0.8rem;" onclick="deleteExpense(${exp.id})">Borrar</button>` : ''}
        </div>
    `).join('');
}

function renderRequests() {
    const list = document.getElementById('requests-list');
    if (!list) return;
    if (state.requests.length === 0) {
        list.innerHTML = '<p class="empty-msg">No hay solicitudes pendientes.</p>';
        return;
    }
    const isAdmin = !!document.getElementById('students-table');
    list.innerHTML = state.requests.map(req => `
        <div class="card" style="border-top: 5px solid ${req.status === 'Donado' ? 'var(--p-green)' : 'var(--p-yellow)'}">
            <h3>${req.item}</h3>
            <p><strong>Estado:</strong> ${req.status}</p>
            ${req.donor ? `<p><strong>Gracias a:</strong> ${req.donor}</p>` : ''}
            <p style="font-size: 0.9rem; margin-top: 10px;">${req.note}</p>
            ${isAdmin ? `<button class="btn" style="background:var(--p-red); color:white; margin-top:10px; padding: 5px 10px; font-size: 0.8rem;" onclick="deleteRequest(${req.id})">Borrar</button>` : ''}
        </div>
    `).join('');
}

function renderPublicPayments() {
    const tableBody = document.querySelector('#public-payments-table tbody');
    if (!tableBody) return;
    tableBody.innerHTML = state.students.map(s => `
        <tr>
            <td>${s.name}</td>
            <td>
                <span class="status-badge ${s.paidCentro ? 'status-paid' : 'status-pending'}">
                    ${s.paidCentro ? 'PAGADO' : 'PENDIENTE'}
                </span>
            </td>
            <td>
                <span class="status-badge ${s.paidMonthly ? 'status-paid' : 'status-pending'}">
                    ${s.paidMonthly ? 'PAGADO' : 'PENDIENTE'}
                </span>
            </td>
        </tr>
    `).join('');
}

let currentProofTarget = null;

function renderAdminStudents() {
    const tableBody = document.querySelector('#students-table tbody');
    if (!tableBody) return;
    console.log("Rendering admin students table...");
    tableBody.innerHTML = state.students.map(s => `
        <tr>
            <td>${s.name}</td>
            <td>
                <div style="display:flex; align-items:center; gap:5px;">
                    <input type="checkbox" ${s.paidCentro ? 'checked' : ''} onchange="togglePayment(${s.id}, 'paidCentro')">
                    <i class="fas fa-camera proof-btn ${s.proofCentro ? 'uploaded' : ''}" onclick="openProofModal(${s.id}, 'proofCentro')" title="Subir comprobante"></i>
                </div>
            </td>
            <td>
                <div style="display:flex; align-items:center; gap:5px;">
                    <input type="checkbox" ${s.paidMonthly ? 'checked' : ''} onchange="togglePayment(${s.id}, 'paidMonthly')">
                    <i class="fas fa-camera proof-btn ${s.proofMonthly ? 'uploaded' : ''}" onclick="openProofModal(${s.id}, 'proofMonthly')" title="Subir comprobante"></i>
                </div>
            </td>
            <td style="font-size: 0.7rem; color: var(--p-text-light);">
                ${(s.proofCentro || s.proofMonthly) ? '✅ Archivos listos' : 'Pendiente'}
            </td>
        </tr>
    `).join('');
}

function renderAdminsList() {
    const list = document.getElementById('admins-list');
    if (!list) return;
    list.innerHTML = state.admins.map(adm => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8fafc; border-radius: 10px; margin-bottom: 10px;">
            <span>${adm.name}</span>
            <span class="btn" style="padding: 2px 8px; font-size: 0.7rem; background: ${adm.role === 'Principal' ? 'var(--p-blue)' : 'var(--p-green)'}; color: white;">${adm.role}</span>
        </div>
    `).join('');
}

window.openProofModal = (id, type) => {
    currentProofTarget = { id, type };
    const student = state.students.find(s => s.id === id);
    document.getElementById('proof-target-name').textContent = `${student.name} - ${type === 'proofCentro' ? 'Cuota Centro' : 'Mensual'}`;
    document.getElementById('modal-proof').style.display = 'flex';
};

document.getElementById('save-proof-btn')?.addEventListener('click', () => {
    const fileInput = document.getElementById('student-proof-file');
    
    if (!fileInput.files[0]) {
        alert("Por favor, selecciona un archivo primero.");
        return;
    }
    
    if (!currentProofTarget) {
        alert("Error: No se ha seleccionado un alumno válido. Cierra el modal e intenta de nuevo.");
        return;
    }

    compressImage(fileInput.files[0], (compressedBase64) => {
        try {
            const student = state.students.find(s => s.id === currentProofTarget.id);
            if (!student) throw new Error("Alumno no encontrado");

            student[currentProofTarget.type] = compressedBase64;
            
            // Marcar como pagado automáticamente
            const paymentField = currentProofTarget.type === 'proofCentro' ? 'paidCentro' : 'paidMonthly';
            student[paymentField] = true;
            
            saveState();
            
            document.getElementById('modal-proof').style.display = 'none';
            fileInput.value = '';
            alert("¡Comprobante guardado y optimizado con éxito!");
        } catch (err) {
            console.error(err);
            alert("Error al guardar: " + err.message);
        }
    });
});

// --- Action Functions ---
window.togglePayment = (id, field) => {
    const student = state.students.find(s => s.id === id);
    if (student) {
        student[field] = !student[field];
        saveState();
    }
};

document.getElementById('expense-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('exp-desc').value;
    const amount = document.getElementById('exp-amount').value;
    const fileInput = document.getElementById('exp-image');
    
    if (fileInput.files[0]) {
        compressImage(fileInput.files[0], (compressedBase64) => {
            const newExpense = {
                id: Date.now(),
                desc,
                amount,
                image: compressedBase64,
                date: new Date().toLocaleDateString()
            };
            state.expenses.push(newExpense);
            saveState();
            e.target.reset();
            alert("Gasto registrado y optimizado con éxito.");
        });
    } else {
        const newExpense = {
            id: Date.now(),
            desc,
            amount,
            image: null,
            date: new Date().toLocaleDateString()
        };
        state.expenses.push(newExpense);
        saveState();
        e.target.reset();
        alert("Gasto registrado con éxito (sin imagen).");
    }
});

document.getElementById('request-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const item = document.getElementById('req-item').value;
    const note = document.getElementById('req-note').value;
    
    const newRequest = {
        id: Date.now(),
        item,
        note,
        status: 'Pendiente',
        donor: null
    };
    state.requests.push(newRequest);
    saveState();
    e.target.reset();
    alert("Requerimiento publicado con éxito");
});

window.deleteExpense = (id) => {
    if (confirm("¿Seguro que deseas borrar este gasto?")) {
        state.expenses = state.expenses.filter(e => e.id !== id);
        saveState();
    }
};

window.deleteRequest = (id) => {
    if (confirm("¿Seguro que deseas borrar este requerimiento?")) {
        state.requests = state.requests.filter(r => r.id !== id);
        saveState();
    }
};

window.logout = () => {
    sessionStorage.removeItem('isAdmin');
    window.location.href = 'index.html';
};

window.addCoAdmin = () => {
    const name = prompt("Nombre del nuevo administrador:");
    if (name) {
        state.admins.push({ name, role: "Co-Admin" });
        saveState();
        alert("Administrador agregado con éxito.");
    }
};

// Initialize
render();
console.log("Portal initialized with", state.students.length, "students.");
