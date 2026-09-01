const fs = require('fs');

// Read app.js and convert all CRLF to LF
let code = fs.readFileSync('app.js', 'utf8').replace(/\r\n/g, '\n');

// 1. Cloudinary Helper & fbSet/fbRemove
const cloudinaryHelper = `
// --- Cloudinary Upload Helper ---
async function uploadFileToCloudinary(file, folderName = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'jardin-charitas/' + folderName);
    
    try {
        const response = await fetch(\`https://api.cloudinary.com/v1_1/\${CLOUDINARY_CLOUD_NAME}/image/upload\`, {
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
`;

if (!code.includes('uploadFileToCloudinary')) {
    code = code.replace('// --- Helper: Compress Image ---', cloudinaryHelper + '\n// --- Helper: Compress Image ---');
}

// 2. Refactor openProofModal & save-proof-btn
code = code.replace(
`document.getElementById('save-proof-btn')?.addEventListener('click', () => {
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
});`,
`document.getElementById('save-proof-btn')?.addEventListener('click', async () => {
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
});`);

// 3. Fix delete functions
code = code.replace(
`window.deleteExpense = (id) => { if (!hasPermission('expenses')) { alert("No tienes permiso para eliminar gastos."); return; } if (confirm("¿Borrar gasto?")) { state.expenses = state.expenses.filter(e => e.id !== id); saveState(); } };`,
`window.deleteExpense = (id) => { if (!hasPermission('expenses')) { alert("No tienes permiso para eliminar gastos."); return; } if (confirm("¿Borrar gasto?")) { const item = state.expenses.find(e => e.id === id); if(item) { fbRemove('expenses/' + item.id); } } };`);

code = code.replace(
`window.deleteRequest = (id) => { if (!hasPermission('requests')) { alert("No tienes permiso para eliminar requerimientos."); return; } if (confirm("¿Borrar requerimiento?")) { state.requests = state.requests.filter(r => r.id !== id); saveState(); } };`,
`window.deleteRequest = (id) => { if (!hasPermission('requests')) { alert("No tienes permiso para eliminar requerimientos."); return; } if (confirm("¿Borrar requerimiento?")) { const item = state.requests.find(e => e.id === id); if(item) { fbRemove('requests/' + item.id); } } };`);

code = code.replace(
`window.deleteEvent = (id) => { if (!hasPermission('events')) { alert("No tienes permiso para eliminar eventos."); return; } if (confirm("¿Borrar evento?")) { state.events = state.events.filter(ev => ev.id !== id); saveState(); } };`,
`window.deleteEvent = (id) => { if (!hasPermission('events')) { alert("No tienes permiso para eliminar eventos."); return; } if (confirm("¿Borrar evento?")) { const item = state.events.find(e => e.id === id); if(item) { fbRemove('events/' + item.id); } } };`);

code = code.replace(
`window.deletePhoto = (id) => { if (!hasPermission('gallery')) { alert("No tienes permiso para eliminar fotos."); return; } if (confirm("¿Borrar foto?")) { state.gallery = state.gallery.filter(g => g.id !== id); saveState(); } };`,
`window.deletePhoto = (id) => { if (!hasPermission('gallery')) { alert("No tienes permiso para eliminar fotos."); return; } if (confirm("¿Borrar foto?")) { const item = state.gallery.find(e => e.id === id); if(item) { fbRemove('gallery/' + item.id); } } };`);

code = code.replace(
`window.deleteProof = (id, type) => { if (confirm("¿Borrar comprobante?")) { state.students.find(s => s.id === id)[type] = null; saveState(); } };`,
`window.deleteProof = (id, type) => { if (confirm("¿Borrar comprobante?")) { 
    const s = state.students.find(s => s.id === id); 
    if(s) { 
        s[type] = null; 
        const sIdx = state.students.findIndex(x => x.id === id);
        if(sIdx !== -1) fbSet('students/' + sIdx, s);
    } 
} };`);

// Fix forms to use Cloudinary and fbSet

