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

// The getUser function that retrieves user details based on userId
async function getUser(userId) {
    const userRef = db.collection("users").doc(userId);
    const user = await userRef.get();
    if (!user.exists) {
        return null;
    }
    console.log('User data:', user);
    console.log('User data:', user.data());

    return user.data();
}

db.collection('reservations').onSnapshot(async (snapshot) => {
    for (const change of snapshot.docChanges()) {
        if (change.type === 'added' || change.type === 'modified' || change.type === 'removed') {
            const reservationData = change.doc.data();

            if (reservationData.status === 'pending') {
                try {
                    // Fetch user details for the reservation based on userId
                    const user = await getUser(reservationData.userId);

                    if (user) {
                        // Add user details to reservation
                        reservationData.fullName = `${user.firstName} ${user.lastName}`;
                        reservationData.email = user.email;
                        reservationData.phoneNumber = user.phoneNumber;
                    }
                    reservationData.id = change.doc.id;
                    console.log('Reservation data:', reservationData);
                    // Send notification to all WebSocket clients
                    sendNotificationToClients(reservationData);
                } catch (error) {
                    console.error('Error fetching user details: ', error);
                }
            }
        }
    }
});

function sendNotificationToClients(change) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                data: change,
            }));
        }
    });
}

console.log('Firebase Admin application listening for changes and WebSocket connections on port 8080');
