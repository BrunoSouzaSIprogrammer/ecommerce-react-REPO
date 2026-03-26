import { useEffect, useState } from "react";

export default function Financeiro() {
  const [dados, setDados] = useState({});

  useEffect(() => {
    fetch("http://localhost:5000/financeiro")
      .then(res => res.json())
      .then(setDados);
  }, []);

  return (
    <div>
      <h2>Financeiro</h2>
      <p>💰 Total: R$ {dados.totalVendas}</p>
      <p>📈 Lucro: R$ {dados.lucro}</p>
      <p>🤝 Comissão: R$ {dados.comissao}</p>
    </div>
  );
}