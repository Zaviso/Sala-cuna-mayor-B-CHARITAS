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

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'dka3sq6zh';
const CLOUDINARY_UPLOAD_PRESET = 'jardin_galeria';


// --- Cloudinary Upload Helper ---
async function uploadFileToCloudinary(file, folderName = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'jardin-charitas/' + folderName);
    
    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        return data.secure_url || null;
    } catch (err) {
        console.error("Cloudinary upload error:", err);
        return null;
    }
}

// --- Firebase Node Helpers ---
function fbSet(path, value) {
    return db.ref('jardin_state/' + path).set(value).catch(console.error);
}
function fbRemove(path) {
    return db.ref('jardin_state/' + path).remove().catch(console.error);
}

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
    participations: [],
    relevantInfo: [],
    reviews: [],
    users: [],
    deletedUsernames: [],
    balance: 0,
    paymentHistory: [],
    cursoHistory: {},
    montos: { curso: 1092, mensual: 1092 }
};

// --- Sync Logic with Firebase ---
function saveState() {
    // Deprecated, all mutations now use fbSet/fbRemove
}

db.ref('jardin_state').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        state = { ...state, ...data };

        // Asegurar que los arrays sean arrays (Firebase puede devolverlos como objetos con nulls)
        state.users = Array.isArray(state.users)
            ? state.users.filter(u => u != null)
            : (state.users ? Object.values(state.users).filter(u => u != null) : []);
        state.students = Array.isArray(state.students)
            ? state.students.filter(u => u != null)
            : (state.students ? Object.values(state.students).filter(u => u != null) : []);
        state.expenses = Array.isArray(state.expenses)
            ? state.expenses.filter(u => u != null)
            : (state.expenses ? Object.values(state.expenses).filter(u => u != null) : []);
        state.requests = Array.isArray(state.requests)
            ? state.requests.filter(u => u != null)
            : (state.requests ? Object.values(state.requests).filter(u => u != null) : []);
        state.events = Array.isArray(state.events)
            ? state.events.filter(u => u != null)
            : (state.events ? Object.values(state.events).filter(u => u != null) : []);
        state.gallery = Array.isArray(state.gallery)
            ? state.gallery.filter(u => u != null)
            : (state.gallery ? Object.values(state.gallery).filter(u => u != null) : []);
        state.announcements = Array.isArray(state.announcements)
            ? state.announcements.filter(u => u != null)
            : (state.announcements ? Object.values(state.announcements).filter(u => u != null) : []);
        state.donations = Array.isArray(state.donations)
            ? state.donations.filter(u => u != null)
            : (state.donations ? Object.values(state.donations).filter(u => u != null) : []);
        state.participations = Array.isArray(state.participations)
            ? state.participations.filter(u => u != null)
            : (state.participations ? Object.values(state.participations).filter(u => u != null) : []);
        state.relevantInfo = Array.isArray(state.relevantInfo)
            ? state.relevantInfo.filter(u => u != null)
            : (state.relevantInfo ? Object.values(state.relevantInfo).filter(u => u != null) : []);
        state.deletedUsernames = Array.isArray(state.deletedUsernames)
            ? state.deletedUsernames.filter(u => u != null)
            : (state.deletedUsernames ? Object.values(state.deletedUsernames).filter(u => u != null) : []);

        render();
        checkPermissions(); // Verificar qué puede ver el usuario actual
    } else {
        // no-op, init done by fb update
    }
});

// --- Security & Permissions Logic ---
function getUserPermissions() {
    const userData = sessionStorage.getItem('userData');
    if (!userData) return null;
    const user = JSON.parse(userData);
    if (user.username === 'jonathan' || user.username === 'admin') {
        return { full: true };
    }
    return user.permissions || {};
}

function hasPermission(permissionKey) {
    const perms = getUserPermissions();
    if (!perms) return false;
    // El permiso 'history' permite editar/eliminar todo contenido
    return perms.full === true || perms[permissionKey] === true || (permissionKey !== 'full' && perms.history === true);
}

function checkPermissions() {
    const userDataStr = sessionStorage.getItem('userData');
    if (!userDataStr) return;
    const user = JSON.parse(userDataStr);

    // jonathan y admin tienen acceso total
    if (user.username === 'jonathan' || user.username === 'admin') {
        return;
    }

    // 1. Mostrar Gestión de Equipo solo a la Dueña (Owner) o con permiso
    const userMgmt = document.getElementById('team-section');
    if (userMgmt) {
        const canManageTeam = user.role === 'Owner' || user.permissions?.team;
        userMgmt.style.display = canManageTeam ? 'block' : 'none';
    }

    // 2. Si es Owner o tiene Acceso Total, no ocultamos nada
    if (user.role === 'Owner' || user.permissions?.full) return;

    // 3. Ocultar secciones según permisos individuales
    const perms = user.permissions || {};

    // SECCIONES DE CREACIÓN (Formularios)
    // 1. Control de Pagos
    const adminMainCard = document.querySelector('.admin-main-card');
    if (adminMainCard) adminMainCard.style.display = perms.payments ? 'block' : 'none';

    // 2. Registrar Gasto
    const expenseSection = document.getElementById('expense-section');
    if (expenseSection) expenseSection.style.display = perms.expenses ? 'block' : 'none';

    // 3. Requerimiento de las Tías
    const requestSection = document.getElementById('request-section');
    if (requestSection) requestSection.style.display = perms.requests ? 'block' : 'none';

    // 4. Gestión de Equipo
    const teamSection = document.getElementById('team-section');
    if (teamSection) teamSection.style.display = (user.role === 'Owner' || perms.team) ? 'block' : 'none';

    // 5. Galería
    const gallerySection = document.getElementById('gallery-section');
    if (gallerySection) gallerySection.style.display = perms.gallery ? 'block' : 'none';

    // 6. Evento
    const eventSection = document.getElementById('event-section');
    if (eventSection) eventSection.style.display = perms.events ? 'block' : 'none';

    // 7. Comunicados Directiva
    const announcementSection = document.getElementById('announcement-section');
    if (announcementSection) announcementSection.style.display = perms.announcements ? 'block' : 'none';

    // 8. Donaciones
    const donationSection = document.getElementById('donation-section');
    if (donationSection) donationSection.style.display = perms.donations ? 'block' : 'none';

    // 9. Información Relevante
    const relevantInfoSection = document.getElementById('relevant-info-section');
    if (relevantInfoSection) relevantInfoSection.style.display = perms.relevantInfo ? 'block' : 'none';

    // 10. Participación
    const participationSection = document.getElementById('participation-section');
    if (participationSection) participationSection.style.display = perms.participations ? 'block' : 'none';

    // LISTADOS/HISTORIAL DE CONTENIDO PUBLICADO
    // Donaciones Registradas
    const manageDonationsContainer = document.getElementById('manage-donations-container');
    if (manageDonationsContainer) manageDonationsContainer.style.display = perms.donations ? 'block' : 'none';

    // Participaciones Registradas
    const manageParticipationsContainer = document.getElementById('manage-participations-container');
    if (manageParticipationsContainer) manageParticipationsContainer.style.display = perms.participations ? 'block' : 'none';

    // Información Relevante Registrada
    const manageRelevantInfoContainer = document.getElementById('manage-relevant-info-container');
    if (manageRelevantInfoContainer) manageRelevantInfoContainer.style.display = perms.relevantInfo ? 'block' : 'none';

    // Galería de Fotos
    const manageGalleryContainer = document.getElementById('manage-gallery-container');
    if (manageGalleryContainer) manageGalleryContainer.style.display = perms.gallery ? 'block' : 'none';

    // Comunicados Activos
    const manageAnnouncementsContainer = document.getElementById('manage-announcements-container');
    if (manageAnnouncementsContainer) manageAnnouncementsContainer.style.display = perms.announcements ? 'block' : 'none';

    // LISTADOS EN DASHBOARD GRID (Gestionar Contenido Publicado)
    // Gastos Registrados - ocultar el div padre
    const expensesGalleryParent = document.getElementById('expenses-gallery')?.parentElement;
    if (expensesGalleryParent) expensesGalleryParent.style.display = perms.expenses ? 'block' : 'none';

    // Requerimientos Activos - ocultar el div padre
    const requestsListParent = document.getElementById('requests-list')?.parentElement;
    if (requestsListParent) requestsListParent.style.display = perms.requests ? 'block' : 'none';

    // Eventos Programados - ocultar el div padre
    const eventsListParent = document.getElementById('events-list')?.parentElement;
    if (eventsListParent) eventsListParent.style.display = perms.events ? 'block' : 'none';

    // SECCIÓN COMPLETA: Gestionar Contenido Publicado - para acceso total o con permiso de historial
    const manageContentSection = document.getElementById('manage-content-section');
    if (manageContentSection) manageContentSection.style.display = (perms.full || perms.history) ? 'block' : 'none';
}

