const express = require("express");
const router = express.Router();
const { autenticar, isAdmin } = require("../middlewares/auth");

const controller = require("../controllers/categoriasController");

router.get("/", controller.listarCategorias);
router.get("/:id", controller.obterCategoria);

// Mantida por compatibilidade; retorna 400 (ver controller).
router.post("/", autenticar, isAdmin, controller.criarCategoria);

module.exports = router;
