const express = require("express");
const router = express.Router();
const { autenticar, isAdmin } = require("../middlewares/auth");
const controller = require("../controllers/cuponsController");

// Cliente — validar cupom antes de finalizar compra.
router.post("/validar", autenticar, controller.validarEndpoint);

// ADMIN — CRUD completo.
router.get("/", autenticar, isAdmin, controller.listar);
router.post("/", autenticar, isAdmin, controller.criar);
router.put("/:codigo", autenticar, isAdmin, controller.atualizar);
router.delete("/:codigo", autenticar, isAdmin, controller.deletar);

module.exports = router;
