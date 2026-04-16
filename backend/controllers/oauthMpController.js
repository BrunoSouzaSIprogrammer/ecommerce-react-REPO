const db = require("../config/firebase");

// ==========================================
// OAuth Mercado Pago — conecta a conta SELLER (MAZZA)
// à conta MARKETPLACE (BRUNO) para que o split funcione
// em PRODUÇÃO. Em modo TESTE isso não é obrigatório.
//
// Fluxo:
//   1. ADMIN abre GET /admin/mp-oauth/start.
//   2. Redirecionamos pra auth.mercadopago.com.br com
//      client_id da aplicação BRUNO.
//   3. Usuário loga na MAZZA e autoriza.
//   4. MP retorna em /admin/mp-oauth/callback?code=...
//   5. Trocamos o code por access token da MAZZA e
//      guardamos em Firestore (config_mp/mazza_oauth).
// ==========================================

const MP_AUTH_URL = "https://auth.mercadopago.com.br/authorization";
const MP_TOKEN_URL = "https://api.mercadopago.com/oauth/token";

function bruno() {
  const mode = (process.env.MP_MODE || "test").toLowerCase();
  return {
    clientId: process.env.MP_BRUNO_USER_ID,
    accessToken:
      mode === "production"
        ? process.env.MP_BRUNO_ACCESS_TOKEN
        : process.env.MP_BRUNO_ACCESS_TOKEN_TEST,
  };
}

function redirectUri() {
  // O redirect precisa bater exatamente com o registrado no
  // painel do aplicativo MP do dono do marketplace (BRUNO).
  const base = process.env.MP_OAUTH_REDIRECT_BASE ||
    "http://localhost:5000";
  return `${base}/admin/mp-oauth/callback`;
}

// GET /admin/mp-oauth/start
exports.start = (req, res) => {
  const { clientId } = bruno();
  if (!clientId) {
    return res
      .status(400)
      .send(
        "MP_BRUNO_USER_ID não configurado. Preencha no .env antes de iniciar o OAuth."
      );
  }
  const url = new URL(MP_AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("redirect_uri", redirectUri());
  // Em produção, usar state anti-CSRF — aqui MVP.
  url.searchParams.set("state", "mazza-oauth");
  res.redirect(url.toString());
};

// GET /admin/mp-oauth/callback?code=...
exports.callback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("Código OAuth ausente.");

    const { clientId, accessToken } = bruno();
    if (!accessToken) {
      return res
        .status(400)
        .send("Access token do marketplace (BRUNO) não configurado.");
    }

    const body = new URLSearchParams({
      client_secret: accessToken,
      client_id: String(clientId || ""),
      grant_type: "authorization_code",
      code: String(code),
      redirect_uri: redirectUri(),
    });

    const resp = await fetch(MP_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const text = await resp.text();
    if (!resp.ok) {
      console.error("OAuth MP erro:", resp.status, text);
      return res.status(502).send(`Falha ao trocar code: ${text.slice(0, 300)}`);
    }

    const data = JSON.parse(text);
    await db.collection("config_mp").doc("mazza_oauth").set({
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresIn: data.expires_in || null,
      scope: data.scope || null,
      userId: data.user_id || null,
      liveMode: data.live_mode || null,
      conectadoEm: new Date().toISOString(),
    });

    const front = process.env.MP_FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${front}/admin?mp=conectado`);
  } catch (error) {
    console.error("Erro no callback OAuth MP:", error);
    res.status(500).send("Erro ao concluir OAuth.");
  }
};

// GET /admin/mp-oauth/status  — ADMIN only
exports.status = async (req, res) => {
  try {
    const doc = await db.collection("config_mp").doc("mazza_oauth").get();
    if (!doc.exists) return res.json({ conectado: false });
    const data = doc.data();
    res.json({
      conectado: true,
      userId: data.userId || null,
      conectadoEm: data.conectadoEm || null,
      liveMode: data.liveMode || null,
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao consultar status OAuth" });
  }
};
