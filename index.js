// server.js

const firebaseAdmin = require('firebase-admin');
const WebSocket = require('ws');

const serviceAccount = require('./service-account.json'); // Your Firebase service account key
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: 'https://your-project-id.firebaseio.com' // Replace with your Firebase project's URL
});

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    ws.on('message', (message) => {
        console.log('received: %s', message);
    });
});

const db = firebaseAdmin.firestore();

db.collection('reservations').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
        if (change.type === 'added' || change.type === 'modified' || change.type === 'removed') {
            const reservationData = change.doc.data();
            if (reservationData.status === 'pending') {
                console.log('Change detected: ', change);
                sendNotificationToClients(change);
            }
        }
    });
});

function sendNotificationToClients(change) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: change.type,
                data: change.doc.data(),
            }));
        }
    });
}

console.log('Firebase Admin application listening for changes and WebSocket connections on port 8080');
