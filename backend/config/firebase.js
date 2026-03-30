const admin = require("firebase-admin");
const serviceAccount = require("./mazza-store-firebase-adminsdk-fbsvc-a631553ef7.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = db;