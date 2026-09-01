const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

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

// And one more check for any remaining push()...saveState()
code = code.replace(/state\.reviews\.push\(\{\s*(.*?)\s*\}\);\s*saveState\(\);/gs, (match, p1) => {
    return "const newItem = { " + p1 + " }; fbSet('reviews/' + newItem.id, newItem);";
});
code = code.replace(/state\.users\.push\(\{\s*(.*?)\s*\}\);\s*saveState\(\);/gs, (match, p1) => {
    return "const newItem = { " + p1 + " }; fbSet('users/' + newItem.id, newItem);";
});

// Update balance
code = code.replace(
`    const newTransaction = { id: Date.now(), desc, amount, type, date: new Date().toLocaleDateString() };
    state.paymentHistory.push(newTransaction);
    state.balance += (type === 'income' ? amount : -amount);
    saveState();`,
`    const newTransaction = { id: Date.now(), desc, amount, type, date: new Date().toLocaleDateString() };
    fbSet('paymentHistory/' + newTransaction.id, newTransaction);
    fbSet('balance', state.balance + (type === 'income' ? amount : -amount));`);

fs.writeFileSync('app.js', code, 'utf8');
console.log('Fixed final leftovers');
