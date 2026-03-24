import { useState, useEffect } from "react";

export default function Admin() {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [imagem, setImagem] = useState(null);
  const [categorias, setCategorias] = useState([]);

  // carregar categorias
  useEffect(() => {
    fetch("http://localhost:5000/categorias")
      .then(res => res.json())
      .then(data => setCategorias(data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("preco", preco);
    formData.append("categoriaId", categoriaId);
    formData.append("imagem", imagem);

    await fetch("http://localhost:5000/produtos", {
      method: "POST",
      body: formData
    });

    alert("Produto criado!");
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Cadastro de Produto</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
        <input placeholder="Nome" onChange={e => setNome(e.target.value)} />
        <input placeholder="Preço" onChange={e => setPreco(e.target.value)} />

        <select onChange={e => setCategoriaId(e.target.value)}>
          <option>Selecione categoria</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.nome}
            </option>
          ))}
        </select>

        <input type="file" onChange={e => setImagem(e.target.files[0])} />

        <button type="submit">Criar Produto</button>
      </form>
    </div>
  );
}