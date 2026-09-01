const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// addStudent
code = code.replace(/state\.students\.push\(\{ id: newId, name, paidCentro: false, paidMonthly: false, proofCentro: null, proofMonthly: null \}\);\s*saveState\(\);/gs, 
    "const newItem = { id: newId, name, paidCentro: false, paidMonthly: false, proofCentro: null, proofMonthly: null }; fbSet('students/' + state.students.length, newItem);");

// removeStudent
code = code.replace(/state\.students = state\.students\.filter\(s => s\.id !== id\);\s*if \(state\.monthlyHistory\) delete state\.monthlyHistory\[id\];\s*saveState\(\);/gs,
    "const sIdx = state.students.findIndex(s => s.id === id); if (sIdx !== -1) { fbRemove('students/' + sIdx); if (state.monthlyHistory) fbRemove('monthlyHistory/' + id); }");

// toggleMonthlyPayment
code = code.replace(/state\.monthlyHistory\[studentId\]\[mes\] = !state\.monthlyHistory\[studentId\]\[mes\];\s*saveState\(\);/gs,
    "const current = !!state.monthlyHistory[studentId][mes]; fbSet('monthlyHistory/' + studentId + '/' + mes, !current);");

// toggleCursoPayment
code = code.replace(/state\.cursoHistory\[studentId\]\[mes\] = !state\.cursoHistory\[studentId\]\[mes\];\s*saveState\(\);/gs,
    "const current = !!state.cursoHistory[studentId][mes]; fbSet('cursoHistory/' + studentId + '/' + mes, !current);");

// deleteDonation
code = code.replace(/state\.donations = state\.donations\.filter\(d => d\.id !== id\);\s*saveState\(\);/gs,
    "const item = state.donations.find(d => d.id === id); if (item) fbRemove('donations/' + item.id);");

// reviews
code = code.replace(/state\.reviews\.push\(\{\s*(.*?)\s*\}\);\s*saveState\(\);/gs, (match, p1) => {
    return "const newItem = { " + p1 + " }; fbSet('reviews/' + newItem.id, newItem);";
});

// users
code = code.replace(/state\.users\.push\(\{\s*(.*?)\s*\}\);\s*saveState\(\);/gs, (match, p1) => {
    return "const newItem = { " + p1 + " }; fbSet('users/' + newItem.id, newItem);";
});

// updateBalance
code = code.replace(/state\.paymentHistory\.push\(newTransaction\);\s*state\.balance \+= \(type === 'income' \? amount : -amount\);\s*saveState\(\);/gs,
    "fbSet('paymentHistory/' + newTransaction.id, newTransaction); fbSet('balance', state.balance + (type === 'income' ? amount : -amount));");

fs.writeFileSync('app.js', code, 'utf8');
console.log('Regex replacements done');
