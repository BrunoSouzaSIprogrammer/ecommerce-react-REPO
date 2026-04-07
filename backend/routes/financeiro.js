const express = require("express");
const router = express.Router();
const { autenticar, isAdmin } = require("../middlewares/auth");

const controller = require("../controllers/financeiroController");

// Admin only
router.get("/", autenticar, isAdmin, controller.resumo);

module.exports = router;
