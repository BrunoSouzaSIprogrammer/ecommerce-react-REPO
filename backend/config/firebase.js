const admin = require("firebase-admin");

// Em produção (Render/Vercel/etc.) carregamos as credenciais de variáveis
// de ambiente. Em desenvolvimento local, fallback para o JSON em config/.
//
// Aceita duas formas em produção:
//   A) FIREBASE_SERVICE_ACCOUNT_JSON  → JSON inteiro do service-account.
//   B) FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
//      → três campos separados (mais comum em painéis de host).
//
// IMPORTANTE: ao colar a private_key em uma env var, mantenha as quebras
// de linha como `\n` literais. Este arquivo converte para `\n` real.
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      // Alguns hosts (Render) convertem \n em quebras reais dentro da env var,
      // o que quebra o JSON. Revertemos antes do parse.
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.replace(
        /\n/g,
        "\\n",
      );
      return JSON.parse(raw);
    } catch (err) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON inválido (não é JSON): " + err.message,
      );
    }
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  // Fallback dev local — JSON commitado fora do repo (ignored).
  try {
    return require("./mazza-store-firebase-adminsdk-fbsvc-a631553ef7.json");
  } catch {
    throw new Error(
      "Credenciais Firebase não encontradas. Defina FIREBASE_SERVICE_ACCOUNT_JSON " +
        "ou FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY, " +
        "ou coloque o JSON em backend/config/.",
    );
  }
}

const serviceAccount = loadServiceAccount();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
db.firestore = admin.firestore;
db.admin = admin;

module.exports = db;