// --- Tarjeta compacta unificada para admin ---
function adminCard({ icon, iconBg, imgSrc, title, subtitle, onDelete, canDelete = true }) {
    const visual = imgSrc
        ? `<div style="position:relative;flex-shrink:0;">
               <img src="${imgSrc}" onclick="openPreview('${imgSrc}')"
                   style="width:48px;height:48px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid #e2e8f0;">
               <span onclick="openPreview('${imgSrc}')"
                   style="position:absolute;bottom:2px;right:2px;width:16px;height:16px;background:var(--p-blue);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;">
                   <i class="fas fa-expand" style="color:white;font-size:0.45rem;"></i>
               </span>
           </div>`
        : `<div style="width:48px;height:48px;border-radius:8px;background:${iconBg || '#e2e8f0'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
               <i class="${icon || 'fas fa-file'}" style="color:white;font-size:1rem;"></i>
           </div>`;
    const deleteBtn = canDelete ? `<button class="btn-mini btn-mini-delete" onclick="${onDelete}" style="flex-shrink:0;"><i class="fas fa-trash"></i></button>` : '';
    return `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:white;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:6px;">
        ${visual}
        <div style="flex:1;min-width:0;">
            <p style="margin:0;font-size:0.83rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--p-text);">${title}</p>
            <span style="font-size:0.73rem;color:#999;">${subtitle || ''}</span>
        </div>
        ${deleteBtn}
    </div>`;
}

// --- Rendering Functions ---
function render() {
    if (document.getElementById('current-balance')) renderBalance();
    if (document.getElementById('expenses-gallery')) renderExpenses();
    if (document.getElementById('requests-list')) renderRequests();
    if (document.getElementById('events-list')) renderEvents();
    if (document.getElementById('gallery-list-admin')) renderGalleryAdmin();
    if (document.getElementById('gallery-public')) renderGalleryPublic();
    if (document.getElementById('moments-gallery')) renderMomentsGallery();
    if (document.getElementById('folder-select')) populateFolderSelect();
    renderRelevantInfo();
    if (document.getElementById('students-table')) renderAdminStudents();
    if (document.getElementById('public-payments-table')) renderPublicPayments();
    if (document.getElementById('donations-list') || document.getElementById('donations-list-admin')) renderDonations();
    if (document.getElementById('participations-list') || document.getElementById('participations-list-admin')) renderParticipations();
    if (document.getElementById('historial-curso-table')) renderHistorialCurso();
    if (document.getElementById('historial-mensual-table')) renderHistorialMensual();
    if (document.getElementById('users-list-container')) renderUsersList();
    if (document.getElementById('announcements-container')) renderAnnouncements();
    if (document.getElementById('announcements-list')) renderAnnouncementsAdmin();
    if (document.getElementById('reviews-list')) renderReviews();
}

