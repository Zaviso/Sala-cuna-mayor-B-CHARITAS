const firebase = require('firebase-admin');
firebase.initializeApp({
  databaseURL: "https://jardin-charitas-default-rtdb.firebaseio.com"
});
const db = firebase.database();
db.ref('/').once('value', (snapshot) => {
    console.log(JSON.stringify(snapshot.val(), null, 2));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
