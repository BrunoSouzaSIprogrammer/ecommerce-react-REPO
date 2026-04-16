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

const app = express();

app.use(cors());
app.use(express.json());

// Rotas públicas
app.use("/", authRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/produtos", produtosRoutes);
app.use("/frete", freteRoutes);

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