function renderBalance() {
    const SALDO_INICIAL = 1092;
    const MONTO_CURSO = 5000;

    let totalCurso = 0;
    state.students.forEach(s => {
        const pagos = (state.cursoHistory || {})[s.id] || {};
        totalCurso += Object.values(pagos).filter(Boolean).length * MONTO_CURSO;
    });

    const totalExpenses = (state.expenses || []).reduce((acc, e) => acc + Number(e.amount), 0);
    state.balance = SALDO_INICIAL + totalCurso - totalExpenses;

    const el = document.getElementById('current-balance');
    if (el) el.textContent = `$${state.balance.toLocaleString('es-CL')}`;
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
        // Agrupar por fecha, más recientes primero
        const byDate = {};
        state.expenses.forEach(exp => {
            const key = exp.date || 'Sin fecha';
            if (!byDate[key]) byDate[key] = [];
            byDate[key].push(exp);
        });
        const sortedDates = Object.keys(byDate).sort((a, b) => {
            const parse = d => { const p = d.split('/'); return p.length===3 ? new Date(p[2],p[1]-1,p[0]) : new Date(0); };
            return parse(b) - parse(a);
        });

        gallery.innerHTML = sortedDates.map(fecha => {
            const exps = byDate[fecha];
            const total = exps.reduce((s, e) => s + Number(e.amount), 0);
            const items = exps.map(exp => {
                const imgs = exp.images || (exp.image ? [exp.image] : []);
                return adminCard({
                    imgSrc: imgs.length > 0 ? imgs[0] : null,
                    icon: 'fas fa-receipt', iconBg: '#f1f5f9',
                    title: exp.desc,
                    subtitle: `-$${Number(exp.amount).toLocaleString('es-CL')}`,
                    onDelete: `deleteExpense(${exp.id})`,
                    canDelete: hasPermission('expenses')
                });
            }).join('');

            return `
            <div style="background:white;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:10px;overflow:hidden;">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:0.8rem;font-weight:700;color:var(--p-blue);"><i class="fas fa-calendar-day"></i> ${fecha}</span>
                    <span style="font-size:0.75rem;background:var(--p-red);color:white;padding:2px 8px;border-radius:20px;font-weight:700;">-$${total.toLocaleString('es-CL')}</span>
                </div>
                ${items}
            </div>`;
        }).join('');
    } else {
        // Agrupar por fecha
        const byDate = {};
        state.expenses.forEach(exp => {
            const key = exp.date || 'Sin fecha';
            if (!byDate[key]) byDate[key] = [];
            byDate[key].push(exp);
        });

        // Ordenar fechas más recientes primero
        const sortedDates = Object.keys(byDate).sort((a, b) => {
            const parse = d => {
                const parts = d.split('/');
                if (parts.length === 3) return new Date(parts[2], parts[1]-1, parts[0]);
                return new Date(0);
            };
            return parse(b) - parse(a);
        });

        gallery.innerHTML = `<div class="expense-timeline">` +
        sortedDates.map(fecha => {
            const exps = byDate[fecha];
            const total = exps.reduce((s, e) => s + Number(e.amount), 0);
            const items = exps.map(exp => {
                const imgs = exp.images || (exp.image ? [exp.image] : []);
                const foto = imgs.length > 0
                    ? `<img src="${imgs[0]}" onclick="openPreview('${imgs[0]}')"
                        loading="lazy"
                        style="width:64px;height:64px;object-fit:cover;border-radius:10px;cursor:pointer;flex-shrink:0;">`
                    : `<div style="width:64px;height:64px;background:#f1f5f9;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-receipt" style="color:#ccc;font-size:1.3rem;"></i></div>`;
                const masImgs = imgs.length > 1
                    ? `<span style="font-size:0.75rem;color:var(--p-blue);cursor:pointer;" onclick="openPreview('${imgs[1]}')">(+${imgs.length - 1} foto${imgs.length > 2 ? 's' : ''})</span>`
                    : '';
                return `
                <div class="expense-item">
                    ${foto}
                    <div class="expense-item-info">
                        <p class="expense-item-desc">${exp.desc}</p>
                        ${masImgs}
                    </div>
                    <span class="expense-item-amount">-$${Number(exp.amount).toLocaleString('es-CL')}</span>
                </div>`;
            }).join('');

            return `
            <div class="expense-day-block">
                <div class="expense-day-header">
                    <span class="expense-day-date"><i class="fas fa-calendar-day"></i> ${fecha}</span>
                    <span class="expense-day-total">Total: $${total.toLocaleString('es-CL')}</span>
                </div>
                <div class="expense-day-items">${items}</div>
            </div>`;
        }).join('') +
        `</div>`;
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
        list.innerHTML = state.requests.map(req => {
            const supports = (state.requestSupports && state.requestSupports[req.id]) || [];
            const supportText = supports.length > 0 ? `${supports.length} familia(s) apoyando` : 'Sin apoyos aún';
            return adminCard({
                imgSrc: req.image,
                icon:'fas fa-bullhorn',
                iconBg:'var(--p-orange)',
                title: req.item,
                subtitle: `${req.teacher || '—'} • ${supportText}`,
                onDelete:`deleteRequest(${req.id})`,
                canDelete: hasPermission('requests')
            });
        }).join('');
    } else {
        const colors = ['blue', 'green', 'orange'];
        list.innerHTML = (state.requests || []).map((req, index) => {
            const color = colors[index % 3];
            const images = req.images || (req.image ? [req.image] : []);
            const profileImg = images.length > 0 ? images[0] : `https://i.pravatar.cc/150?img=${(index + 10)}`;
            const teacherName = req.teacher && req.teacher.trim() ? req.teacher : 'Profesora';
            const roomName = req.room && req.room.trim() ? req.room : 'Sala';

            const thumbsHTML = images.length > 1 ? `
                <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
                    ${images.map((img, i) => `<img src="${img}" onclick="openPreview('${img}')" style="width:50px;height:50px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid #ddd;">`).join('')}
                </div>
            ` : '';

            return `
                <div class="teacher-card">
                    <div class="teacher-header card-${color}">
                        <img src="${profileImg}" class="teacher-img" alt="Foto de ${teacherName}">
                        <div class="teacher-label">
                            ${teacherName} - ${roomName}
                        </div>
                    </div>
                    <div class="teacher-content">
                        <div class="teacher-content-inner">
                            <div class="teacher-text">
                                <h4>${req.item}</h4>
                                <p style="font-size: 0.9rem; color: #666; margin: 12px 0; line-height: 1.5; white-space: pre-wrap;">${req.note && req.note.trim() ? req.note : 'Se necesita tu apoyo para este requerimiento.'}</p>
                                ${thumbsHTML}
                            </div>
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
        list.innerHTML = state.events.map(ev =>
            adminCard({ icon:'fas fa-calendar', iconBg:'var(--p-blue)', title: ev.name, subtitle: ev.date, onDelete:`deleteEvent(${ev.id})`, canDelete: hasPermission('events') })
        ).join('');
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

    gal.innerHTML = state.gallery.map(folder => `
        <div style="grid-column: 1/-1;">
            <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 20px;">
                <div style="padding: 15px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <h3 style="margin: 0; color: var(--p-blue); font-size: 1.1rem;">
                        <i class="fas fa-folder"></i> ${folder.name}
                    </h3>
                    <p style="margin: 8px 0 0 0; font-size: 0.85rem; color: #999;">
                        ${folder.createdAt} • ${folder.photos?.length || 0} foto(s)
                    </p>
                    ${folder.desc ? `<p style="margin: 8px 0 0 0; font-size: 0.9rem; color: var(--p-text); line-height: 1.4;">${folder.desc}</p>` : ''}
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; padding: 15px;">
                    ${(folder.photos || []).map(photo => `
                        <div class="gallery-item">
                            <div class="gallery-img-container">
                                <img src="${photo.url}" loading="lazy" alt="${photo.originalName}">
                            </div>
                            <div class="gallery-info"><p title="${photo.originalName}">${photo.originalName}</p></div>
                            <div class="gallery-actions">
                                <a href="${photo.url}" download="${photo.originalName}" class="gallery-btn btn-download" title="Descargar">
                                    <i class="fas fa-download"></i>
                                </a>
                                <button onclick="openPreview('${photo.url}')" class="gallery-btn btn-view" title="Ver en pantalla completa">
                                    <i class="fas fa-expand"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function renderGalleryAdmin() {
    const container = document.getElementById('gallery-list-admin');
    if (!container) return;
    if (!state.gallery || state.gallery.length === 0) {
        container.innerHTML = '<p class="empty-msg">No hay carpetas creadas.</p>';
        return;
    }

    container.innerHTML = state.gallery.map((folder, folderIndex) => {
        const items = (folder.photos || []).map((photo, photoIndex) => {
            return `
                <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:white;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:6px;">
                    <div style="position:relative;flex-shrink:0;">
                        <img src="${photo.url}" onclick="openPreview('${photo.url}')"
                            style="width:48px;height:48px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid #e2e8f0;">
                        <span onclick="openPreview('${photo.url}')"
                            style="position:absolute;bottom:2px;right:2px;width:16px;height:16px;background:var(--p-blue);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;">
                            <i class="fas fa-expand" style="color:white;font-size:0.45rem;"></i>
                        </span>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <p style="margin:0;font-size:0.83rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--p-text);" title="${photo.originalName}">${photo.originalName || 'Foto'}</p>
                    </div>
                    ${hasPermission('gallery') ? `<button class="btn-mini btn-mini-delete" onclick="deletePhotoFromFolder(${folderIndex}, ${photoIndex})" title="Eliminar foto" style="flex-shrink:0;"><i class="fas fa-trash"></i></button>` : ''}
                </div>`;
        }).join('');

        return `
            <div style="background:white;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:15px;overflow:hidden;">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;gap:8px;">
                    <div style="flex:1;">
                        <span style="font-size:0.85rem;font-weight:700;color:var(--p-blue);"><i class="fas fa-folder"></i> ${folder.name}</span>
                        <p style="margin:4px 0 0 0;font-size:0.75rem;color:#999;">${folder.createdAt}</p>
                        ${folder.desc ? `<p style="margin:4px 0 0 0;font-size:0.8rem;color:var(--p-text);line-height:1.3;">${folder.desc}</p>` : ''}
                    </div>
                    <span style="font-size:0.75rem;color:#666;white-space:nowrap;">${folder.photos?.length || 0} fotos</span>
                    ${hasPermission('gallery') ? `
                        <button class="btn-mini" onclick="openRenameFolderModal(${folderIndex})" title="Renombrar carpeta" style="background:var(--p-blue);color:white;flex-shrink:0;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-mini btn-mini-delete" onclick="deleteFolderWithPhotos(${folderIndex})" title="Eliminar carpeta" style="flex-shrink:0;">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                <div style="padding:12px;">
                    ${items.length > 0 ? items : '<p style="text-align:center;color:#999;font-size:0.85rem;margin:10px 0;">Esta carpeta está vacía</p>'}
                </div>
            </div>`;
    }).join('');
}

function renderGalleryPublic() {
    const container = document.getElementById('gallery-public');
    if (!container) return;
    if (!state.gallery || state.gallery.length === 0) {
        container.innerHTML = '<p class="empty-msg">No hay fotos registradas.</p>';
        return;
    }

    container.innerHTML = state.gallery.map(folder => {
        const photos = folder.photos || [];
        if (photos.length === 0) return '';

        const thumbs = photos.map(photo => `
            <div style="position:relative;">
                <img src="${photo.url}" onclick="openPreview('${photo.url}')" style="width:80px;height:80px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid #e2e8f0;">
                <p style="font-size:0.75rem;color:#666;margin-top:4px;text-align:center;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${photo.originalName}">${photo.originalName || 'Foto'}</p>
            </div>
        `).join('');

        return `
            <div style="background:white;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:15px;overflow:hidden;">
                <div style="padding:12px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:0.85rem;font-weight:700;color:var(--p-blue);"><i class="fas fa-folder"></i> ${folder.name}</span>
                    <span style="font-size:0.8rem;color:#666;margin-left:10px;">${folder.createdAt} • ${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'}</span>
                    ${folder.desc ? `<p style="margin:8px 0 0 0;font-size:0.8rem;color:var(--p-text);line-height:1.3;">${folder.desc}</p>` : ''}
                </div>
                <div style="display:flex;gap:12px;flex-wrap:wrap;padding:14px;">
                    ${thumbs}
                </div>
            </div>`;
    }).join('');
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
    const activeTab = document.getElementById('admin-tab-curso')?.classList.contains('tab-btn-active') ? 'curso' : 'mensual';
    tableBody.innerHTML = state.students.map(s => {
        const pagosMensual = (state.monthlyHistory || {})[s.id] || {};
        const pagosCurso = (state.cursoHistory || {})[s.id] || {};

        const mesesCursoBtn = MESES_CURSO.map(mes => {
            const paid = pagosCurso[mes];
            return `<td class="col-curso" style="text-align:center; padding:6px 2px;">
                <button onclick="toggleCursoPayment(${s.id}, '${mes}')"
                    title="${mes}"
                    style="width:30px; height:30px; border-radius:50%; border:none; cursor:pointer; font-size:0.7rem; font-weight:700;
                    background:${paid ? 'var(--p-green)' : '#eee'};
                    color:${paid ? 'white' : '#aaa'}; transition:all 0.2s;">
                    ${paid ? '✓' : mes[0]}
                </button>
            </td>`;
        }).join('');

        const mesesMensualBtn = MESES_MENSUAL.map(mes => {
            const paid = pagosMensual[mes];
            return `<td class="col-mensual" style="text-align:center; padding:6px 2px;">
                <button onclick="toggleMonthlyPayment(${s.id}, '${mes}')"
                    title="${mes}"
                    style="width:30px; height:30px; border-radius:50%; border:none; cursor:pointer; font-size:0.7rem; font-weight:700;
                    background:${paid ? 'var(--p-blue)' : '#eee'};
                    color:${paid ? 'white' : '#aaa'}; transition:all 0.2s;">
                    ${paid ? '✓' : mes[0]}
                </button>
            </td>`;
        }).join('');

        return `
        <tr>
            <td style="white-space:nowrap; padding:8px 6px; font-size:0.8rem;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <button onclick="removeStudent(${s.id})" title="Eliminar alumno"
                        style="width:22px; height:22px; border-radius:50%; border:none; cursor:pointer; background:#fee; color:var(--p-red); font-size:0.7rem; font-weight:700; flex-shrink:0;">✕</button>
                    <span>${s.name}</span>
                </div>
            </td>
            ${mesesCursoBtn}
            ${mesesMensualBtn}
        </tr>`;
    }).join('');
    setTimeout(() => adminSwitchTab(activeTab), 0);
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

const MESES_CURSO = ['May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MESES_MENSUAL = ['Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

window.adminSwitchTab = (tab) => {
    const isCurso = tab === 'curso';
    document.getElementById('admin-tab-curso')?.classList.toggle('tab-btn-active', isCurso);
    document.getElementById('admin-tab-mensual')?.classList.toggle('tab-btn-active', !isCurso);
    document.querySelectorAll('.col-curso').forEach(el => el.style.display = isCurso ? '' : 'none');
    document.querySelectorAll('.col-mensual').forEach(el => el.style.display = isCurso ? 'none' : '');
    document.querySelectorAll('.th-curso').forEach(el => el.style.display = isCurso ? '' : 'none');
    document.querySelectorAll('.th-mensual').forEach(el => el.style.display = isCurso ? 'none' : '');
};

window.addStudent = () => {
    const input = document.getElementById('new-student-name');
    const name = input.value.trim();
    if (!name) return;
    const newId = Date.now();
    const newItem = { id: newId, name, paidCentro: false, paidMonthly: false, proofCentro: null, proofMonthly: null };
    fbSet('students/' + state.students.length, newItem);
    input.value = '';
    document.getElementById('add-student-form').style.display = 'none';
};

window.removeStudent = (id) => {
    if (!confirm('¿Eliminar este alumno de la lista?')) return;
    const sIdx = state.students.findIndex(s => s.id === id);
    if (sIdx !== -1) {
        fbRemove('students/' + sIdx);
        if (state.monthlyHistory) fbRemove('monthlyHistory/' + id);
    }
};

window.toggleMonthlyPayment = (studentId, mes) => {
    if (!state.monthlyHistory) state.monthlyHistory = {};
    if (!state.monthlyHistory[studentId]) state.monthlyHistory[studentId] = {};
    const current = !!state.monthlyHistory[studentId][mes];
    fbSet('monthlyHistory/' + studentId + '/' + mes, !current);
};

window.toggleCursoPayment = (studentId, mes) => {
    if (!state.cursoHistory) state.cursoHistory = {};
    if (!state.cursoHistory[studentId]) state.cursoHistory[studentId] = {};
    const current = !!state.cursoHistory[studentId][mes];
    fbSet('cursoHistory/' + studentId + '/' + mes, !current);
};

function renderDonations() {
    const isAdmin = !!document.getElementById('students-table');

    // Panel público
    const container = document.getElementById('donations-list');
    if (container) {
        if (!state.donations || state.donations.length === 0) {
            container.innerHTML = '<p class="empty-msg">No hay donaciones registradas.</p>';
            return;
        }
        container.innerHTML = state.donations.map(d => `
            <div class="card" style="border-left: 5px solid var(--p-green); background:white; padding:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:800; color:var(--p-green); font-size:0.85rem;">DONACIÓN</span>
                    <span style="color:#aaa; font-size:0.8rem;">${d.date}</span>
                </div>
                <p style="font-weight:700; margin-bottom:4px;">${d.type}</p>
                <p style="color:#666; font-size:0.9rem;">${d.desc || ''}</p>
            </div>
        `).join('');
    }

    // Panel admin
    const adminContainer = document.getElementById('donations-list-admin');
    if (adminContainer) {
        if (!state.donations || state.donations.length === 0) {
            adminContainer.innerHTML = '<p class="empty-msg">No hay donaciones registradas.</p>';
            return;
        }
        adminContainer.innerHTML = state.donations.map(d =>
            adminCard({ icon:'fas fa-gift', iconBg:'var(--p-green)', title: d.type, subtitle: `${d.desc || '—'} • ${d.date}`, onDelete:`deleteDonation(${d.id})`, canDelete: hasPermission('donations') })
        ).join('');
    }
}

window.deleteDonation = (id) => {
    if (confirm("¿Borrar esta donación?")) {
        const item = state.donations.find(d => d.id === id);
        if (item) fbRemove('donations/' + item.id);
    }
};

function renderHistorialCurso() {
    const tbody = document.getElementById('historial-curso-table');
    if (!tbody) return;
    tbody.innerHTML = state.students.map(s => {
        const pagos = (state.cursoHistory || {})[s.id] || {};
        return `
        <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:10px 8px; white-space:nowrap;">${s.name}</td>
            ${MESES_CURSO.map(mes => {
                const paid = pagos[mes];
                return `<td style="padding:10px 4px; text-align:center;">
                    <span style="display:inline-block; width:28px; height:28px; border-radius:50%;
                        background:${paid ? 'var(--p-green)' : '#f1f5f9'};
                        color:${paid ? 'white' : '#aaa'};
                        font-size:0.7rem; line-height:28px; font-weight:700;">
                        ${paid ? '✓' : '—'}
                    </span>
                </td>`;
            }).join('')}
        </tr>`;
    }).join('');
}

function renderHistorialMensual() {
    const tbody = document.getElementById('historial-mensual-table');
    if (!tbody) return;
    if (!state.monthlyHistory) {
        tbody.innerHTML = state.students.map(s => `
            <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:10px 8px; white-space:nowrap;">${s.name}</td>
                ${MESES_MENSUAL.map(() => `<td style="padding:10px 4px; text-align:center;">—</td>`).join('')}
            </tr>
        `).join('');
        return;
    }
    tbody.innerHTML = state.students.map(s => {
        const pagos = state.monthlyHistory[s.id] || {};
        return `
            <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:10px 8px; white-space:nowrap;">${s.name}</td>
                ${MESES_MENSUAL.map(mes => {
                    const paid = pagos[mes];
                    return `<td style="padding:10px 4px; text-align:center;">
                        <span style="display:inline-block; width:28px; height:28px; border-radius:50%; background:${paid ? 'var(--p-green)' : '#f1f5f9'}; color:${paid ? 'white' : '#aaa'}; font-size:0.7rem; line-height:28px; font-weight:700;">${paid ? '✓' : '—'}</span>
                    </td>`;
                }).join('')}
            </tr>
        `;
    }).join('');
}


// --- Action Functions ---
window.togglePayment = (id, field) => {
    const s = state.students.find(x => x.id === id);
    if (!s) return;
    s[field] = !s[field];
    
    if (s[field]) {
        const newTx = {
            id: Date.now(),
            student: s.name,
            type: field === 'paidCentro' ? 'Cuota Curso' : 'Cuota Mensual',
            amount: field === 'paidCentro' ? 10000 : 2000,
            date: new Date().toLocaleDateString('es-CL')
        };
        fbSet('paymentHistory/' + newTx.id, newTx);
    }
    
    const sIdx = state.students.findIndex(x => x.id === id);
    if (sIdx !== -1) fbSet('students/' + sIdx, s);
};

window.deleteExpense = (id) => { if (!hasPermission('expenses')) { alert("No tienes permiso para eliminar gastos."); return; } if (confirm("¿Borrar gasto?")) { const item = state.expenses.find(e => e.id === id); if(item) { fbRemove('expenses/' + item.id); } } };
window.deleteRequest = (id) => { if (!hasPermission('requests')) { alert("No tienes permiso para eliminar requerimientos."); return; } if (confirm("¿Borrar requerimiento?")) { const item = state.requests.find(e => e.id === id); if(item) { fbRemove('requests/' + item.id); } } };
window.deleteEvent = (id) => { if (!hasPermission('events')) { alert("No tienes permiso para eliminar eventos."); return; } if (confirm("¿Borrar evento?")) { const item = state.events.find(e => e.id === id); if(item) { fbRemove('events/' + item.id); } } };
window.deletePhoto = (id) => { if (!hasPermission('gallery')) { alert("No tienes permiso para eliminar fotos."); return; } if (confirm("¿Borrar foto?")) { const item = state.gallery.find(e => e.id === id); if(item) { fbRemove('gallery/' + item.id); } } };
window.deleteProof = (id, type) => { if (confirm("¿Borrar comprobante?")) { 
    const s = state.students.find(s => s.id === id); 
    if(s) { 
        s[type] = null; 
        const sIdx = state.students.findIndex(x => x.id === id);
        if(sIdx !== -1) fbSet('students/' + sIdx, s);
    } 
} };

window.openProofModal = (id, type) => {
    currentProofTarget = { id, type };
    document.getElementById('modal-proof').style.display = 'flex';
};

document.getElementById('save-proof-btn')?.addEventListener('click', async () => {
    const file = document.getElementById('student-proof-file').files[0];
    const btn = document.getElementById('save-proof-btn');
    if (file) {
        btn.disabled = true;
        btn.textContent = 'Subiendo...';
        const url = await uploadFileToCloudinary(file, 'comprobantes');
        if (url) {
            const s = state.students.find(x => x.id === currentProofTarget.id);
            if (s) {
                s[currentProofTarget.type] = url;
                s[currentProofTarget.type === 'proofCentro' ? 'paidCentro' : 'paidMonthly'] = true;
                const studentIndex = state.students.findIndex(x => x.id === currentProofTarget.id);
                if (studentIndex !== -1) {
                    fbSet('students/' + studentIndex, s);
                }
            }
        } else {
            alert('Error al subir el comprobante.');
        }
        btn.disabled = false;
        btn.textContent = 'Guardar';
        document.getElementById('modal-proof').style.display = 'none';
    }
});

window.previewExpenseImages = (input) => {
    const preview = document.getElementById('exp-preview');
    if (!preview) return;
    preview.innerHTML = '';
    Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target.result;
            preview.innerHTML += `
                <div style="position:relative;width:64px;height:64px;">
                    <img src="${src}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #ddd;">
                    <button onclick="openPreview('${src}')" type="button"
                        style="position:absolute;bottom:2px;right:2px;width:18px;height:18px;border-radius:50%;background:var(--p-blue);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;">
                        <i class="fas fa-expand" style="color:white;font-size:0.5rem;"></i>
                    </button>
                </div>`;
        };
        reader.readAsDataURL(file);
    });
};

document.getElementById('expense-form')?.addEventListener('submit', (e) => {
    if (!hasPermission('expenses')) {
        alert("No tienes permiso para registrar gastos.");
        e.preventDefault();
        return;
    }
    e.preventDefault();
    const desc = document.getElementById('exp-desc').value;
    const amount = document.getElementById('exp-amount').value;
    const files = Array.from(document.getElementById('exp-image').files);
    const date = new Date().toLocaleDateString();

    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

    const saveExpense = (imagesData) => {
        const newItem = { id: Date.now(), desc, amount, images: imagesData, date };
        fbSet('expenses/' + newItem.id, newItem);
        e.target.reset();
        const prev = document.getElementById('exp-preview'); if (prev) prev.innerHTML = '';
        if (btn) { btn.disabled = false; btn.textContent = 'Registrar'; }
    };

    if (files.length === 0) {
        saveExpense([]);
    } else {
        Promise.all(files.map(f => uploadFileToCloudinary(f, 'gastos')))
            .then(urls => saveExpense(urls.filter(u => u)))
            .catch(() => {
                alert('Error subiendo imágenes');
                if (btn) { btn.disabled = false; btn.textContent = 'Registrar'; }
            });
    }
});

window.previewRequestImage = (input) => {
    const preview = document.getElementById('req-preview');
    if (!preview) return;
    preview.innerHTML = '';
    Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML += `<img src="${e.target.result}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #ddd;cursor:pointer;" onclick="openPreview('${e.target.result}')">`;
        };
        reader.readAsDataURL(file);
    });
};

