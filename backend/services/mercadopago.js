// ==========================================
// Integração Mercado Pago — Marketplace com split 5%.
// Conta MAZZA cria preferências; conta BRUNO recebe
// o marketplace_fee. Em modo stub (token vazio) o
// init_point aponta direto para a página de sucesso
// no frontend, permitindo testar o fluxo sem MP.
// ==========================================

const MP_API = "https://api.mercadopago.com";

function mode() {
  return (process.env.MP_MODE || "test").toLowerCase() === "production"
    ? "production"
    : "test";
}

function sellerAccessToken() {
  return mode() === "production"
    ? process.env.MP_MAZZA_ACCESS_TOKEN
    : process.env.MP_MAZZA_ACCESS_TOKEN_TEST;
}

function marketplaceOwnerAccessToken() {
  // Usado pelo webhook para consultar pagamentos criados pela conta BRUNO,
  // caso eventualmente usemos o token da conta comissão.
  return mode() === "production"
    ? process.env.MP_BRUNO_ACCESS_TOKEN
    : process.env.MP_BRUNO_ACCESS_TOKEN_TEST;
}

function marketplaceId() {
  return process.env.MP_BRUNO_USER_ID || null;
}

function feePercent() {
  const p = Number(process.env.MP_MARKETPLACE_FEE_PERCENT || 5);
  return Number.isFinite(p) && p >= 0 && p <= 100 ? p : 5;
}

function isStub() {
  return !sellerAccessToken();
}

// Cria uma preferência de checkout.
// items: [{ title, quantity, unit_price, id? }]
async function criarPreferencia({
  items,
  externalReference,
  payer,
  backUrls,
  notificationUrl,
  total,
}) {
  if (isStub()) {
    const id = `stub_pref_${Date.now()}`;
    const front = process.env.MP_FRONTEND_URL || "http://localhost:3000";
    const initPoint = `${front}/pagamento/sucesso?stub=1&pedido=${encodeURIComponent(
      externalReference
    )}`;
    return {
      id,
      init_point: initPoint,
      sandbox_init_point: initPoint,
      _stub: true,
      feePercent: feePercent(),
    };
  }

  const marketplaceFeeAbs = Number((Number(total || 0) * feePercent()) / 100);

  const body = {
    items: items.map((it) => ({
      id: String(it.id || ""),
      title: String(it.title || "Item"),
      quantity: Number(it.quantity || 1),
      unit_price: Number(it.unit_price || 0),
      currency_id: "BRL",
    })),
    external_reference: externalReference,
    notification_url: notificationUrl,
    back_urls: backUrls,
    auto_return: "approved",
    marketplace_fee: Number(marketplaceFeeAbs.toFixed(2)),
    marketplace: marketplaceId() || undefined,
    payer: payer || undefined,
  };

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sellerAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `Mercado Pago respondeu ${res.status}: ${text.slice(0, 300)}`
    );
  }
  const data = JSON.parse(text);
  return { ...data, feePercent: feePercent() };
}

async function obterPagamento(paymentId) {
  if (isStub()) return null;
  const token = sellerAccessToken() || marketplaceOwnerAccessToken();
  if (!token) return null;

  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

module.exports = {
  criarPreferencia,
  obterPagamento,
  isStub,
  marketplaceId,
  feePercent,
  mode,
};
