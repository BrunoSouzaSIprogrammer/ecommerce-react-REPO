require("dotenv").config({ path: ".env" });
const express = require("express");
const cors = require("cors");

const pedidosRoutes = require("./routes/pedidos");
const authRoutes = require("./routes/auth");
const categoriasRoutes = require("./routes/categorias");
const produtosRoutes = require("./routes/produtos");
const financeiroRoutes = require("./routes/financeiro");

const app = express();

app.use(cors());
app.use(express.json());

// Rotas públicas
app.use("/", authRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/produtos", produtosRoutes);

// Rotas protegidas
app.use("/pedidos", pedidosRoutes);
app.use("/financeiro", financeiroRoutes);

// Static uploads
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando em http://localhost:${PORT}`);
});
