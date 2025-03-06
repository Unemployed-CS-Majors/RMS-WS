// server.js

const firebaseAdmin = require('firebase-admin');
const WebSocket = require('ws');

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account.json'); // Your Firebase service account key
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: 'https://your-project-id.firebaseio.com' // Replace with your Firebase project's URL
});

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

// This will automatically handle the WebSocket upgrade process and expect the correct headers
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    ws.on('message', (message) => {
        console.log('received: %s', message);
    });
});

// Firestore Reference
const db = firebaseAdmin.firestore();

// Listen for changes in the 'reservations' collection
db.collection('reservations').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
        // Only send updates if the status is 'pending'
        if (change.type === 'added' || change.type === 'modified' || change.type === 'removed') {
            const reservationData = change.doc.data();
            if (reservationData.status === 'pending') {
                console.log('Change detected: ', change);
                sendNotificationToClients(change);
            }
        }
    });
});

// Function to send message via WebSocket
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
