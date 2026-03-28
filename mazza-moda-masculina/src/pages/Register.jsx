import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const navigate = useNavigate();

  async function cadastrar() {
    const res = await fetch("http://localhost:5000/cadastrar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, senha, nome })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    alert("Usuário criado com sucesso!");
    navigate("/login");
  }

  return (
    <div>
      <h2>Cadastro</h2>

      <input placeholder="Nome" onChange={(e) => setNome(e.target.value)} />
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Senha" onChange={(e) => setSenha(e.target.value)} />

      <button onClick={cadastrar}>Cadastrar</button>
    </div>
  );
}