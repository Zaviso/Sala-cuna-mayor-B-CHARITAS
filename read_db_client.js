const firebase = require('firebase/app');
require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyDLWLZ4BHGBG-mFWW83ctM5ALWUVfWMW",
  authDomain: "jardin-charitas.firebaseapp.com",
  projectId: "jardin-charitas",
  databaseURL: "https://jardin-charitas-default-rtdb.firebaseio.com",
  storageBucket: "jardin-charitas.firebasestorage.app",
  messagingSenderId: "422091278966",
  appId: "1:422091278966:web:5ef29fb7be913f0129b004"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

db.ref('/').once('value').then(snapshot => {
    console.log(JSON.stringify(snapshot.val(), null, 2));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
