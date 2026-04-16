require("dotenv").config({ path: ".env" });
const express = require("express");
const cors = require("cors");

const pedidosRoutes = require("./routes/pedidos");
const authRoutes = require("./routes/auth");
const categoriasRoutes = require("./routes/categorias");
const produtosRoutes = require("./routes/produtos");
const financeiroRoutes = require("./routes/financeiro");
const freteRoutes = require("./routes/frete");
const pagamentosRoutes = require("./routes/pagamentos");
const webhooksRoutes = require("./routes/webhooks");
const oauthMpRoutes = require("./routes/oauthMp");
const favoritosRoutes = require("./routes/favoritos");
const cuponsRoutes = require("./routes/cupons");
const bannersRoutes = require("./routes/banners");

const app = express();

// CORS — em prod libera apenas origens listadas em FRONTEND_ORIGINS
// (separadas por vírgula). Em dev libera geral.
const origensPermitidas = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl, Postman, server-to-server
      if (origensPermitidas.length === 0) return cb(null, true); // dev
      if (origensPermitidas.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS bloqueado para origem: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json());

// Rotas públicas
app.use("/", authRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/produtos", produtosRoutes);
app.use("/frete", freteRoutes);
app.use("/banners", bannersRoutes);

// Webhooks (públicos — chamados por serviços externos)
app.use("/webhooks", webhooksRoutes);

// Rotas autenticadas
app.use("/pedidos", pedidosRoutes);
app.use("/pagamentos", pagamentosRoutes);
app.use("/financeiro", financeiroRoutes);
app.use("/favoritos", favoritosRoutes);
app.use("/cupons", cuponsRoutes);

// Admin — OAuth Mercado Pago
app.use("/admin/mp-oauth", oauthMpRoutes);

// Static uploads
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando em http://localhost:${PORT}`);
});
