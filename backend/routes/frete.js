const express = require("express");
const router = express.Router();
const controller = require("../controllers/freteController");

// Público — cliente pode calcular frete antes do login.
router.post("/calcular", controller.calcularFrete);

module.exports = router;