window.previewParticipationImage = (input) => {
    const preview = document.getElementById('part-preview');
    if (!preview) return;
    preview.innerHTML = '';
    if (input.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #ddd;">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.previewRelevantInfoImage = (input) => {
    const preview = document.getElementById('info-preview');
    if (!preview) return;
    preview.innerHTML = '';
    if (input.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #ddd;">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
};

document.getElementById('request-form')?.addEventListener('submit', (e) => {
    if (!hasPermission('requests')) {
        alert("No tienes permiso para registrar requerimientos.");
        e.preventDefault();
        return;
    }
    e.preventDefault();
    const files = Array.from(document.getElementById('req-image').files);
    const item = document.getElementById('req-item').value;
    const teacher = document.getElementById('req-teacher').value;
    const room = document.getElementById('req-room').value;
    const note = document.getElementById('req-note').value;

    const saveRequest = (imagesData) => {
        const newItem = {
            id: Date.now(),
            item,
            teacher,
            room,
            note,
            images: imagesData || [],
            status: 'Pendiente'
        };
        fbSet('requests/' + newItem.id, newItem);
        e.target.reset();
        document.getElementById('req-preview').innerHTML = '';
    };

    if (files.length > 0) {
        const compressed = [];
        let done = 0;
        files.forEach((file, i) => {
            compressImage(file, (b64) => {
                compressed[i] = b64;
                done++;
                if (done === files.length) {
                    saveRequest(compressed);
                }
            });
        });
    } else {
        saveRequest([]);
    }
});

document.getElementById('event-form')?.addEventListener('submit', (e) => {
    if (!hasPermission('events')) {
        alert("No tienes permiso para programar eventos.");
        e.preventDefault();
        return;
    }
    e.preventDefault();
    const newItem = { id: Date.now(), name: document.getElementById('event-name').value, date: document.getElementById('event-date').value }; fbSet('events/' + newItem.id, newItem); e.target.reset();
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
    list.innerHTML = state.announcements.map((ann, index) => {
        const bg = ann.type === 'Nota' ? 'var(--p-red)' : ann.type === 'Consejo' ? 'var(--p-green)' : 'var(--p-blue)';
        return adminCard({ icon:'fas fa-comment', iconBg: bg, title: ann.text.substring(0,40) + (ann.text.length>40?'…':''), subtitle:`${ann.type} · ${ann.date}`, onDelete:`deleteAnnouncement(${index})`, canDelete: hasPermission('announcements') });
    }).join('');
}

document.getElementById('announcement-form')?.addEventListener('submit', (e) => {
    if (!hasPermission('announcements')) {
        alert("No tienes permiso para crear comunicados.");
        e.preventDefault();
        return;
    }
    e.preventDefault();
    const text = document.getElementById('ann-text').value;
    const type = document.getElementById('ann-type').value;
    if (!state.announcements) state.announcements = [];
    const newItem = { id: Date.now(), text, type, date: new Date().toLocaleDateString() };
    fbSet('announcements/' + newItem.id, newItem); e.target.reset();
    alert("Comunicado publicado con éxito.");
});

window.deleteAnnouncement = (index) => {
    if (confirm("¿Borrar este comunicado?")) {
        const item = state.announcements[index];
        if (item) fbRemove('announcements/' + item.id);
    }
};

function renderParticipations() {
    const isAdmin = !!document.getElementById('students-table');

    // Panel público
    const container = document.getElementById('participations-list');
    if (container) {
        if (!state.participations || state.participations.length === 0) {
            container.innerHTML = '<p class="empty-msg">No hay participaciones registradas.</p>';
            return;
        }
        container.innerHTML = state.participations.map(p => {
            const statusColor = p.status === 'Realizado' ? 'var(--p-green)' : 'var(--p-orange)';
            const imgHTML = p.image ? `<img src="${p.image}" onclick="openPreview('${p.image}')" style="width:80px;height:80px;object-fit:cover;border-radius:8px;cursor:pointer;margin-bottom:12px;">` : '';
            return `
                <div class="card" style="border-left: 5px solid ${statusColor}; background:white; padding:20px;">
                    ${imgHTML}
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-weight:800; color:${statusColor}; font-size:0.85rem;">${p.type.toUpperCase()}</span>
                        <span style="color:#aaa; font-size:0.8rem;">${p.date}</span>
                    </div>
                    <p style="color:#666; font-size:0.9rem; margin-bottom:8px; white-space: pre-wrap;">${p.desc || ''}</p>
                    <span style="display:inline-block; padding:4px 10px; border-radius:20px; background:${statusColor}; color:white; font-size:0.75rem; font-weight:700;">${p.status}</span>
                </div>
            `;
        }).join('');
    }

    // Panel admin
    const adminContainer = document.getElementById('participations-list-admin');
    if (adminContainer) {
        if (!state.participations || state.participations.length === 0) {
            adminContainer.innerHTML = '<p class="empty-msg">No hay participaciones registradas.</p>';
            return;
        }
        adminContainer.innerHTML = state.participations.map(p => {
            const statusColor = p.status === 'Realizado' ? 'var(--p-green)' : 'var(--p-orange)';
            const imgHTML = p.image ? `<img src="${p.image}" onclick="openPreview('${p.image}')" style="width:48px;height:48px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid #e2e8f0;flex-shrink:0;">` : '';
            return `
                <div style="display:flex;align-items:center;gap:10px;padding:12px;background:white;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;">
                    ${imgHTML}
                    <div style="flex:1; min-width:0;">
                        <p style="margin:0;font-size:0.85rem;font-weight:600;color:var(--p-text);">${p.type}</p>
                        <p style="margin:0;font-size:0.8rem;color:#666;white-space:pre-wrap;">${p.desc || '—'}</p>
                        <div style="margin-top:6px;">
                            <select onchange="updateParticipationStatus(${p.id}, this.value)" style="padding:4px 8px; border:1px solid #ddd; border-radius:6px; font-size:0.8rem;">
                                <option value="Pendiente" ${p.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                                <option value="Realizado" ${p.status === 'Realizado' ? 'selected' : ''}>Realizado</option>
                            </select>
                        </div>
                    </div>
                    ${hasPermission('participations') ? `<button class="btn-mini btn-mini-delete" onclick="deleteParticipation(${p.id})" title="Eliminar participación"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            `;
        }).join('');
    }
}

window.updateParticipationStatus = (id, newStatus) => {
    const part = state.participations.find(p => p.id === id);
    if (part) {
        part.status = newStatus;
        fbSet('participations/' + part.id, part);
    }
};

window.deleteParticipation = (id) => {
    if (confirm("¿Borrar esta participación?")) {
        const item = state.participations.find(p => p.id === id);
        if (item) fbRemove('participations/' + item.id);
    }
};

function renderRelevantInfo() {
    const isAdmin = !!document.getElementById('students-table');
    const emptyHTML = '<p class="empty-msg">No hay información relevante registrada.</p>';
    const renderCard = (info) => {
        const imgHTML = info.image ? `<img src="${info.image}" onclick="openPreview('${info.image}')" style="width:100%;max-width:300px;object-fit:cover;border-radius:10px;cursor:pointer;margin-bottom:12px;">` : '';
        return `
            <div class="card" style="border-left: 5px solid #9C27B0; background:white; padding:20px;">
                ${imgHTML}
                <h3 style="margin:0 0 10px 0; color:var(--p-text);">${info.title}</h3>
                <p style="color:#666; font-size:0.9rem; white-space: pre-wrap; margin-bottom:8px;">${info.desc || ''}</p>
                <span style="font-size:0.75rem;color:#aaa;">${info.date}</span>
            </div>
        `;
    };

    if (!state.relevantInfo || state.relevantInfo.length === 0) {
        const containerPublic = document.getElementById('relevant-info-list-public');
        if (containerPublic) containerPublic.innerHTML = emptyHTML;
        const adminContainer = document.getElementById('relevant-info-list-admin');
        if (adminContainer) adminContainer.innerHTML = emptyHTML;
        return;
    }

    // Página principal - index.html
    const containerPublic = document.getElementById('relevant-info-list-public');
    if (containerPublic) {
        containerPublic.innerHTML = state.relevantInfo.map(renderCard).join('');
    }

    // Panel admin
    const adminContainer = document.getElementById('relevant-info-list-admin');
    if (adminContainer) {
        adminContainer.innerHTML = state.relevantInfo.map(info => {
            const imgHTML = info.image ? `<img src="${info.image}" onclick="openPreview('${info.image}')" style="width:48px;height:48px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid #e2e8f0;flex-shrink:0;">` : '';
            return `
                <div style="display:flex;align-items:center;gap:10px;padding:12px;background:white;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;">
                    ${imgHTML}
                    <div style="flex:1; min-width:0;">
                        <p style="margin:0;font-size:0.85rem;font-weight:600;color:var(--p-text);">${info.title}</p>
                        <p style="margin:0;font-size:0.8rem;color:#666;white-space:pre-wrap;">${info.desc || '—'}</p>
                        <p style="margin:4px 0 0 0;font-size:0.75rem;color:#999;">${info.date}</p>
                    </div>
                    ${hasPermission('relevantInfo') ? `<button class="btn-mini btn-mini-delete" onclick="deleteRelevantInfo(${info.id})" title="Eliminar información"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            `;
        }).join('');
    }
}

window.deleteRelevantInfo = (id) => {
    if (confirm("¿Borrar esta información?")) {
        const item = state.relevantInfo.find(i => i.id === id);
        if (item) fbRemove('relevantInfo/' + item.id);
    }
};

// Llenar select de carpetas cuando se carga la página o cambia la galería
function populateFolderSelect() {
    const select = document.getElementById('folder-select');
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- Selecciona una carpeta --</option>';
    (state.gallery || []).forEach((folder, index) => {
        select.innerHTML += `<option value="${index}">${folder.name}</option>`;
    });
    if (currentValue) select.value = currentValue;
}

window.createFolder = function(e) {
    if (!hasPermission('gallery')) {
        alert("No tienes permiso para crear carpetas.");
        e.preventDefault();
        return;
    }
    e.preventDefault();
    const folderName = (document.getElementById('folder-name')?.value || '').trim();
    const folderDesc = (document.getElementById('folder-desc')?.value || '').trim();

    if (!folderName) {
        alert("Por favor ingresa un nombre para la carpeta");
        return;
    }

    if (!state.gallery) state.gallery = [];
    const newFolder = {
        id: Date.now(),
        name: folderName,
        desc: folderDesc,
        createdAt: new Date().toLocaleDateString('es-CL'),
        photos: []
    };
    fbSet('gallery/' + newFolder.id, newFolder);
    document.getElementById('gallery-folder-form').reset();
    populateFolderSelect();
    alert(`Carpeta "${folderName}" creada con éxito`);
};

window.uploadPhotoToFolder = function(e) {
    if (!hasPermission('gallery')) {
        alert("No tienes permiso para subir fotos.");
        e.preventDefault();
        return;
    }
    e.preventDefault();

    const folderIndex = document.getElementById('folder-select').value;
    if (folderIndex === '') {
        alert("Por favor selecciona una carpeta");
        return;
    }

    const files = Array.from(document.getElementById('photo-file').files);
    if (files.length === 0) {
        alert("Por favor selecciona al menos una foto");
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = `Subiendo ${files.length} foto(s)...`;

    const folder = state.gallery[folderIndex];
    if (!folder.photos) folder.photos = [];

    let uploadedCount = 0;
    let failedCount = 0;
    let totalProcessed = 0;

    const checkIfDone = () => {
        totalProcessed++;
        if (totalProcessed === files.length) {
            // saveState() removed in favor of fbSet above
            e.target.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Subir Fotos';
            if (failedCount > 0) {
                alert(`Se subieron ${uploadedCount} foto(s), pero ${failedCount} fallaron.`);
            } else {
                alert(`¡${uploadedCount} foto(s) subida(s) con éxito!`);
            }
            populateFolderSelect();
            render();
        }
    };

    files.forEach((file, index) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'jardin-charitas/galeria');

        fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.secure_url) {
                folder.photos.push({
                    id: Date.now() + index,
                    originalName: file.name,
                    url: data.secure_url
                });
                uploadedCount++;
                console.log(`✓ Foto ${index + 1} subida: ${file.name}`);
                fbSet('gallery/' + folder.id + '/photos', folder.photos);
            } else {
                failedCount++;
                console.error(`✗ Error en foto ${index + 1}:`, data);
            }
            checkIfDone();
        })
        .catch(error => {
            failedCount++;
            console.error(`✗ Error en foto ${index + 1}:`, error);
            checkIfDone();
        });
    });
};

