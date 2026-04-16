const { Resend } = require("resend");

const FROM = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const LOJA_NOME = "MAZZA Moda Masculina";

let _resend = null;
function getResend() {
  if (_resend) return _resend;
  if (!process.env.RESEND_API_KEY) return null;
  _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

function layoutBase(conteudo) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:12px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#c9a227,#b8911f);padding:28px 32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:4px;">MAZZA</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:2px;">MODA MASCULINA</p>
        </td></tr>
        <tr><td style="padding:32px;color:#e0e0e0;font-size:15px;line-height:1.6;">
          ${conteudo}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #2a2a2a;text-align:center;">
          <p style="margin:0;color:#666;font-size:12px;">${LOJA_NOME} &mdash; Estilo e elegância para o homem moderno</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function formatarPreco(valor) {
  return `R$ ${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function tabelaItens(itens) {
  if (!itens || !itens.length) return "";
  const rows = itens
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#ccc;">${item.nome || "Produto"}</td>
        <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#ccc;text-align:center;">${item.quantidade || 1}</td>
        <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#c9a227;text-align:right;">${formatarPreco(item.preco || 0)}</td>
      </tr>`
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <th style="padding:8px 0;border-bottom:2px solid #c9a227;color:#999;font-size:12px;text-align:left;text-transform:uppercase;">Produto</th>
        <th style="padding:8px 0;border-bottom:2px solid #c9a227;color:#999;font-size:12px;text-align:center;text-transform:uppercase;">Qtd</th>
        <th style="padding:8px 0;border-bottom:2px solid #c9a227;color:#999;font-size:12px;text-align:right;text-transform:uppercase;">Preço</th>
      </tr>
      ${rows}
    </table>`;
}

const STATUS_LABELS = {
  aguardando_pagamento: "Aguardando Pagamento",
  processando: "Processando",
  pago: "Pagamento Confirmado",
  em_producao: "Em Produção",
  enviado: "Enviado",
  recebido: "Recebido",
  cancelado: "Cancelado",
};

async function enviar(to, subject, html) {
  const resend = getResend();
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY não configurada — email não enviado.");
    return null;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: `${LOJA_NOME} <${FROM}>`,
      to: [to],
      subject,
      html,
    });
    if (error) {
      console.error("[Email] Erro Resend:", error);
      return null;
    }
    console.log(`[Email] Enviado para ${to}: "${subject}" (id: ${data?.id})`);
    return data;
  } catch (err) {
    console.error("[Email] Exceção:", err.message);
    return null;
  }
}

exports.emailPedidoCriado = async (email, pedido) => {
  const metodo =
    pedido.metodoPagamento === "pix" ? "PIX" : "Cartão de Crédito";

  let pixBlock = "";
  if (pedido.pixCode) {
    pixBlock = `
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
        <p style="margin:0 0 8px;color:#c9a227;font-weight:bold;">Código PIX (copia e cola)</p>
        <p style="margin:0;color:#fff;font-size:13px;word-break:break-all;background:#0a0a0a;padding:12px;border-radius:6px;">${pedido.pixCode}</p>
        <p style="margin:10px 0 0;color:#999;font-size:12px;">Válido por 24 horas</p>
      </div>`;
  }

  const html = layoutBase(`
    <h2 style="color:#c9a227;margin:0 0 16px;">Pedido Confirmado!</h2>
    <p>Olá! Seu pedido <strong style="color:#fff;">#${pedido.id}</strong> foi registrado com sucesso.</p>
    <p><strong style="color:#ccc;">Método de pagamento:</strong> ${metodo}</p>
    ${tabelaItens(pedido.itens)}
    <p style="text-align:right;font-size:18px;color:#c9a227;font-weight:bold;">
      Total: ${formatarPreco(pedido.total)}
    </p>
    ${pixBlock}
    <p style="color:#999;">Acompanhe o status do seu pedido na área "Meus Pedidos".</p>
  `);

  return enviar(email, `Pedido #${pedido.id} confirmado — ${LOJA_NOME}`, html);
};

exports.emailStatusAtualizado = async (email, pedido) => {
  const statusLabel = STATUS_LABELS[pedido.status] || pedido.status;

  let rastreioBlock = "";
  if (pedido.status === "enviado" && pedido.rastreio?.codigo) {
    rastreioBlock = `
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 6px;color:#c9a227;font-weight:bold;">Dados de Rastreio</p>
        <p style="margin:0;color:#ccc;">Código: <strong style="color:#fff;">${pedido.rastreio.codigo}</strong></p>
        ${pedido.rastreio.transportadora ? `<p style="margin:4px 0 0;color:#ccc;">Transportadora: ${pedido.rastreio.transportadora}</p>` : ""}
        ${pedido.rastreio.linkRastreio ? `<p style="margin:8px 0 0;"><a href="${pedido.rastreio.linkRastreio}" style="color:#c9a227;">Rastrear encomenda →</a></p>` : ""}
      </div>`;
  }

  let mensagemExtra = "";
  if (pedido.status === "em_producao") {
    mensagemExtra = "<p>Estamos preparando seu pedido com carinho!</p>";
  } else if (pedido.status === "enviado") {
    mensagemExtra = "<p>Seu pedido saiu para entrega! Acompanhe pelo código de rastreio.</p>";
  } else if (pedido.status === "recebido") {
    mensagemExtra = '<p>Que bom que chegou! Avalie seu pedido na área "Meus Pedidos".</p>';
  } else if (pedido.status === "cancelado") {
    mensagemExtra = "<p>Seu pedido foi cancelado. Se tiver dúvidas, entre em contato.</p>";
  }

  const html = layoutBase(`
    <h2 style="color:#c9a227;margin:0 0 16px;">Atualização do Pedido</h2>
    <p>Seu pedido <strong style="color:#fff;">#${pedido.id}</strong> teve o status atualizado:</p>
    <div style="background:#1a1a1a;border-left:4px solid #c9a227;padding:16px;margin:16px 0;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:18px;color:#fff;font-weight:bold;">${statusLabel}</p>
    </div>
    ${mensagemExtra}
    ${rastreioBlock}
  `);

  return enviar(email, `Pedido #${pedido.id} — ${statusLabel}`, html);
};

exports.emailPagamentoConfirmado = async (email, pedido) => {
  const html = layoutBase(`
    <h2 style="color:#c9a227;margin:0 0 16px;">Pagamento Confirmado!</h2>
    <p>O pagamento do pedido <strong style="color:#fff;">#${pedido.id}</strong> foi confirmado.</p>
    <p style="font-size:18px;color:#c9a227;font-weight:bold;">
      ${formatarPreco(pedido.total)}
    </p>
    <p>Seu pedido já está em produção. Enviaremos uma atualização quando for despachado.</p>
  `);

  return enviar(email, `Pagamento confirmado — Pedido #${pedido.id}`, html);
};

