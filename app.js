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
    balance: 0,
    paymentHistory: [],
    cursoHistory: {},
    montos: { curso: 1092, mensual: 1092 }
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

    // jonathan y admin tienen acceso total
    if (user.username === 'jonathan' || user.username === 'admin') {
        return;
    }

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

// --- Tarjeta compacta unificada para admin ---
function adminCard({ icon, iconBg, imgSrc, title, subtitle, onDelete }) {
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
    return `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:white;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:6px;">
        ${visual}
        <div style="flex:1;min-width:0;">
            <p style="margin:0;font-size:0.83rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--p-text);">${title}</p>
            <span style="font-size:0.73rem;color:#999;">${subtitle || ''}</span>
        </div>
        <button class="btn-mini btn-mini-delete" onclick="${onDelete}" style="flex-shrink:0;"><i class="fas fa-trash"></i></button>
    </div>`;
}

// --- Rendering Functions ---
function render() {
    if (document.getElementById('current-balance')) renderBalance();
    if (document.getElementById('expenses-gallery')) renderExpenses();
    if (document.getElementById('requests-list')) renderRequests();
    if (document.getElementById('events-list')) renderEvents();
    if (document.getElementById('moments-gallery')) renderMomentsGallery();
    if (document.getElementById('gallery-list-admin')) renderGalleryAdmin();
    if (document.getElementById('gallery-public')) renderGalleryPublic();
    if (document.getElementById('relevant-info-list') || document.getElementById('relevant-info-list-admin')) renderRelevantInfo();
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
                    onDelete: `deleteExpense(${exp.id})`
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
                onDelete:`deleteRequest(${req.id})`
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
            adminCard({ icon:'fas fa-calendar', iconBg:'var(--p-blue)', title: ev.name, subtitle: ev.date, onDelete:`deleteEvent(${ev.id})` })
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
    const isAdmin = !!document.getElementById('students-table');
    if (isAdmin) {
        gal.innerHTML = state.gallery.map(img =>
            adminCard({ imgSrc: img.url, title: img.desc || 'Sin título', subtitle: img.date || '', onDelete:`deletePhoto(${img.id})` })
        ).join('');
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

function renderGalleryAdmin() {
    const container = document.getElementById('gallery-list-admin');
    if (!container) return;
    if (!state.gallery || state.gallery.length === 0) {
        container.innerHTML = '<p class="empty-msg">No hay fotos registradas.</p>';
        return;
    }

    // Agrupar por fecha
    const byDate = {};
    state.gallery.forEach(img => {
        const key = img.date || 'Sin fecha';
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(img);
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

    container.innerHTML = sortedDates.map(fecha => {
        const imgs = byDate[fecha];
        const items = imgs.map(img => {
            return adminCard({
                imgSrc: img.url,
                title: img.desc || 'Sin título',
                subtitle: fecha,
                onDelete: `deletePhoto(${img.id})`
            });
        }).join('');

        return `
            <div style="background:white;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:10px;overflow:hidden;">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:0.8rem;font-weight:700;color:var(--p-blue);"><i class="fas fa-calendar-day"></i> ${fecha}</span>
                    <span style="font-size:0.75rem;color:#666;">${imgs.length} ${imgs.length === 1 ? 'foto' : 'fotos'}</span>
                </div>
                ${items}
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

    // Agrupar por fecha
    const byDate = {};
    state.gallery.forEach(img => {
        const key = img.date || 'Sin fecha';
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(img);
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

    container.innerHTML = sortedDates.map(fecha => {
        const imgs = byDate[fecha];
        const thumbs = imgs.map(img => `
            <div style="position:relative;">
                <img src="${img.url}" onclick="openPreview('${img.url}')" style="width:80px;height:80px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid #e2e8f0;">
                <p style="font-size:0.75rem;color:#666;margin-top:4px;text-align:center;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${img.desc || 'Foto'}</p>
            </div>
        `).join('');

        return `
            <div style="background:white;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:15px;overflow:hidden;">
                <div style="padding:12px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:0.85rem;font-weight:700;color:var(--p-blue);"><i class="fas fa-calendar-day"></i> ${fecha}</span>
                    <span style="font-size:0.8rem;color:#666;margin-left:10px;">${imgs.length} ${imgs.length === 1 ? 'foto' : 'fotos'}</span>
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
    state.students.push({ id: newId, name, paidCentro: false, paidMonthly: false, proofCentro: null, proofMonthly: null });
    saveState();
    input.value = '';
    document.getElementById('add-student-form').style.display = 'none';
};

window.removeStudent = (id) => {
    if (!confirm('¿Eliminar este alumno de la lista?')) return;
    state.students = state.students.filter(s => s.id !== id);
    if (state.monthlyHistory) delete state.monthlyHistory[id];
    saveState();
};

window.toggleMonthlyPayment = (studentId, mes) => {
    if (!state.monthlyHistory) state.monthlyHistory = {};
    if (!state.monthlyHistory[studentId]) state.monthlyHistory[studentId] = {};
    state.monthlyHistory[studentId][mes] = !state.monthlyHistory[studentId][mes];
    saveState();
};

window.toggleCursoPayment = (studentId, mes) => {
    if (!state.cursoHistory) state.cursoHistory = {};
    if (!state.cursoHistory[studentId]) state.cursoHistory[studentId] = {};
    state.cursoHistory[studentId][mes] = !state.cursoHistory[studentId][mes];
    saveState();
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
            adminCard({ icon:'fas fa-gift', iconBg:'var(--p-green)', title: d.type, subtitle: `${d.desc || '—'} • ${d.date}`, onDelete:`deleteDonation(${d.id})` })
        ).join('');
    }
}

window.deleteDonation = (id) => {
    if (confirm("¿Borrar esta donación?")) {
        state.donations = state.donations.filter(d => d.id !== id);
        saveState();
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
    if (!state.paymentHistory) state.paymentHistory = [];
    if (s[field]) {
        state.paymentHistory.unshift({
            id: Date.now(),
            student: s.name,
            type: field === 'paidCentro' ? 'Cuota Curso' : 'Cuota Mensual',
            amount: field === 'paidCentro' ? 10000 : 2000,
            date: new Date().toLocaleDateString('es-CL')
        });
    }
    saveState();
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
    e.preventDefault();
    const desc = document.getElementById('exp-desc').value;
    const amount = document.getElementById('exp-amount').value;
    const files = Array.from(document.getElementById('exp-image').files);
    const date = new Date().toLocaleDateString();

    if (files.length === 0) {
        state.expenses.push({ id: Date.now(), desc, amount, images: [], date });
        saveState(); e.target.reset(); return;
    }

    const compressed = [];
    let done = 0;
    files.forEach((file, i) => {
        compressImage(file, (b64) => {
            compressed[i] = b64;
            done++;
            if (done === files.length) {
                state.expenses.push({ id: Date.now(), desc, amount, images: compressed, date });
                saveState(); e.target.reset();
                const prev = document.getElementById('exp-preview'); if (prev) prev.innerHTML = '';
            }
        });
    });
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
    e.preventDefault();
    const files = Array.from(document.getElementById('req-image').files);
    const item = document.getElementById('req-item').value;
    const teacher = document.getElementById('req-teacher').value;
    const room = document.getElementById('req-room').value;
    const note = document.getElementById('req-note').value;

    const saveRequest = (imagesData) => {
        state.requests.push({
            id: Date.now(),
            item,
            teacher,
            room,
            note,
            images: imagesData || [],
            status: 'Pendiente'
        });
        saveState();
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
    list.innerHTML = state.announcements.map((ann, index) => {
        const bg = ann.type === 'Nota' ? 'var(--p-red)' : ann.type === 'Consejo' ? 'var(--p-green)' : 'var(--p-blue)';
        return adminCard({ icon:'fas fa-comment', iconBg: bg, title: ann.text.substring(0,40) + (ann.text.length>40?'…':''), subtitle:`${ann.type} · ${ann.date}`, onDelete:`deleteAnnouncement(${index})` });
    }).join('');
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
                    <button class="btn-mini btn-mini-delete" onclick="deleteParticipation(${p.id})" title="Eliminar participación"><i class="fas fa-trash"></i></button>
                </div>
            `;
        }).join('');
    }
}

window.updateParticipationStatus = (id, newStatus) => {
    const part = state.participations.find(p => p.id === id);
    if (part) {
        part.status = newStatus;
        saveState();
    }
};

window.deleteParticipation = (id) => {
    if (confirm("¿Borrar esta participación?")) {
        state.participations = state.participations.filter(p => p.id !== id);
        saveState();
    }
};

function renderRelevantInfo() {
    const isAdmin = !!document.getElementById('students-table');

    // Panel público
    const container = document.getElementById('relevant-info-list');
    if (container) {
        if (!state.relevantInfo || state.relevantInfo.length === 0) {
            container.innerHTML = '<p class="empty-msg">No hay información relevante registrada.</p>';
            return;
        }
        container.innerHTML = state.relevantInfo.map(info => {
            const imgHTML = info.image ? `<img src="${info.image}" onclick="openPreview('${info.image}')" style="width:100%;max-width:300px;object-fit:cover;border-radius:10px;cursor:pointer;margin-bottom:12px;">` : '';
            return `
                <div class="card" style="border-left: 5px solid #9C27B0; background:white; padding:20px;">
                    ${imgHTML}
                    <h3 style="margin:0 0 10px 0; color:var(--p-text);">${info.title}</h3>
                    <p style="color:#666; font-size:0.9rem; white-space: pre-wrap; margin-bottom:8px;">${info.desc || ''}</p>
                    <span style="font-size:0.75rem;color:#aaa;">${info.date}</span>
                </div>
            `;
        }).join('');
    }

    // Panel admin
    const adminContainer = document.getElementById('relevant-info-list-admin');
    if (adminContainer) {
        if (!state.relevantInfo || state.relevantInfo.length === 0) {
            adminContainer.innerHTML = '<p class="empty-msg">No hay información relevante registrada.</p>';
            return;
        }
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
                    <button class="btn-mini btn-mini-delete" onclick="deleteRelevantInfo(${info.id})" title="Eliminar información"><i class="fas fa-trash"></i></button>
                </div>
            `;
        }).join('');
    }
}

window.deleteRelevantInfo = (id) => {
    if (confirm("¿Borrar esta información?")) {
        state.relevantInfo = state.relevantInfo.filter(i => i.id !== id);
        saveState();
    }
};

document.getElementById('gallery-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const file = document.getElementById('photo-file').files[0];
    if (file) compressImage(file, (url) => {
        state.gallery.push({ id: Date.now(), desc: document.getElementById('photo-desc').value, url, date: new Date().toLocaleDateString() });
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

document.getElementById('relevant-info-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const file = document.getElementById('info-image').files[0];
    const title = document.getElementById('info-title').value;
    const desc = document.getElementById('info-desc').value;

    const saveRelevantInfo = (imageData) => {
        if (!state.relevantInfo) state.relevantInfo = [];
        state.relevantInfo.push({
            id: Date.now(),
            title,
            desc,
            image: imageData || null,
            date: new Date().toLocaleDateString()
        });
        saveState();
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
    e.preventDefault();
    const file = document.getElementById('part-image').files[0];
    const type = document.getElementById('part-type').value;
    const desc = document.getElementById('part-desc').value;
    const status = document.getElementById('part-status').value;

    const saveParticipation = (imageData) => {
        if (!state.participations) state.participations = [];
        state.participations.push({
            id: Date.now(),
            type,
            desc,
            status,
            image: imageData || null,
            date: new Date().toLocaleDateString()
        });
        saveState();
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
        state.reviews.splice(index, 1);
        saveState();
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

    saveState();
    document.getElementById('modal-support').style.display = 'none';
    alert(`¡Gracias! ${studentName} ha registrado su apoyo a este requerimiento.`);
};

window.deleteSupportFromRequest = (requestId, supportIndex) => {
    if (confirm('¿Eliminar este apoyo?')) {
        if (!state.requestSupports || !state.requestSupports[requestId]) return;
        state.requestSupports[requestId].splice(supportIndex, 1);
        if (state.requestSupports[requestId].length === 0) {
            delete state.requestSupports[requestId];
        }
        saveState();
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
    const path = window.location.pathname;
    const publicPages = ['index.html', 'galeria.html', 'requerimientos.html', 'cuota-curso.html', 'centro-padres.html', 'login.html'];
    const isPublicPage = publicPages.some(p => path.includes(p)) || path.endsWith('/');

    if (!isAdmin && !isPublicPage) {
        window.location.href = 'login.html';
        return;
    }

    render();
    if (isAdmin) {
        setTimeout(checkPermissions, 100);
    }
});

window.logout = () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
};