window.deletePhotoFromFolder = function(folderIndex, photoIndex) {
    if (!hasPermission('gallery')) {
        alert("No tienes permiso para eliminar fotos.");
        return;
    }
    if (confirm("¿Eliminar esta foto?")) {
        if (state.gallery[folderIndex] && state.gallery[folderIndex].photos) {
            fbSet('gallery/' + state.gallery[folderIndex].id + '/photos', state.gallery[folderIndex].photos);
        }
    }
};

window.deleteFolderWithPhotos = function(folderIndex) {
    if (!hasPermission('gallery')) {
        alert("No tienes permiso para eliminar carpetas.");
        return;
    }
    const folder = state.gallery[folderIndex];
    if (!folder) return;

    const photoCount = (folder.photos || []).length;
    const message = photoCount > 0
        ? `¿Eliminar la carpeta "${folder.name}" y sus ${photoCount} foto(s)? Esta acción no se puede deshacer.`
        : `¿Eliminar la carpeta vacía "${folder.name}"?`;

    if (confirm(message)) {
        const folderId = state.gallery[folderIndex].id;
        fbRemove('gallery/' + folderId);
        populateFolderSelect();
    }
};

window.openRenameFolderModal = function(folderIndex) {
    const folder = state.gallery[folderIndex];
    const newName = prompt(`Renombrar carpeta:\n\nNombre actual: "${folder.name}"`, folder.name);
    if (newName && newName.trim()) {
        folder.name = newName.trim();
        fbSet('gallery/' + folder.id + '/name', folder.name);
    }
};

