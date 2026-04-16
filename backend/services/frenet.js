// ==========================================
// Integração Frenet — cálculo de frete.
// Doc: https://frenet.com.br/desenvolvedores/
// Em modo stub (FRENET_TOKEN vazio) retorna opções
// fixas para permitir desenvolvimento local.
// ==========================================

const FRENET_API = "https://api.frenet.com.br/shipping/quote";

// Dimensões padrão quando o produto não define.
// Valores em cm e kg.
const DIM_PADRAO = { peso: 0.4, altura: 10, largura: 20, comprimento: 30 };

function isStub() {
  return !process.env.FRENET_TOKEN;
}

function normalizarCep(cep) {
  return String(cep || "").replace(/\D/g, "");
}

function totalInvoice(itens) {
  return itens.reduce(
    (acc, it) => acc + Number(it.preco || 0) * Number(it.quantidade || 1),
    0
  );
}

function montarShippingItems(itens) {
  return itens.map((it, idx) => ({
    Weight: Number(it.peso ?? DIM_PADRAO.peso),
    Length: Number(it.comprimento ?? DIM_PADRAO.comprimento),
    Height: Number(it.altura ?? DIM_PADRAO.altura),
    Width: Number(it.largura ?? DIM_PADRAO.largura),
    Quantity: Number(it.quantidade || 1),
    SKU: String(it.id || idx),
    Category: "Roupa",
  }));
}

function stubOpcoes(itens) {
  const totalItens = itens.reduce(
    (acc, it) => acc + Number(it.quantidade || 1),
    0
  );
  // Frete simulado: base + R$ 3 por item.
  const base = 18.9;
  const preco = base + totalItens * 3;
  return [
    {
      servico: "PAC (simulado)",
      codigo: "STUB-PAC",
      transportadora: "STUB",
      preco: Number(preco.toFixed(2)),
      prazoDias: 7,
    },
    {
      servico: "SEDEX (simulado)",
      codigo: "STUB-SEDEX",
      transportadora: "STUB",
      preco: Number((preco + 12).toFixed(2)),
      prazoDias: 2,
    },
  ];
}

// itens: [{ id, preco, quantidade, peso?, altura?, largura?, comprimento? }]
async function calcularFrete({ cepDestino, itens }) {
  const cepOrigem = normalizarCep(process.env.CEP_ORIGEM);
  const cepDest = normalizarCep(cepDestino);

  if (!cepDest || cepDest.length !== 8) {
    throw new Error("CEP de destino inválido");
  }
  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    throw new Error("Itens são obrigatórios");
  }

  if (isStub()) {
    return stubOpcoes(itens);
  }

  const body = {
    SellerCEP: cepOrigem,
    RecipientCEP: cepDest,
    ShipmentInvoiceValue: totalInvoice(itens),
    ShippingServiceCode: null,
    ShippingItemArray: montarShippingItems(itens),
  };

  const res = await fetch(FRENET_API, {
    method: "POST",
    headers: {
      token: process.env.FRENET_TOKEN,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Frenet ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const arr = data.ShippingSevicesArray || data.ShippingServicesArray || [];

  const opcoes = arr
    .filter((s) => !s.Error && Number(s.ShippingPrice) > 0)
    .map((s) => ({
      servico: s.ServiceDescription,
      codigo: s.ServiceCode,
      transportadora: s.Carrier,
      preco: Number(s.ShippingPrice),
      prazoDias: Number(s.DeliveryTime || 0),
    }))
    .sort((a, b) => a.preco - b.preco);

  return opcoes;
}

// ==========================================
// Rastreio — Frenet /tracking/trackinginfo
//
// Em modo stub, simula o andamento com base na data de postagem.
// Fallback manual pelo ADMIN segue sendo a regra (CLAUDE.md).
// ==========================================
async function consultarRastreio({ codigoRastreio, transportadora, postadoEm }) {
  if (!codigoRastreio) {
    throw new Error("codigoRastreio é obrigatório");
  }

  if (isStub()) {
    const base = postadoEm ? new Date(postadoEm) : new Date();
    const dias = Math.max(
      0,
      Math.floor((Date.now() - base.getTime()) / (1000 * 60 * 60 * 24)),
    );

    let etapa = "Objeto postado";
    let entregue = false;
    if (dias >= 5) {
      etapa = "Objeto entregue ao destinatário";
      entregue = true;
    } else if (dias >= 2) {
      etapa = "Em trânsito";
    }

    return {
      codigo: codigoRastreio,
      transportadora: transportadora || "STUB",
      entregue,
      ultimaAtualizacao: new Date().toISOString(),
      eventos: [
        {
          data: base.toISOString(),
          status: "Postado",
          local: "Centro de Distribuição",
        },
        {
          data: new Date().toISOString(),
          status: etapa,
          local: entregue ? "Endereço do destinatário" : "Em rota",
        },
      ],
      modo: "stub",
    };
  }

  const res = await fetch("https://api.frenet.com.br/tracking/trackinginfo", {
    method: "POST",
    headers: {
      token: process.env.FRENET_TOKEN,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      shippingServiceCode: transportadora || "",
      trackingNumber: codigoRastreio,
    }),
  });

  if (!res.ok) {
    throw new Error(`Frenet tracking ${res.status}`);
  }

  const data = await res.json();
  const eventos = Array.isArray(data.TrackingEvents)
    ? data.TrackingEvents.map((e) => ({
        data: e.EventDateTime,
        status: e.EventDescription,
        local: [e.City, e.UF].filter(Boolean).join("/"),
      }))
    : [];

  const entregue = eventos.some((e) =>
    /entregue|delivered/i.test(e.status || ""),
  );

  return {
    codigo: codigoRastreio,
    transportadora: transportadora || data.ShippingServiceCode || null,
    entregue,
    ultimaAtualizacao: new Date().toISOString(),
    eventos,
    modo: "frenet",
  };
}

module.exports = { calcularFrete, consultarRastreio, isStub };
