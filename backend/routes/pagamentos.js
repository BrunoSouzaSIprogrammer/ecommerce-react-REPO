const express = require("express");
const router = express.Router();
const { autenticar } = require("../middlewares/auth");
const controller = require("../controllers/pagamentosController");

// Autenticado — cliente precisa estar logado para gerar pagamento.
router.post("/preferencia", autenticar, controller.criarPreferencia);

module.exports = router;
