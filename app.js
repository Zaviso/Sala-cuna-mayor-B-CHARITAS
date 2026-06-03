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
    events: [],
    gallery: [],
    announcements: [],
    donations: [],
    reviews: [],
    users: [],
    balance: 0
};

// --- Sync Logic with Firebase ---
function saveState() {
    db.ref('jardin_state').set(state).then(() => {
        console.log("Datos sincronizados");
    }).catch(err => console.error("Error al sincronizar:", err));
}

db.ref('jardin_state').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        state = { ...state, ...data };
        render(); 
        checkPermissions(); // Verificar qué puede ver el usuario actual
    } else {
        saveState();
    }
});

// --- Security & Permissions Logic ---
function checkPermissions() {
    const userDataStr = sessionStorage.getItem('userData');
    if (!userDataStr) return;
    const user = JSON.parse(userDataStr);

    // 1. Mostrar Gestión de Equipo solo a la Dueña (Owner)
    const userMgmt = document.getElementById('team-section');
    if (userMgmt) {
        userMgmt.style.display = (user.role === 'Owner') ? 'block' : 'none';
    }

    // 2. Si es Owner o tiene Acceso Total, no ocultamos nada
    if (user.role === 'Owner' || user.permissions?.full) return;

    // 3. Ocultar secciones según permisos individuales
    const perms = user.permissions || {};

    // Secciones de creación (Formularios)
    if (document.querySelector('.admin-main-card'))
        document.querySelector('.admin-main-card').style.display = perms.payments ? 'block' : 'none';

    const actionCards = document.querySelectorAll('.action-card');
    if (actionCards[0]) actionCards[0].style.display = perms.expenses ? 'block' : 'none';
    if (actionCards[1]) actionCards[1].style.display = perms.requests ? 'block' : 'none';

    const bottomCards = document.querySelectorAll('.admin-grid-bottom .card');
    if (bottomCards[0]) bottomCards[0].style.display = perms.gallery ? 'block' : 'none';
    if (bottomCards[2]) bottomCards[2].style.display = perms.events ? 'block' : 'none';
    if (document.getElementById('donation-section'))
        document.getElementById('donation-section').style.display = perms.donations ? 'block' : 'none';

    // Secciones de gestión de contenido (Abajo)
    if (document.getElementById('manage-expenses-container'))
        document.getElementById('manage-expenses-container').style.display = perms.expenses ? 'block' : 'none';
    if (document.getElementById('manage-requests-container'))
        document.getElementById('manage-requests-container').style.display = perms.requests ? 'block' : 'none';
    if (document.getElementById('manage-events-container'))
        document.getElementById('manage-events-container').style.display = perms.events ? 'block' : 'none';
    if (document.getElementById('manage-moments-container'))
        document.getElementById('manage-moments-container').style.display = perms.gallery ? 'block' : 'none';
}

// --- Rendering Functions ---
function render() {
    if (document.getElementById('current-balance')) renderBalance();
    if (document.getElementById('expenses-gallery')) renderExpenses();
    if (document.getElementById('requests-list')) renderRequests();
    if (document.getElementById('events-list')) renderEvents();
    if (document.getElementById('moments-gallery')) renderMomentsGallery();
    if (document.getElementById('students-table')) renderAdminStudents();
    if (document.getElementById('public-payments-table')) renderPublicPayments();
    if (document.getElementById('cuota-curso-table')) renderCuotaCurso();
    if (document.getElementById('cuota-mensual-table')) renderCuotaMensual();
    if (document.getElementById('users-list-container')) renderUsersList();
    if (document.getElementById('announcements-container')) renderAnnouncements();
    if (document.getElementById('announcements-list')) renderAnnouncementsAdmin();
    if (document.getElementById('reviews-list')) renderReviews();
}

function renderBalance() {
    const totalIncome = state.students.reduce((acc, s) => {
        return acc + (s.paidCentro ? 10000 : 0) + (s.paidMonthly ? 2000 : 0);
    }, 0);
    const totalExpenses = (state.expenses || []).reduce((acc, e) => acc + Number(e.amount), 0);
    state.balance = totalIncome - totalExpenses;
    document.getElementById('current-balance').textContent = `$${state.balance.toLocaleString('es-CL')}`;
}