// request-form
code = code.replace(
`    const saveRequest = (imagesData) => {
        state.requests.push({
            id: Date.now(),
            item,
            teacher,
            room,
            note,
            images: imagesData,
            status: 'pending',
            date: new Date().toLocaleDateString()
        });
        saveState(); e.target.reset();
        const prev = document.getElementById('req-preview'); if (prev) prev.innerHTML = '';
    };

    if (files.length === 0) {
        saveRequest([]);
    } else {
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
    }`,
`    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

    const saveRequest = (imagesData) => {
        const newItem = {
            id: Date.now(),
            item,
            teacher,
            room,
            note,
            images: imagesData,
            status: 'pending',
            date: new Date().toLocaleDateString()
        };
        fbSet('requests/' + newItem.id, newItem);
        e.target.reset();
        const prev = document.getElementById('req-preview'); if (prev) prev.innerHTML = '';
        if (btn) { btn.disabled = false; btn.textContent = 'Registrar'; }
    };

    if (files.length === 0) {
        saveRequest([]);
    } else {
        Promise.all(files.map(f => uploadFileToCloudinary(f, 'requerimientos')))
            .then(urls => saveRequest(urls.filter(u => u)))
            .catch(() => {
                alert('Error subiendo imágenes');
                if (btn) { btn.disabled = false; btn.textContent = 'Registrar'; }
            });
    }`);

// expense-form
code = code.replace(
`    if (files.length === 0) {
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
    });`,
`    const btn = e.target.querySelector('button[type="submit"]');
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
    }`);


// participation-form
code = code.replace(
`    if (file) {
        compressImage(file, (b64) => {
            state.participations.push({ id: Date.now(), studentId: parseInt(studentId), desc, proof: b64, date: new Date().toLocaleDateString() });
            saveState(); e.target.reset();
            const prev = document.getElementById('part-preview'); if (prev) prev.innerHTML = '';
        });
    } else {
        state.participations.push({ id: Date.now(), studentId: parseInt(studentId), desc, proof: null, date: new Date().toLocaleDateString() });
        saveState(); e.target.reset();
    }`,
`    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

    const savePart = (url) => {
        const newItem = { id: Date.now(), studentId: parseInt(studentId), desc, proof: url, date: new Date().toLocaleDateString() };
        fbSet('participations/' + newItem.id, newItem);
        e.target.reset();
        const prev = document.getElementById('part-preview'); if (prev) prev.innerHTML = '';
        if (btn) { btn.disabled = false; btn.textContent = 'Registrar'; }
    };

    if (file) {
        uploadFileToCloudinary(file, 'participaciones').then(savePart).catch(() => {
            alert('Error'); if (btn) { btn.disabled = false; btn.textContent = 'Registrar'; }
        });
    } else {
        savePart(null);
    }`);

// relevant-info-form
code = code.replace(
`    if (file) {
        compressImage(file, (b64) => {
            state.relevantInfo.push({ id: Date.now(), studentId: parseInt(studentId), desc, type, proof: b64, date: new Date().toLocaleDateString() });
            saveState(); e.target.reset();
            const prev = document.getElementById('info-preview'); if (prev) prev.innerHTML = '';
        });
    } else {
        state.relevantInfo.push({ id: Date.now(), studentId: parseInt(studentId), desc, type, proof: null, date: new Date().toLocaleDateString() });
        saveState(); e.target.reset();
    }`,
`    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

    const saveInfo = (url) => {
        const newItem = { id: Date.now(), studentId: parseInt(studentId), desc, type, proof: url, date: new Date().toLocaleDateString() };
        fbSet('relevantInfo/' + newItem.id, newItem);
        e.target.reset();
        const prev = document.getElementById('info-preview'); if (prev) prev.innerHTML = '';
        if (btn) { btn.disabled = false; btn.textContent = 'Registrar'; }
    };

    if (file) {
        uploadFileToCloudinary(file, 'informacion').then(saveInfo).catch(() => {
            alert('Error'); if (btn) { btn.disabled = false; btn.textContent = 'Registrar'; }
        });
    } else {
        saveInfo(null);
    }`);

