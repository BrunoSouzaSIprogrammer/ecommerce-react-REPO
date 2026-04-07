const admin = require("../config/firebase");
const jwt = require("jsonwebtoken");

// ================= CONSTANTES =================
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "brunocardoso0004@hotmail.com").toLowerCase();

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const NOME_MIN_LENGTH = 2;
const NOME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;
const TOKEN_MAX_LENGTH = 4096;
const CARACTERES_ESPECIAIS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;

// ================= SEGURANÇA =================
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET não está definido. Defina a variável de ambiente JWT_SECRET antes de iniciar o servidor."
  );
}

// Headers de segurança para respostas sensíveis
function aplicarHeadersSeguranca(res) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
}

// Controle de tentativas de login por IP (Rate Limiting)
const TENTATIVAS_MAX = 5;
const BLOQUEIO_MIN = 15;
const tentativas = new Map();

function incrementarTentativas(ip) {
  const agora = Date.now();
  const atual = tentativas.get(ip) || { count: 0, lastReset: agora };

  if (agora - atual.lastReset > BLOQUEIO_MIN * 60 * 1000) {
    tentativas.set(ip, { count: 1, lastReset: agora });
    return 1;
  }

  atual.count++;
  tentativas.set(ip, atual);
  return atual.count;
}

function estaBloqueado(ip) {
  const atual = tentativas.get(ip);
  if (!atual) return false;

  if (Date.now() - atual.lastReset > BLOQUEIO_MIN * 60 * 1000) {
    tentativas.delete(ip);
    return false;
  }

  return atual.count >= TENTATIVAS_MAX;
}

function limparTentativas(ip) {
  tentativas.delete(ip);
}

// Limpeza periódica de entradas expiradas
setInterval(() => {
  const agora = Date.now();
  for (const [ip, data] of tentativas.entries()) {
    if (agora - data.lastReset > BLOQUEIO_MIN * 60 * 1000) {
      tentativas.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// ================= VALIDAÇÕES =================
function validarEmail(email) {
  if (!email || typeof email !== "string" || email.length > EMAIL_MAX_LENGTH) {
    return "Email inválido";
  }
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    return "Formato de email inválido";
  }
  return null;
}

function validarSenha(senha) {
  if (!senha || typeof senha !== "string") {
    return "Senha é obrigatória";
  }
  if (senha.length < PASSWORD_MIN_LENGTH) {
    return `Senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres`;
  }
  if (senha.length > PASSWORD_MAX_LENGTH) {
    return `Senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres`;
  }

  const ultimoChar = senha[senha.length - 1];
  if (!CARACTERES_ESPECIAIS.test(ultimoChar)) {
    return "Senha deve terminar com um caractere especial (ex: !@#$%^&*)";
  }

  return null;
}

function validarNome(nome) {
  if (!nome) {
    return "Nome é obrigatório";
  }
  if (typeof nome !== "string") {
    return "Nome deve ser um texto";
  }
  const trimmed = nome.trim();
  if (trimmed.length < NOME_MIN_LENGTH) {
    return `Nome deve ter no mínimo ${NOME_MIN_LENGTH} caracteres`;
  }
  if (trimmed.length > NOME_MAX_LENGTH) {
    return `Nome deve ter no máximo ${NOME_MAX_LENGTH} caracteres`;
  }
  return null;
}

// ================= HELPERS =================
function buscarDadosUsuario(uid) {
  return admin
    .firestore()
    .collection("users")
    .doc(uid)
    .get();
}

function formatarErroFirebase(error) {
  const mensagens = {
    "auth/user-not-found": "Email ou senha inválidos",
    "auth/wrong-password": "Email ou senha inválidos",
    "auth/invalid-email": "Email inválido",
    "auth/email-already-exists": "Email já cadastrado",
    "auth/weak-password": "Senha muito fraca",
    "auth/invalid-id-token": "Token inválido",
    "auth/id-token-expired": "Token expirado",
    "auth/invalid-credential": "Email ou senha inválidos"
  };

  const codigo = error.code || "";
  return {
    status: mensagens[codigo] ? 400 : 500,
    mensagem: mensagens[codigo] || "Erro interno do servidor"
  };
}

function assinarJWT(user) {
  return jwt.sign(
    { uid: user.uid, email: user.email, role: user.role },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      algorithm: "HS256"
    }
  );
}

// ================= LOGIN =================
exports.login = async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || "unknown";

  // Verifica bloqueio por tentativas
  if (estaBloqueado(ip)) {
    return res.status(429).json({
      error: `Tentativas de login excedidas. Aguarde ${BLOQUEIO_MIN} minutos.`
    });
  }

  const { firebaseToken } = req.body;

  if (!firebaseToken || typeof firebaseToken !== "string") {
    return res.status(400).json({ error: "Token Firebase é obrigatório" });
  }

  if (firebaseToken.length > TOKEN_MAX_LENGTH) {
    return res.status(400).json({ error: "Token muito grande" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(firebaseToken);

    const doc = await buscarDadosUsuario(decoded.uid);

    if (!doc.exists) {
      incrementarTentativas(ip);
      return res.status(404).json({
        error: "Usuário não encontrado no sistema"
      });
    }

    const userData = doc.data();

    if (userData.ativo === false) {
      return res.status(403).json({
        error: "Usuário desativado"
      });
    }

    // Login com sucesso — limpa tentativas
    limparTentativas(ip);

    const token = assinarJWT({
      uid: decoded.uid,
      email: decoded.email,
      role: userData.role
    });

    // Headers de segurança
    aplicarHeadersSeguranca(res);

    return res.json({
      uid: decoded.uid,
      email: decoded.email,
      role: userData.role,
      nome: userData.nome,
      token
    });

  } catch (error) {
    incrementarTentativas(ip);

    const { status, mensagem } = formatarErroFirebase(error);
    return res.status(status).json({ error: mensagem });
  }
};

// ================= CADASTRO =================
exports.cadastrar = async (req, res) => {
  const { email, senha, nome } = req.body;

  if (!email || !senha || !nome) {
    return res.status(400).json({
      error: "Todos os campos são obrigatórios"
    });
  }

  const emailNormalizado = String(email).toLowerCase().trim();

  const erroEmail = validarEmail(emailNormalizado);
  if (erroEmail) {
    return res.status(400).json({ error: erroEmail });
  }

  const erroSenha = validarSenha(senha);
  if (erroSenha) {
    return res.status(400).json({ error: erroSenha });
  }

  const erroNome = validarNome(nome);
  if (erroNome) {
    return res.status(400).json({ error: erroNome });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: emailNormalizado,
      password: senha,
      displayName: nome.trim()
    });

    const userData = {
      nome: nome.trim(),
      email: emailNormalizado,
      role: emailNormalizado === ADMIN_EMAIL ? "admin" : "user",
      ativo: true,
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
    };

    await admin
      .firestore()
      .collection("users")
      .doc(userRecord.uid)
      .set(userData);

    return res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      nome: userRecord.displayName,
      role: userData.role
    });

  } catch (error) {
    const { status, mensagem } = formatarErroFirebase(error);
    return res.status(status).json({ error: mensagem });
  }
};
