import { useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import useTheme from "../hooks/useTheme";
import "../styles/pagamento.css";

const CONTEUDO = {
  sucesso: {
    titulo: "Pagamento aprovado!",
    emoji: "✅",
    descricao:
      "Recebemos a confirmação do seu pagamento. Em breve você receberá um e-mail com os detalhes do pedido e o código de rastreio.",
    classe: "sucesso",
  },
  pendente: {
    titulo: "Pagamento pendente",
    emoji: "⏳",
    descricao:
      "Seu pagamento ainda está sendo processado. Se escolheu PIX ou boleto, conclua a operação para finalizar o pedido. Você receberá um e-mail assim que for confirmado.",
    classe: "pendente",
  },
  falha: {
    titulo: "Pagamento não concluído",
    emoji: "❌",
    descricao:
      "Não foi possível concluir seu pagamento. Nenhum valor foi cobrado. Você pode tentar novamente com outro método ou cartão.",
    classe: "falha",
  },
};

export default function PagamentoResultado() {
  const { status } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const info = CONTEUDO[status] || CONTEUDO.pendente;

  // Mercado Pago envia payment_id, status, external_reference via query.
  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const pedidoId =
    query.get("pedido") ||
    query.get("external_reference") ||
    null;
  const paymentId = query.get("payment_id") || null;
  const isStub = query.get("stub") === "1";

  return (
    <div className="pagamento-page">
      <Navbar
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        theme={theme}
      />

      <div className="container pagamento-container">
        <div className={`pagamento-card ${info.classe}`}>
          <div className="pagamento-emoji">{info.emoji}</div>
          <h1>{info.titulo}</h1>
          <p>{info.descricao}</p>

          {isStub && (
            <div className="pagamento-stub">
              <strong>Modo de desenvolvimento</strong>
              <span>
                Mercado Pago ainda não está configurado com credenciais reais.
                Configure MP_ACCESS_TOKEN_PROD e MP_ACCESS_TOKEN_TEST no
                backend para habilitar o checkout de verdade.
              </span>
            </div>
          )}

          <div className="pagamento-meta">
            {pedidoId && (
              <div>
                <span>Pedido</span>
                <strong>{pedidoId}</strong>
              </div>
            )}
            {paymentId && (
              <div>
                <span>Pagamento</span>
                <strong>{paymentId}</strong>
              </div>
            )}
          </div>

          <div className="pagamento-acoes">
            <button
              className="btn-primario"
              onClick={() => navigate("/conta/pedidos")}
            >
              Ver meus pedidos
            </button>
            <button
              className="btn-secundario"
              onClick={() => navigate("/")}
            >
              Voltar para a loja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