document.getElementById('gallery-folder-form')?.addEventListener('submit', window.createFolder);
document.getElementById('gallery-form')?.addEventListener('submit', window.uploadPhotoToFolder);

document.getElementById('donation-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('donation-type').value;
    const desc = document.getElementById('donation-desc').value;
    if (!state.donations) state.donations = [];
    const newItem = { id: Date.now(), type, desc, date: new Date().toLocaleDateString() }; fbSet('donations/' + newItem.id, newItem); e.target.reset();
    alert("Donación registrada con éxito.");
});

document.getElementById('relevant-info-form')?.addEventListener('submit', (e) => {
    if (!hasPermission('relevantInfo')) {
        alert("No tienes permiso para crear información relevante.");
        e.preventDefault();
        return;
    }
    e.preventDefault();
    const file = document.getElementById('info-image').files[0];
    const title = document.getElementById('info-title').value;
    const desc = document.getElementById('info-desc').value;

    const saveRelevantInfo = (imageData) => {
        const newItem = {
            id: Date.now(),
            title,
            desc,
            image: imageData || null,
            date: new Date().toLocaleDateString()
        };
        fbSet('relevantInfo/' + newItem.id, newItem);
        e.target.reset();
        document.getElementById('info-preview').innerHTML = '';
        alert("Información publicada con éxito.");
    };

    if (file) {
        compressImage(file, saveRelevantInfo);
    } else {
        saveRelevantInfo(null);
    }
});

