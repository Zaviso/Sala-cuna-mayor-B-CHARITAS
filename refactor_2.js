const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Fix on('value') listener to properly handle deletions
code = code.replace(
`    if (data) {
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
            : (state.deletedUsernames ? Object.values(state.deletedUsernames).filter(u => u != null) : []);`,
`    if (data) {
        // Merge data, but arrays MUST be taken exclusively from data so deletions of all items work
        const nonArrayData = { ...data };
        const arrayKeys = ['users', 'students', 'expenses', 'requests', 'events', 'gallery', 'announcements', 'donations', 'participations', 'relevantInfo', 'deletedUsernames', 'reviews'];
        arrayKeys.forEach(key => delete nonArrayData[key]);
        
        state = { ...state, ...nonArrayData };

        // Parse arrays safely from 'data' to ensure deleted items are reflected
        arrayKeys.forEach(key => {
            state[key] = data[key] ? Object.values(data[key]).filter(u => u != null) : [];
        });`);

fs.writeFileSync('app.js', code, 'utf8');
console.log('Fixed on value listener');
