const express = require("express");
const cors = require("cors");
const pedidosRoutes = require("./routes/pedidos");
const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/", authRoutes);

app.use("/pedidos", pedidosRoutes);

const categoriasRoutes = require("./routes/categorias");
const produtosRoutes = require("./routes/produtos");

app.use("/categorias", categoriasRoutes);
app.use("/produtos", produtosRoutes);
app.use("/uploads", express.static("uploads"));

app.listen(5000, () => {
  console.log("🔥 Servidor rodando em http://localhost:5000");
});