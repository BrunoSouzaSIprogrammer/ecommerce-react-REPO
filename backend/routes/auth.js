const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { autenticar, isAdmin } = require("../middlewares/auth");

// Rotas públicas
router.post("/login", authController.login);
router.post("/cadastrar", authController.cadastrar);

// Rotas protegidas (apenas admin)
router.put("/senha", authController.atualizarSenha);
router.get("/usuarios", autenticar, isAdmin, authController.listarUsuarios);
router.put("/usuarios/:id/desativar", autenticar, isAdmin, authController.desativarUsuario);

module.exports = router;