const jwt = require("jsonwebtoken");

const { JWT_SECRET } = process.env;

// Middleware: extrai e verifica o JWT do header
// Authorization: Bearer <token>
exports.autenticar = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      error: "Formato de token inválido. Use: Bearer <token>"
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
};

// Middleware: verifica se o usuário autenticado é admin
// DEVE vir após autenticar() — depende de req.user
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Autenticação necessária" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Acesso negado: somente administradores"
    });
  }

  next();
};