document.getElementById('participation-form')?.addEventListener('submit', (e) => {
    if (!hasPermission('participations')) {
        alert("No tienes permiso para registrar participaciones.");
        e.preventDefault();
        return;
    }
    e.preventDefault();
    const file = document.getElementById('part-image').files[0];
    const type = document.getElementById('part-type').value;
    const desc = document.getElementById('part-desc').value;
    const status = document.getElementById('part-status').value;

    const saveParticipation = (imageData) => {
        const newItem = {
            id: Date.now(),
            type,
            desc,
            status,
            image: imageData || null,
            date: new Date().toLocaleDateString()
        };
        fbSet('participations/' + newItem.id, newItem);
        e.target.reset();
        document.getElementById('part-preview').innerHTML = '';
        alert("Participación registrada con éxito.");
    };

    if (file) {
        compressImage(file, saveParticipation);
    } else {
        saveParticipation(null);
    }
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
        const item = state.reviews[index];
        if (item) fbRemove('reviews/' + item.id);
    }
};

// --- Support System Logic ---
let currentSupportRequest = null;

window.openSupportModal = (requestId) => {
    currentSupportRequest = requestId;
    const modal = document.getElementById('modal-support');
    const list = document.getElementById('students-support-list');

    if (!modal || !list) return;

    list.innerHTML = state.students.map(student => `
        <button onclick="registerSupport(${student.id}, '${student.name}')"
            style="padding:15px; border:1px solid #ddd; border-radius:10px; background:white; cursor:pointer; text-align:left; transition:all 0.2s;"
            onmouseover="this.style.background='#f0f0f0'"
            onmouseout="this.style.background='white'">
            <strong>${student.name}</strong>
        </button>
    `).join('');

    modal.style.display = 'flex';
};

window.registerSupport = (studentId, studentName) => {
    if (!currentSupportRequest) return;

    if (!state.requestSupports) state.requestSupports = {};
    if (!state.requestSupports[currentSupportRequest]) state.requestSupports[currentSupportRequest] = [];

    // Verificar si ya apoyó
    const alreadySupported = state.requestSupports[currentSupportRequest].some(s => s.studentId === studentId);
    if (alreadySupported) {
        alert('Este niño ya está registrado como apoyo para este requerimiento.');
        return;
    }

    state.requestSupports[currentSupportRequest].push({
        studentId,
        studentName,
        date: new Date().toLocaleDateString()
    });

    fbSet('requestSupports/' + currentSupportRequest, state.requestSupports[currentSupportRequest]);
    document.getElementById('modal-support').style.display = 'none';
    alert(`¡Gracias! ${studentName} ha registrado su apoyo a este requerimiento.`);
};

window.deleteSupportFromRequest = (requestId, supportIndex) => {
    if (confirm('¿Eliminar este apoyo?')) {
        if (!state.requestSupports || !state.requestSupports[requestId]) return;
        state.requestSupports[requestId].splice(supportIndex, 1);
        if (state.requestSupports[requestId].length === 0) {
            fbRemove('requestSupports/' + requestId);
        } else {
            fbSet('requestSupports/' + requestId, state.requestSupports[requestId]);
        }
    }
};

