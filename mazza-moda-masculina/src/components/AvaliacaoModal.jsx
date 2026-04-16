import { useState } from "react";
import "../styles/avaliacao-modal.css";

export default function AvaliacaoModal({ open, onClose, onSubmit, pedidoId }) {
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  if (!open) return null;

  async function handleSubmit() {
    setErro(null);
    if (nota < 1 || nota > 5) {
      setErro("Selecione de 1 a 5 estrelas");
      return;
    }
    setEnviando(true);
    try {
      await onSubmit({ nota, comentario });
      // fechar só por fora (o pai decide após sucesso).
    } catch (err) {
      setErro(err.message || "Erro ao enviar avaliação");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="avaliacao-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !enviando) onClose();
      }}
    >
      <div className="avaliacao-modal">
        <button
          className="avaliacao-close"
          onClick={onClose}
          disabled={enviando}
          aria-label="Fechar"
        >
          ×
        </button>

        <h2>Como foi sua experiência?</h2>
        <p className="avaliacao-sub">
          Seu pedido foi entregue! Conte para a gente como foi.
        </p>

        <div className="avaliacao-stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`star ${n <= (hover || nota) ? "on" : ""}`}
              onClick={() => setNota(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} estrelas`}
              disabled={enviando}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          placeholder="Conte mais sobre o produto e a entrega (opcional)..."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={1000}
          rows={4}
          disabled={enviando}
        />

        {erro && <div className="avaliacao-erro">{erro}</div>}

        <div className="avaliacao-acoes">
          <button
            className="btn-pular"
            onClick={onClose}
            disabled={enviando}
          >
            Pular por agora
          </button>
          <button
            className="btn-enviar"
            onClick={handleSubmit}
            disabled={enviando || nota < 1}
          >
            {enviando ? "Enviando..." : "Enviar avaliação"}
          </button>
        </div>
      </div>
    </div>
  );
}
