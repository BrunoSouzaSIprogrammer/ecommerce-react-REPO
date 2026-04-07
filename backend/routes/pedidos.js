const express = require("express");
const router = express.Router();
const pedidosController = require("../controllers/pedidosController");
const { autenticar } = require("../middlewares/auth");

router.get("/", autenticar, pedidosController.listarPedidos);
router.post("/", autenticar, pedidosController.criarPedido);

module.exports = router;
