// ==========================================
// Helpers de status de pedido — fonte única de labels/cores.
// Fluxo canônico:
//   aguardando_pagamento → em_producao → enviado → recebido
//   (qualquer ponto) → cancelado
// ==========================================

export const STATUS_FLUXO = [
  "aguardando_pagamento",
  "em_producao",
  "enviado",
  "recebido",
];

export const STATUS_LABELS = {
  aguardando_pagamento: "Aguardando pagamento",
  em_producao: "Em produção",
  enviado: "Enviado aos Correios",
  recebido: "Recebido",
  cancelado: "Cancelado",
};

export const STATUS_CORES = {
  aguardando_pagamento: "#f1c40f",
  em_producao: "#3498db",
  enviado: "#9b59b6",
  recebido: "#2ecc71",
  cancelado: "#e74c3c",
};

export function labelStatus(status) {
  return STATUS_LABELS[status] || status || "—";
}

export function corStatus(status) {
  return STATUS_CORES[status] || "#888";
}

// Porcentagem de progresso na linha do tempo (0..100).
export function progressoStatus(status) {
  if (status === "cancelado") return 100;
  const idx = STATUS_FLUXO.indexOf(status);
  if (idx < 0) return 0;
  return Math.round((idx / (STATUS_FLUXO.length - 1)) * 100);
}

export function formatarData(valor) {
  if (!valor) return "—";
  // Firestore Timestamp pode vir como { _seconds, _nanoseconds }.
  if (valor?._seconds) {
    return new Date(valor._seconds * 1000).toLocaleString("pt-BR");
  }
  try {
    return new Date(valor).toLocaleString("pt-BR");
  } catch {
    return "—";
  }
}
