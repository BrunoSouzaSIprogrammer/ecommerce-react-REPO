const admin = require("firebase-admin");
const serviceAccount = require("./mazza-store-firebase-adminsdk-fbsvc-a631553ef7.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Exporta a instância do Firestore — suporta três padrões usados no codebase:
//   db.collection(...)               ← chamada direta (padrão majoritário)
//   db.firestore().collection(...)   ← compat com chamadas que usam .firestore()
//   db.firestore.FieldValue.xxx      ← acesso ao namespace estático (FieldValue, Timestamp, etc.)
const db = admin.firestore();

// admin.firestore é uma função callable que também expõe namespaces estáticos
// (FieldValue, Timestamp, GeoPoint, etc.). Anexamos ao db para manter
// compat com `db.firestore` (acesso) e `db.firestore()` (chamada).
db.firestore = admin.firestore;

// Acesso ao admin bruto para quem precisar (messaging, auth, etc.).
db.admin = admin;

module.exports = db;
