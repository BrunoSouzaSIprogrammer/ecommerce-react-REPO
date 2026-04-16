const express = require("express");
const router = express.Router();
const { autenticar, isAdmin } = require("../middlewares/auth");
const controller = require("../controllers/bannersController");

router.get("/", controller.listarBannersAtivos);
router.get("/admin", autenticar, isAdmin, controller.listarBanners);
router.post("/", autenticar, isAdmin, controller.criarBanner);
router.put("/:id", autenticar, isAdmin, controller.atualizarBanner);
router.delete("/:id", autenticar, isAdmin, controller.deletarBanner);

module.exports = router;
