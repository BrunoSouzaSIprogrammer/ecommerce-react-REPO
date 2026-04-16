const express = require("express");
const router = express.Router();
const { autenticar, isAdmin } = require("../middlewares/auth");
const controller = require("../controllers/oauthMpController");

// `start` e `callback` são públicos (o callback vem do MP sem nosso JWT).
// O status é ADMIN only.
router.get("/start", controller.start);
router.get("/callback", controller.callback);
router.get("/status", autenticar, isAdmin, controller.status);

module.exports = router;
