const express = require("express");
const router = express.Router();
const { autenticar, isAdmin } = require("../middlewares/auth");

const controller = require("../controllers/categoriasController");

// Público — listagem
router.get("/", controller.listarCategorias);

// Admin only — criação
router.post("/", autenticar, isAdmin, controller.criarCategoria);

module.exports = router;
