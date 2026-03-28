import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { getProdutos } from "../services/api";
import Hero from "../components/Hero";

export default function Home() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    async function fetchData() {
      const data = await getProdutos();
      setProdutos(Array.isArray(data) ? data : []);
    }
    fetchData();
  }, []);

  const produtosFiltrados = (produtos || []).filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <Navbar />
      <Hero />

      <div className="container">
        <input
          placeholder="Buscar..."
          onChange={(e) => setBusca(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "20px"
          }}
        />

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "20px"
        }}>
          {produtosFiltrados.map(produto => (
            <ProductCard key={produto.id} produto={produto} />
          ))}
        </div>
      </div>
    </div>
  );
  
}