function renderRequestSupports() {
    const container = document.getElementById('request-supports-container');
    if (!container) return;

    if (!state.requests || state.requests.length === 0 || !state.requestSupports) {
        container.innerHTML = '<p class="empty-msg">No hay apoyos registrados.</p>';
        return;
    }

    const html = (state.requests || []).map(req => {
        const supports = (state.requestSupports && state.requestSupports[req.id]) || [];
        if (supports.length === 0) return '';

        const supportsList = supports.map((s, idx) => `
            <div style="padding:8px 12px; background:#f9fafb; border-radius:8px; border-left:3px solid var(--p-blue); display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <p style="margin:0; font-weight:600; font-size:0.9rem;">${s.studentName}</p>
                    <p style="margin:0; font-size:0.8rem; color:#888;">${s.date}</p>
                </div>
                <button onclick="deleteSupportFromRequest(${req.id}, ${idx})" class="btn-mini btn-mini-delete" title="Eliminar apoyo">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        return `
            <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:15px; margin-bottom:12px;">
                <h4 style="margin:0 0 12px 0; color:var(--p-text);">${req.item}</h4>
                <p style="margin:0 0 12px 0; font-size:0.85rem; color:#666;">
                    <i class="fas fa-user"></i> ${req.teacher || 'Profesora'} - ${req.room || 'Sala'}
                </p>
                <div style="background:#f0f7ff; border-radius:8px; padding:12px; border-left:4px solid var(--p-blue);">
                    <p style="margin:0 0 8px 0; font-weight:700; font-size:0.9rem; color:var(--p-blue);">
                        <i class="fas fa-users"></i> ${supports.length} ${supports.length === 1 ? 'familia apoyando' : 'familias apoyando'}
                    </p>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${supportsList}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (!html) {
        container.innerHTML = '<p class="empty-msg">No hay apoyos registrados.</p>';
        return;
    }

    container.innerHTML = html;
}
// --- User Management Logic (SuperAdmin Only) ---
function renderUsersList() {
    const container = document.getElementById('users-list-container');
    if (!container) return;

    // Convertir state.users a array si es necesario y filtrar usuarios válidos
    let users = [];
    if (Array.isArray(state.users)) {
        users = state.users.filter(u => u != null && u.username && u.realname);
    } else if (state.users && typeof state.users === 'object') {
        users = Object.values(state.users).filter(u => u && u.username && u.realname);
    }

    if (!users || users.length === 0) {
        container.innerHTML = '<p style="font-size:0.8rem; color:#999; text-align:center; padding:20px;">No hay colaboradores invitados.</p>';
        return;
    }

    container.innerHTML = users.map((u, index) => {
        // Validar que el usuario tenga los datos necesarios
        if (!u || !u.realname || !u.username) {
            console.warn("Usuario inválido:", u);
            return '';
        }

        const accessType = u.permissions?.full ? 'ACCESO TOTAL' : 'ACCESO LIMITADO';
        const accessColor = u.permissions?.full ? '#e74c3c' : '#3498db';
        const createdDate = u.createdAt || 'N/A';
        const initials = String(u.realname || '?').charAt(0).toUpperCase();

        return `
            <div style="display:flex;align-items:center;gap:12px;padding:12px;background:white;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;border-left:4px solid ${accessColor};">
                <div style="flex-shrink:0;width:40px;height:40px;border-radius:50%;background:${accessColor};display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:0.9rem;">
                    ${initials}
                </div>
                <div style="flex:1;min-width:0;">
                    <p style="margin:0;font-size:0.85rem;font-weight:600;color:var(--p-text);">${u.realname}</p>
                    <p style="margin:0;font-size:0.8rem;color:#666;">@${u.username}</p>
                    <p style="margin:2px 0 0 0;font-size:0.7rem;color:#999;">Creado: ${createdDate}</p>
                    <span style="font-size:0.75rem;color:white;background:${accessColor};padding:2px 8px;border-radius:4px;display:inline-block;margin-top:4px;">${accessType}</span>
                </div>
                <button class="btn-mini" onclick="editUserAccount(${index})" title="Editar permisos" style="flex-shrink:0;background:#3498db;color:white;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-mini btn-mini-delete" onclick="deleteUserAccount(${index})" title="Eliminar acceso" style="flex-shrink:0;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).filter(html => html).join('');
}

let editingUserIndex = null;

window.openUserModal = () => {
    editingUserIndex = null;
    document.getElementById('modal-user').style.display = 'flex';
    document.getElementById('user-modal-title').textContent = 'Crear Nuevo Acceso';
};

window.closeUserModal = () => {
    document.getElementById('modal-user').style.display = 'none';
    document.getElementById('user-form').reset();
    editingUserIndex = null;
};

window.editUserAccount = (index) => {
    editingUserIndex = index;
    const user = state.users[index];
    if (!user) return;

    document.getElementById('user-modal-title').textContent = 'Editar Permisos: ' + user.realname;
    document.getElementById('new-user-realname').value = user.realname;
    document.getElementById('new-user-realname').disabled = true;
    document.getElementById('new-username').value = user.username;
    document.getElementById('new-username').disabled = true;
    document.getElementById('new-password').value = user.password;

    document.getElementById('p-payments').checked = user.permissions?.payments || false;
    document.getElementById('p-expenses').checked = user.permissions?.expenses || false;
    document.getElementById('p-requests').checked = user.permissions?.requests || false;
    document.getElementById('p-gallery').checked = user.permissions?.gallery || false;
    document.getElementById('p-events').checked = user.permissions?.events || false;
    document.getElementById('p-donations').checked = user.permissions?.donations || false;
    document.getElementById('p-announcements').checked = user.permissions?.announcements || false;
    document.getElementById('p-relevantinfo').checked = user.permissions?.relevantInfo || false;
    document.getElementById('p-team').checked = user.permissions?.team || false;
    document.getElementById('p-history').checked = user.permissions?.history || false;
    document.getElementById('p-full').checked = user.permissions?.full || false;

    document.getElementById('modal-user').style.display = 'flex';
};

window.handleCreateUser = (e) => {
    try {
        e.preventDefault();
        console.log("Formulario enviado");

        // Asegurar que state.users sea un array
        if (!Array.isArray(state.users)) {
            state.users = state.users ? Object.values(state.users) : [];
        }
        if (!Array.isArray(state.deletedUsernames)) {
            state.deletedUsernames = state.deletedUsernames ? Object.values(state.deletedUsernames) : [];
        }

        const realname = (document.getElementById('new-user-realname')?.value || '').trim();
        const username = (document.getElementById('new-username')?.value || '').toLowerCase().trim();
        const password = (document.getElementById('new-password')?.value || '').trim();

        console.log("Datos:", { realname, username, password });

        if (!realname || !username || !password) {
            alert("Por favor completa todos los campos requeridos.");
            console.log("Campos vacíos detectados");
            return;
        }

        if (username.length < 3) {
            alert("El nombre de usuario debe tener al menos 3 caracteres.");
            return;
        }

        if (password.length < 4) {
            alert("La contraseña debe tener al menos 4 caracteres.");
            return;
        }

        // Si estamos editando, actualizar permisos
        if (editingUserIndex !== null) {
            const userToEdit = state.users[editingUserIndex];
            if (userToEdit) {
                userToEdit.password = password;
                userToEdit.permissions = {
                    payments: document.getElementById('p-payments')?.checked || false,
                    expenses: document.getElementById('p-expenses')?.checked || false,
                    requests: document.getElementById('p-requests')?.checked || false,
                    gallery: document.getElementById('p-gallery')?.checked || false,
                    events: document.getElementById('p-events')?.checked || false,
                    donations: document.getElementById('p-donations')?.checked || false,
                    announcements: document.getElementById('p-announcements')?.checked || false,
                    relevantInfo: document.getElementById('p-relevantinfo')?.checked || false,
                    team: document.getElementById('p-team')?.checked || false,
                    history: document.getElementById('p-history')?.checked || false,
                    full: document.getElementById('p-full')?.checked || false
                };
                fbSet('users/' + userIndex + '/permissions', state.users[userIndex].permissions);
                renderUsersList();
                window.closeUserModal();
                alert("Permisos actualizados correctamente.");
                return;
            }
        }

        // Verificar que el username no exista ya (solo en usuarios válidos)
        const existingUsers = state.users.filter(u => u && u.username);
        const userExists = existingUsers.some(u => u.username === username);

        if (userExists) {
            const existingUser = existingUsers.find(u => u.username === username);
            alert(`El nombre de usuario "@${username}" ya está siendo utilizado por: ${existingUser?.realname}\n\nPor favor elige otro nombre de usuario. Puedes intentar:\n• ${username}2\n• ${username}_${realname.split(' ')[0].toLowerCase()}\n• Otro nombre diferente`);
            return;
        }

        console.log("Validaciones pasadas, creando usuario...");

        const newUser = {
            id: Date.now(),
            realname,
            username,
            password,
            role: 'Collaborator',
            createdAt: new Date().toLocaleDateString('es-CL'),
            active: true,
            permissions: {
                payments: document.getElementById('p-payments')?.checked || false,
                expenses: document.getElementById('p-expenses')?.checked || false,
                requests: document.getElementById('p-requests')?.checked || false,
                gallery: document.getElementById('p-gallery')?.checked || false,
                events: document.getElementById('p-events')?.checked || false,
                donations: document.getElementById('p-donations')?.checked || false,
                announcements: document.getElementById('p-announcements')?.checked || false,
                relevantInfo: document.getElementById('p-relevantinfo')?.checked || false,
                team: document.getElementById('p-team')?.checked || false,
                history: document.getElementById('p-history')?.checked || false,
                full: document.getElementById('p-full')?.checked || false
            }
        };

        console.log("Nuevo usuario:", newUser);

        if (!state.users) state.users = [];
        fbSet('users/' + state.users.length, newUser);

        console.log("Usuario añadido, guardando estado...");

        console.log("Estado guardado, renderizando lista...");
        renderUsersList();

        console.log("Lista renderizada, cerrando modal...");
        window.closeUserModal();

        alert("¡Acceso creado con éxito!\n\nUsuario: " + username + "\nYa puedes entregarle estos datos a la persona.");
        console.log("Proceso completado");
    } catch (error) {
        console.error("Error al crear usuario:", error);
        alert("Error al crear el acceso: " + error.message);
    }
};

// Registrar el event listener cuando el DOM está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('user-form');
        if (form) {
            form.removeEventListener('submit', window.handleCreateUser);
            form.addEventListener('submit', window.handleCreateUser);
        }
    });
} else {
    const form = document.getElementById('user-form');
    if (form) {
        form.removeEventListener('submit', window.handleCreateUser);
        form.addEventListener('submit', window.handleCreateUser);
    }
}

window.deleteUserAccount = (index) => {
    const user = state.users[index];
    if (!user) return;

    if (confirm(`¿Deseas eliminar el acceso de "${user.realname}"?\n\nYa no podrá entrar al sistema.`)) {
        const item = state.users[index];
        if (item) fbRemove('users/' + item.id);
        renderUsersList();
        alert("Acceso eliminado correctamente. Este usuario ya no podrá acceder al sistema.");
    }
};


// Initialize
window.addEventListener('DOMContentLoaded', () => {
    const userData = sessionStorage.getItem('userData');
    const isUserAuthenticated = !!userData;
    const path = window.location.pathname;
    const publicPages = ['index.html', 'galeria.html', 'requerimientos.html', 'cuota-curso.html', 'centro-padres.html', 'login.html'];
    const isPublicPage = publicPages.some(p => path.includes(p)) || path.endsWith('/');

    if (!isUserAuthenticated && !isPublicPage) {
        window.location.href = 'login.html';
        return;
    }

    render();
    if (isUserAuthenticated) {
        setTimeout(checkPermissions, 100);
    }
});

window.logout = () => {
    sessionStorage.clear();
    window.location.href = 'login.html';
};

window.downloadBackup = () => {
    try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        const dateStr = new Date().toISOString().split('T')[0];
        downloadAnchorNode.setAttribute("download", "respaldo_jardin_" + dateStr + ".json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    } catch (e) {
        console.error("Error creating backup:", e);
        alert("Ocurrió un error al generar el respaldo.");
    }
};

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