// For any remaining push()...saveState()
code = code.replace(/state\.donations\.push\(\{\s*(.*?)\s*\}\);\s*saveState\(\);/g, (match, p1) => {
    return "const newItem = { " + p1 + " }; fbSet('donations/' + newItem.id, newItem);";
});
code = code.replace(/state\.announcements\.push\(\{\s*(.*?)\s*\}\);\s*saveState\(\);/g, (match, p1) => {
    return "const newItem = { " + p1 + " }; fbSet('announcements/' + newItem.id, newItem);";
});
code = code.replace(/state\.events\.push\(\{\s*(.*?)\s*\}\);\s*saveState\(\);/g, (match, p1) => {
    return "const newItem = { " + p1 + " }; fbSet('events/' + newItem.id, newItem);";
});

// Gallery folder save logic
code = code.replace(
`window.createFolder = () => {
    const name = prompt("Nombre de la nueva carpeta (ej: Fiesta de Disfraces):");
    if (name) {
        state.gallery.push({
            id: Date.now(),
            name,
            desc: prompt("Descripción de la carpeta (opcional):"),
            photos: [],
            createdAt: new Date().toLocaleDateString('es-CL')
        });
        saveState();
        populateFolderSelect();
        render();
    }
};`,
`window.createFolder = () => {
    const name = prompt("Nombre de la nueva carpeta (ej: Fiesta de Disfraces):");
    if (name) {
        const newItem = {
            id: Date.now(),
            name,
            desc: prompt("Descripción de la carpeta (opcional):"),
            photos: [],
            createdAt: new Date().toLocaleDateString('es-CL')
        };
        fbSet('gallery/' + newItem.id, newItem);
        // Removed local push because on('value') will fetch it and re-render
    }
};`);

// uploadPhotoToFolder logic
code = code.replace(
`            if (data.secure_url) {
                folder.photos.push({
                    id: Date.now() + index,
                    originalName: file.name,
                    url: data.secure_url
                });
                uploadedCount++;
                console.log(\`✓ Foto \${index + 1} subida: \${file.name}\`);
            }`,
`            if (data.secure_url) {
                folder.photos.push({
                    id: Date.now() + index,
                    originalName: file.name,
                    url: data.secure_url
                });
                uploadedCount++;
                console.log(\`✓ Foto \${index + 1} subida: \${file.name}\`);
                fbSet('gallery/' + folder.id + '/photos', folder.photos);
            }`);
code = code.replace(`            saveState();`, `            // saveState() removed in favor of fbSet above`);

// Fix saveState calls for settings
code = code.replace(
`function saveMontoCurso() {
    const newVal = parseInt(document.getElementById('monto-curso-input').value);
    if (!isNaN(newVal)) {
        state.montos.curso = newVal;
        saveState();
    }
}`,
`function saveMontoCurso() {
    const newVal = parseInt(document.getElementById('monto-curso-input').value);
    if (!isNaN(newVal)) {
        fbSet('montos/curso', newVal);
    }
}`);

code = code.replace(
`function saveMontoMensual() {
    const newVal = parseInt(document.getElementById('monto-mensual-input').value);
    if (!isNaN(newVal)) {
        state.montos.mensual = newVal;
        saveState();
    }
}`,
`function saveMontoMensual() {
    const newVal = parseInt(document.getElementById('monto-mensual-input').value);
    if (!isNaN(newVal)) {
        fbSet('montos/mensual', newVal);
    }
}`);


code = code.replace(
`    const s = state.students.find(x => x.id === id);
    if (s) {
        s[type] = checkbox.checked;
        saveState();
    }`,
`    const s = state.students.find(x => x.id === id);
    if (s) {
        s[type] = checkbox.checked;
        const sIdx = state.students.findIndex(x => x.id === id);
        if (sIdx !== -1) fbSet('students/' + sIdx, s);
    }`);

// FINAL REFACTORING PASS (The leftovers)