function renderExpenses() {
    const gallery = document.getElementById('expenses-gallery');
    if (!gallery) return;
    if (!state.expenses || state.expenses.length === 0) {
        gallery.innerHTML = '<p class="empty-msg">No hay gastos registrados.</p>';
        return;
    }
    const isAdmin = !!document.getElementById('students-table');
    if (isAdmin) {
        gallery.innerHTML = state.expenses.map(exp => `
            <div class="admin-mini-card">
                <img src="${exp.image || 'https://via.placeholder.com/100?text=S/I'}" class="admin-thumb">
                <div class="admin-card-info">
                    <p>${exp.desc}</p>
                    <span>$${Number(exp.amount).toLocaleString('es-CL')} | ${exp.date}</span>
                </div>
                <div class="admin-actions">
                    <button class="btn-mini btn-mini-delete" onclick="deleteExpense(${exp.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    } else {
        gallery.innerHTML = state.expenses.map(exp => `
            <div class="card">
                <img src="${exp.image || 'https://via.placeholder.com/300x200?text=Comprobante'}" style="width:100%; border-radius:10px; margin-bottom:10px;">
                <h4>${exp.desc}</h4>
                <p style="color: var(--p-red); font-weight: bold;">Monto: $${Number(exp.amount).toLocaleString('es-CL')}</p>
            </div>
        `).join('');
    }
}

function renderRequests() {
    const list = document.getElementById('requests-list');
    if (!list) return;
    if (!state.requests || state.requests.length === 0) {
        list.innerHTML = '<p class="empty-msg">No hay solicitudes.</p>';
        return;
    }
    const isAdmin = !!document.getElementById('students-table');
    if (isAdmin) {
        list.innerHTML = state.requests.map(req => `
            <div class="admin-mini-card">
                <div class="admin-thumb" style="display:flex; align-items:center; justify-content:center; background:var(--p-yellow);"><i class="fas fa-bullhorn" style="color:white;"></i></div>
                <div class="admin-card-info"><p>${req.item}</p><span>${req.status}</span></div>
                <div class="admin-actions">
                    <button class="btn-mini btn-mini-delete" onclick="deleteRequest(${req.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    } else {
        const colors = ['blue', 'green', 'orange'];
        list.innerHTML = (state.requests || []).map((req, index) => {
            const color = colors[index % 3];
            return `
                <div class="teacher-card">
                    <div class="teacher-header card-${color}">
                        <img src="https://i.pravatar.cc/150?img=${(index + 10)}" class="teacher-img">
                        <div class="teacher-label">
                            Prof. ${req.teacher || 'Laura Barcia'} - Sala ${req.room || 'Jirafa'}
                        </div>
                    </div>
                    <div class="teacher-content">
                        <div class="teacher-content-inner">
                            <div class="teacher-text">
                                <h4>${req.item}</h4>
                                <ul style="padding-left: 15px; font-size: 0.9rem; color: #555; margin-bottom: 15px;">
                                    <li>Materiales</li>
                                    <li>Varios</li>
                                </ul>
                                <p style="font-size: 0.8rem; color: #888; margin-bottom: 15px; line-height: 1.2;">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.</p>
                            </div>
                            <div class="teacher-ill">
                                <i class="fas fa-cubes fa-3x" style="color: #e67e22; opacity: 0.8;"></i>
                            </div>
                        </div>
                        <div style="text-align: center;">
                            <button class="btn-support btn-support-${color}" onclick="alert('¡Gracias por tu interés en apoyar!')">APOYAR SOLICITUD</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function renderEvents() {
    const list = document.getElementById('events-list');
    if (!list) return;
    if (!state.events || state.events.length === 0) {
        list.innerHTML = '<p class="empty-msg">No hay eventos.</p>';
        return;
    }
    const isAdmin = !!document.getElementById('students-table');
    if (isAdmin) {
        list.innerHTML = state.events.map(ev => `
            <div class="admin-mini-card">
                <div class="admin-thumb" style="display:flex; align-items:center; justify-content:center; background:var(--p-blue);"><i class="fas fa-calendar" style="color:white;"></i></div>
                <div class="admin-card-info"><p>${ev.name}</p><span>${ev.date}</span></div>
                <div class="admin-actions">
                    <button class="btn-mini btn-mini-delete" onclick="deleteEvent(${ev.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    } else {
        list.innerHTML = state.events.map(ev => `
            <div class="card" style="border-left: 5px solid var(--p-blue);">
                <h4>${ev.name}</h4>
                <p style="color: var(--p-blue); font-weight:bold;">${ev.date}</p>
            </div>
        `).join('');
    }
}

function renderMomentsGallery() {
    const gal = document.getElementById('moments-gallery');
    if (!gal) return;
    if (!state.gallery || state.gallery.length === 0) {
        gal.innerHTML = '<p class="empty-msg" style="grid-column: 1/-1;">Galería vacía.</p>';
        return;
    }
    const isAdmin = !!document.getElementById('students-table');
    if (isAdmin) {
        gal.innerHTML = state.gallery.map(img => `
            <div class="admin-moment-card">
                <img src="${img.url}">
                <button class="btn-mini btn-mini-delete" onclick="deletePhoto(${img.id})" style="width:100%"><i class="fas fa-trash"></i> Eliminar</button>
            </div>
        `).join('');
    } else {
        gal.innerHTML = state.gallery.map(img => `
            <div class="gallery-item">
                <div class="gallery-img-container">
                    <img src="${img.url}" loading="lazy">
                </div>
                <div class="gallery-info"><p>${img.desc}</p></div>
                <div class="gallery-actions">
                    <a href="${img.url}" download="jardin_charitas_${img.id}.jpg" class="gallery-btn btn-download" title="Descargar esta foto en tu dispositivo">
                        <i class="fas fa-download"></i>
                    </a>
                    <button onclick="openPreview('${img.url}')" class="gallery-btn btn-view" title="Ver foto en pantalla completa">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

window.openPreview = (url) => {
    const modal = document.getElementById('modal-preview');
    const img = document.getElementById('preview-img');
    if (modal && img) {
        img.src = url;
        modal.style.display = 'flex';
    }
};

function renderAdminStudents() {
    const tableBody = document.querySelector('#students-table tbody');
    if (!tableBody) return;
    tableBody.innerHTML = state.students.map(s => `
        <tr>
            <td>${s.name}</td>
            <td>
                <div class="proof-container-admin">
                    <input type="checkbox" ${s.paidCentro ? 'checked' : ''} onchange="togglePayment(${s.id}, 'paidCentro')">
                    ${s.proofCentro ? `<div class="thumb-wrapper"><img src="${s.proofCentro}" onclick="window.open('${s.proofCentro}')"><button class="btn-del-proof" onclick="deleteProof(${s.id}, 'proofCentro')">×</button></div>` : `<i class="fas fa-camera proof-btn" onclick="openProofModal(${s.id}, 'proofCentro')"></i>`}
                </div>
            </td>
            <td>
                <div class="proof-container-admin">
                    <input type="checkbox" ${s.paidMonthly ? 'checked' : ''} onchange="togglePayment(${s.id}, 'paidMonthly')">
                    ${s.proofMonthly ? `<div class="thumb-wrapper"><img src="${s.proofMonthly}" onclick="window.open('${s.proofMonthly}')"><button class="btn-del-proof" onclick="deleteProof(${s.id}, 'proofMonthly')">×</button></div>` : `<i class="fas fa-camera proof-btn" onclick="openProofModal(${s.id}, 'proofMonthly')"></i>`}
                </div>
            </td>
            <td style="font-size:0.75rem;">${(s.proofCentro || s.proofMonthly) ? '<span style="color:var(--p-green)">OK</span>' : '...'}</td>
        </tr>
    `).join('');
}

function renderPublicPayments() {
    const tableBody = document.querySelector('#public-payments-table tbody');
    if (!tableBody) return;
    tableBody.innerHTML = state.students.map(s => `
        <tr>
            <td>${s.name}</td>
            <td><span class="status-badge ${s.paidCentro ? 'status-paid' : 'status-pending'}">${s.paidCentro ? 'PAGADO' : 'PEND.'}</span></td>
            <td><span class="status-badge ${s.paidMonthly ? 'status-paid' : 'status-pending'}">${s.paidMonthly ? 'PAGADO' : 'PEND.'}</span></td>
        </tr>
    `).join('');
}

function renderCuotaCurso() {
    const tableBody = document.getElementById('cuota-curso-table');
    if (!tableBody) return;
    tableBody.innerHTML = state.students.map(s => `
        <tr>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9;">${s.name}</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9; text-align:center;">
                <span class="status-badge ${s.paidCentro ? 'status-paid' : 'status-pending'}">${s.paidCentro ? 'PAGADO' : 'PENDIENTE'}</span>
            </td>
        </tr>
    `).join('');
}

function renderCuotaMensual() {
    const tableBody = document.getElementById('cuota-mensual-table');
    if (!tableBody) return;
    tableBody.innerHTML = state.students.map(s => `
        <tr>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9;">${s.name}</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9; text-align:center;">
                <span class="status-badge ${s.paidMonthly ? 'status-paid' : 'status-pending'}">${s.paidMonthly ? 'PAGADO' : 'PENDIENTE'}</span>
            </td>
        </tr>
    `).join('');
}

// --- Action Functions ---
window.togglePayment = (id, field) => {
    const s = state.students.find(x => x.id === id);
    if (s) { s[field] = !s[field]; saveState(); }
};

window.deleteExpense = (id) => { if (confirm("¿Borrar gasto?")) { state.expenses = state.expenses.filter(e => e.id !== id); saveState(); } };
window.deleteRequest = (id) => { if (confirm("¿Borrar requerimiento?")) { state.requests = state.requests.filter(r => r.id !== id); saveState(); } };
window.deleteEvent = (id) => { if (confirm("¿Borrar evento?")) { state.events = state.events.filter(ev => ev.id !== id); saveState(); } };
window.deletePhoto = (id) => { if (confirm("¿Borrar foto?")) { state.gallery = state.gallery.filter(g => g.id !== id); saveState(); } };
window.deleteProof = (id, type) => { if (confirm("¿Borrar comprobante?")) { state.students.find(s => s.id === id)[type] = null; saveState(); } };

window.openProofModal = (id, type) => {
    currentProofTarget = { id, type };
    document.getElementById('modal-proof').style.display = 'flex';
};

document.getElementById('save-proof-btn')?.addEventListener('click', () => {
    const file = document.getElementById('student-proof-file').files[0];
    if (file) {
        compressImage(file, (base64) => {
            const s = state.students.find(x => x.id === currentProofTarget.id);
            s[currentProofTarget.type] = base64;
            s[currentProofTarget.type === 'proofCentro' ? 'paidCentro' : 'paidMonthly'] = true;
            saveState();
            document.getElementById('modal-proof').style.display = 'none';
        });
    }
});

document.getElementById('expense-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('exp-desc').value;
    const amount = document.getElementById('exp-amount').value;
    const file = document.getElementById('exp-image').files[0];
    const save = (img) => {
        state.expenses.push({ id: Date.now(), desc, amount, image: img, date: new Date().toLocaleDateString() });
        saveState(); e.target.reset();
    };
    if (file) compressImage(file, save); else save(null);
});

document.getElementById('request-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.requests.push({ id: Date.now(), item: document.getElementById('req-item').value, note: document.getElementById('req-note').value, status: 'Pendiente' });
    saveState(); e.target.reset();
});

document.getElementById('event-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.events.push({ id: Date.now(), name: document.getElementById('event-name').value, date: document.getElementById('event-date').value });
    saveState(); e.target.reset();
});

// --- Announcements Logic ---
function renderAnnouncements() {
    const container = document.getElementById('announcements-container');
    if (!container) return;
    if (!state.announcements || state.announcements.length === 0) {
        container.innerHTML = '<p class="empty-msg">No hay comunicados recientes.</p>';
        return;
    }
    container.innerHTML = state.announcements.map(ann => `
        <div class="card" style="border-left: 5px solid ${ann.type === 'Nota' ? 'var(--p-red)' : ann.type === 'Consejo' ? 'var(--p-green)' : 'var(--p-blue)'}; background: white; padding: 20px;">
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <span style="font-weight: 800; color: var(--p-text-light); font-size: 0.75rem;">${ann.type.toUpperCase()}</span>
                <span style="color: #999; font-size: 0.75rem;">${ann.date}</span>
            </div>
            <p style="margin: 0; font-size: 0.95rem; line-height: 1.5; color: var(--p-text); white-space: pre-line;">${ann.text}</p>
        </div>
    `).join('');
}

function renderAnnouncementsAdmin() {
    const list = document.getElementById('announcements-list');
    if (!list) return;
    if (!state.announcements || state.announcements.length === 0) {
        list.innerHTML = '<p class="empty-msg">No hay comunicados activos.</p>';
        return;
    }
    list.innerHTML = state.announcements.map((ann, index) => `
        <div class="admin-mini-card">
            <div class="admin-thumb" style="display:flex; align-items:center; justify-content:center; background: ${ann.type === 'Nota' ? 'var(--p-red)' : ann.type === 'Consejo' ? 'var(--p-green)' : 'var(--p-blue)'};">
                <i class="fas fa-comment" style="color:white;"></i>
            </div>
            <div class="admin-card-info">
                <p>${ann.text.substring(0, 30)}...</p>
                <span>${ann.type} - ${ann.date}</span>
            </div>
            <div class="admin-actions">
                <button class="btn-mini btn-mini-delete" onclick="deleteAnnouncement(${index})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

document.getElementById('announcement-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = document.getElementById('ann-text').value;
    const type = document.getElementById('ann-type').value;
    if (!state.announcements) state.announcements = [];
    state.announcements.unshift({ id: Date.now(), text, type, date: new Date().toLocaleDateString() });
    saveState(); e.target.reset();
    alert("Comunicado publicado con éxito.");
});

window.deleteAnnouncement = (index) => {
    if (confirm("¿Borrar este comunicado?")) {
        state.announcements.splice(index, 1);
        saveState();
    }
};

document.getElementById('gallery-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const file = document.getElementById('photo-file').files[0];
    if (file) compressImage(file, (url) => {
        state.gallery.push({ id: Date.now(), desc: document.getElementById('photo-desc').value, url });
        saveState(); e.target.reset();
    });
});

document.getElementById('donation-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('donation-type').value;
    const desc = document.getElementById('donation-desc').value;
    if (!state.donations) state.donations = [];
    state.donations.push({ id: Date.now(), type, desc, date: new Date().toLocaleDateString() });
    saveState(); e.target.reset();
    alert("Donación registrada con éxito.");
});

function renderReviews() {
    const list = document.getElementById('reviews-list');
    if (!list) return;
    if (!state.reviews || state.reviews.length === 0) {
        list.innerHTML = '<p style="font-size:0.8rem; color:#999; text-align:center;">No hay reseñas registradas.</p>';
        return;
    }
    list.innerHTML = state.reviews.map((review, index) => `
        <div class="admin-mini-card">
            <div class="admin-card-info">
                <p>${review.text.substring(0, 50)}...</p>
                <span>${review.date}</span>
            </div>
            <div class="admin-actions">
                <button class="btn-mini btn-mini-delete" onclick="deleteReview(${index})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

window.deleteReview = (index) => {
    if (confirm("¿Borrar esta reseña?")) {
        state.reviews.splice(index, 1);
        saveState();
    }
};
// --- User Management Logic (SuperAdmin Only) ---
function renderUsersList() {
    const container = document.getElementById('users-list-container');
    if (!container) return;
    if (!state.users || state.users.length === 0) {
        container.innerHTML = '<p style="font-size:0.8rem; color:#999; text-align:center;">No hay colaboradores invitados.</p>';
        return;
    }
    container.innerHTML = state.users.map((u, index) => `
        <div class="admin-mini-card" style="margin-bottom:10px;">
            <div class="admin-card-info">
                <p>${u.realname} (@${u.username})</p>
                <span>${u.permissions?.full ? 'Acceso Total' : 'Acceso Limitado'}</span>
            </div>
            <div class="admin-actions">
                <button class="btn-mini btn-mini-delete" onclick="deleteUserAccount(${index})" title="Eliminar Acceso">
                    <i class="fas fa-user-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

window.openUserModal = () => document.getElementById('modal-user').style.display = 'flex';
window.closeUserModal = () => {
    document.getElementById('modal-user').style.display = 'none';
    document.getElementById('user-form').reset();
};

document.getElementById('user-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newUser = {
        realname: document.getElementById('new-user-realname').value,
        username: document.getElementById('new-username').value.toLowerCase().trim(),
        password: document.getElementById('new-password').value,
        role: 'Collaborator',
        permissions: {
            payments: document.getElementById('p-payments').checked,
            expenses: document.getElementById('p-expenses').checked,
            requests: document.getElementById('p-requests').checked,
            gallery: document.getElementById('p-gallery').checked,
            events: document.getElementById('p-events').checked,
            donations: document.getElementById('p-donations').checked,
            full: document.getElementById('p-full').checked
        }
    };

    if (!state.users) state.users = [];
    state.users.push(newUser);
    saveState();
    closeUserModal();
    alert("¡Acceso creado con éxito! Ya puedes entregarle el usuario y clave a la persona.");
});

window.deleteUserAccount = (index) => {
    if (confirm("¿Seguro que deseas eliminar este acceso? La persona ya no podrá entrar.")) {
        state.users.splice(index, 1);
        saveState();
    }
};


// Initialize
window.addEventListener('DOMContentLoaded', () => {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    const isLoginPage = window.location.href.includes('login.html');
    const isIndexPage = window.location.href.includes('index.html') || window.location.pathname.endsWith('/');

    if (!isAdmin && !isLoginPage && !isIndexPage) {
        window.location.href = 'login.html';
        return;
    }

    render();
    if (isAdmin) {
        setTimeout(checkPermissions, 100); // Pequeño delay para asegurar que el DOM está listo
    }
});

window.logout = () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
};
