const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

code = code.replace(
/state\.announcements\.unshift\(\{ id: Date\.now\(\), text, type, date: new Date\(\)\.toLocaleDateString\(\) \}\);\n\s*saveState\(\);/gs,
`const newItem = { id: Date.now(), text, type, date: new Date().toLocaleDateString() };
    fbSet('announcements/' + newItem.id, newItem);`);

code = code.replace(
/state\.announcements\.splice\(index, 1\);\n\s*saveState\(\);/gs,
`const item = state.announcements[index];
        if (item) fbRemove('announcements/' + item.id);`);

code = code.replace(
/part\.status = newStatus;\n\s*saveState\(\);/gs,
`part.status = newStatus;
        fbSet('participations/' + part.id, part);`);

code = code.replace(
/state\.participations = state\.participations\.filter\(p => p\.id !== id\);\n\s*saveState\(\);/gs,
`const item = state.participations.find(p => p.id === id);
        if (item) fbRemove('participations/' + item.id);`);

code = code.replace(
/state\.relevantInfo = state\.relevantInfo\.filter\(i => i\.id !== id\);\n\s*saveState\(\);/gs,
`const item = state.relevantInfo.find(i => i.id === id);
        if (item) fbRemove('relevantInfo/' + item.id);`);

code = code.replace(
/state\.gallery\.push\(newFolder\);\n\s*saveState\(\);/gs,
`fbSet('gallery/' + newFolder.id, newFolder);`);

code = code.replace(
/state\.gallery\[folderIndex\]\.photos\.splice\(photoIndex, 1\);\n\s*saveState\(\);/gs,
`fbSet('gallery/' + state.gallery[folderIndex].id + '/photos', state.gallery[folderIndex].photos);`);

code = code.replace(
/state\.gallery\.splice\(folderIndex, 1\);\n\s*saveState\(\);/gs,
`const folderId = state.gallery[folderIndex].id;
        fbRemove('gallery/' + folderId);`);

code = code.replace(
/folder\.name = newName\.trim\(\);\n\s*saveState\(\);/gs,
`folder.name = newName.trim();
        fbSet('gallery/' + folder.id + '/name', folder.name);`);

code = code.replace(
/state\.reviews\.splice\(index, 1\);\n\s*saveState\(\);/gs,
`const item = state.reviews[index];
        if (item) fbRemove('reviews/' + item.id);`);

code = code.replace(
/state\.users\.splice\(index, 1\);\n\s*saveState\(\);/gs,
`const item = state.users[index];
        if (item) fbRemove('users/' + item.id);`);

// Line 1850 logic:
code = code.replace(
`        state.users.push(newUser);
        console.log("Usuario añadido, guardando estado...");
        saveState();`,
`        fbSet('users/' + newUser.id, newUser);
        console.log("Usuario añadido, guardando estado...");`);

// Fix addEvent (push ... saveState)
code = code.replace(
`        state.events.push({
            id: Date.now(),
            title,
            desc,
            date,
            location,
            createdAt: new Date().toLocaleDateString('es-CL')
        });
        saveState();`,
`        const newItem = {
            id: Date.now(),
            title,
            desc,
            date,
            location,
            createdAt: new Date().toLocaleDateString('es-CL')
        };
        fbSet('events/' + newItem.id, newItem);`);

// addDonation
code = code.replace(
`        state.donations.push({
            id: Date.now(),
            type,
            desc,
            date: new Date().toLocaleDateString('es-CL')
        });
        saveState();`,
`        const newItem = {
            id: Date.now(),
            type,
            desc,
            date: new Date().toLocaleDateString('es-CL')
        };
        fbSet('donations/' + newItem.id, newItem);`);

// update req status
code = code.replace(
`    const req = state.requests.find(r => r.id === id);
    if (req) {
        req.status = newStatus;
        saveState();
    }`,
`    const req = state.requests.find(r => r.id === id);
    if (req) {
        req.status = newStatus;
        fbSet('requests/' + id, req);
    }`);


// update request response (Line 895)
code = code.replace(
/req\.response = responseText;\n\s*\}\n\s*saveState\(\);/gs,
`req.response = responseText;
        fbSet('requests/' + req.id + '/response', responseText);
    }`);

// Line 165
code = code.replace(
`        state.votes.push({
            id: Date.now(),
            text: newIdea,
            date: new Date().toLocaleDateString()
        });
    } else {
        saveState();
    }`,
`        const newItem = {
            id: Date.now(),
            text: newIdea,
            date: new Date().toLocaleDateString()
        };
        fbSet('votes/' + newItem.id, newItem);
    } else {
        // no saveState needed because votes isn't modified here
    }`);

// Line 1801
code = code.replace(
`                    studentId: Math.floor(Math.random() * 1000)
                };
                saveState();`,
`                    studentId: Math.floor(Math.random() * 1000)
                };
                fbSet('users/' + id + '/temp_migration', true);`);

// Line 1589
code = code.replace(
`    state.supportRequests = state.supportRequests || [];
    state.supportRequests.push({
        id: Date.now(),
        name,
        contact,
        msg,
        date: new Date().toLocaleDateString()
    });

    saveState();`,
`    state.supportRequests = state.supportRequests || [];
    const newItem = {
        id: Date.now(),
        name,
        contact,
        msg,
        date: new Date().toLocaleDateString()
    };
    fbSet('supportRequests/' + newItem.id, newItem);`);

// Remove the implementation of saveState (116)
code = code.replace(
`function saveState() {
    db.ref('jardin_state').update(state).then(() => {
        console.log("Datos sincronizados");
    }).catch(err => console.error("Error al sincronizar:", err));
}`,
`// saveState deprecated, replaced by fbSet/fbRemove`);

fs.writeFileSync('app.js', code, 'utf8');
console.log('Final pass done.');
