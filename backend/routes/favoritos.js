const express = require("express");
const router = express.Router();
const { autenticar, isAdmin } = require("../middlewares/auth");
const controller = require("../controllers/favoritosController");

router.get("/", autenticar, controller.listar);
router.get("/ids", autenticar, controller.listarIds);
router.post("/:produtoId", autenticar, controller.adicionar);
router.delete("/:produtoId", autenticar, controller.remover);

// ADMIN — ranking
router.get("/admin/ranking", autenticar, isAdmin, controller.ranking);

module.exports = router;
