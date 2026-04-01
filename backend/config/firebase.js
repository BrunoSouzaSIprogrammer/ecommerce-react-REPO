const admin = require("firebase-admin");
const serviceAccount = require("./mazza-store-firebase-adminsdk-fbsvc-a631553ef7.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// ✅ EXPORTA O ADMIN COMPLETO
module.exports = admin;