const express = require("express");
const router = express.Router();

const controller = require("../controllers/categoriasController");

router.get("/", controller.listarCategorias);
router.post("/", controller.criarCategoria);

module.exports = router;