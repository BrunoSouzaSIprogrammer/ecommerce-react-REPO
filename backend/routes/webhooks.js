const express = require("express");
const router = express.Router();
const controller = require("../controllers/webhooksController");

// Pública (sem auth) — Mercado Pago chama diretamente.
router.post("/mercadopago", controller.receber);

// MP às vezes faz um GET de verificação; responder 200.
router.get("/mercadopago", (_req, res) => res.sendStatus(200));

module.exports = router;