code = code.replace(
`window.addStudent = () => {
    const input = document.getElementById('new-student-name');
    const name = input.value.trim();
    if (!name) return;
    const newId = Date.now();
    state.students.push({ id: newId, name, paidCentro: false, paidMonthly: false, proofCentro: null, proofMonthly: null });
    saveState();
    input.value = '';
    document.getElementById('add-student-form').style.display = 'none';
};`,
`window.addStudent = () => {
    const input = document.getElementById('new-student-name');
    const name = input.value.trim();
    if (!name) return;
    const newId = Date.now();
    const newItem = { id: newId, name, paidCentro: false, paidMonthly: false, proofCentro: null, proofMonthly: null };
    fbSet('students/' + state.students.length, newItem);
    input.value = '';
    document.getElementById('add-student-form').style.display = 'none';
};`);

code = code.replace(
`window.removeStudent = (id) => {
    if (!confirm('¿Eliminar este alumno de la lista?')) return;
    state.students = state.students.filter(s => s.id !== id);
    if (state.monthlyHistory) delete state.monthlyHistory[id];
    saveState();
};`,
`window.removeStudent = (id) => {
    if (!confirm('¿Eliminar este alumno de la lista?')) return;
    const sIdx = state.students.findIndex(s => s.id === id);
    if (sIdx !== -1) {
        fbRemove('students/' + sIdx);
        if (state.monthlyHistory) fbRemove('monthlyHistory/' + id);
    }
};`);

code = code.replace(
`window.toggleMonthlyPayment = (studentId, mes) => {
    if (!state.monthlyHistory) state.monthlyHistory = {};
    if (!state.monthlyHistory[studentId]) state.monthlyHistory[studentId] = {};
    state.monthlyHistory[studentId][mes] = !state.monthlyHistory[studentId][mes];
    saveState();
};`,
`window.toggleMonthlyPayment = (studentId, mes) => {
    if (!state.monthlyHistory) state.monthlyHistory = {};
    if (!state.monthlyHistory[studentId]) state.monthlyHistory[studentId] = {};
    const current = !!state.monthlyHistory[studentId][mes];
    fbSet('monthlyHistory/' + studentId + '/' + mes, !current);
};`);

code = code.replace(
`window.toggleCursoPayment = (studentId, mes) => {
    if (!state.cursoHistory) state.cursoHistory = {};
    if (!state.cursoHistory[studentId]) state.cursoHistory[studentId] = {};
    state.cursoHistory[studentId][mes] = !state.cursoHistory[studentId][mes];
    saveState();
};`,
`window.toggleCursoPayment = (studentId, mes) => {
    if (!state.cursoHistory) state.cursoHistory = {};
    if (!state.cursoHistory[studentId]) state.cursoHistory[studentId] = {};
    const current = !!state.cursoHistory[studentId][mes];
    fbSet('cursoHistory/' + studentId + '/' + mes, !current);
};`);

code = code.replace(
`window.deleteDonation = (id) => {
    if (confirm("¿Borrar esta donación?")) {
        state.donations = state.donations.filter(d => d.id !== id);
        saveState();
    }
};`,
`window.deleteDonation = (id) => {
    if (confirm("¿Borrar esta donación?")) {
        const item = state.donations.find(d => d.id === id);
        if (item) fbRemove('donations/' + item.id);
    }
};`);


code = code.replace(/state\.reviews\.push\(\{\s*(.*?)\s*\}\);\s*saveState\(\);/g, (match, p1) => {
    return "const newItem = { " + p1 + " }; fbSet('reviews/' + newItem.id, newItem);";
});
code = code.replace(/state\.users\.push\(\{\s*(.*?)\s*\}\);\s*saveState\(\);/g, (match, p1) => {
    return "const newItem = { " + p1 + " }; fbSet('users/' + newItem.id, newItem);";
});

code = code.replace(
`    const newTransaction = { id: Date.now(), desc, amount, type, date: new Date().toLocaleDateString() };
    state.paymentHistory.push(newTransaction);
    state.balance += (type === 'income' ? amount : -amount);
    saveState();`,
`    const newTransaction = { id: Date.now(), desc, amount, type, date: new Date().toLocaleDateString() };
    fbSet('paymentHistory/' + newTransaction.id, newTransaction);
    fbSet('balance', state.balance + (type === 'income' ? amount : -amount));`);


fs.writeFileSync('app.js', code, 'utf8');
console.log('Master replace done.');
