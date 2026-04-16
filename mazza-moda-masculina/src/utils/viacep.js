// ==========================================
// ViaCEP — lookup de endereço por CEP.
// API pública, sem autenticação.
// Doc: https://viacep.com.br/
// ==========================================

export function limparCep(cep) {
  return String(cep || "").replace(/\D/g, "");
}

export function formatarCep(cep) {
  const clean = limparCep(cep);
  if (clean.length !== 8) return cep || "";
  return `${clean.slice(0, 5)}-${clean.slice(5)}`;
}

export async function buscarCep(cep) {
  const clean = limparCep(cep);
  if (clean.length !== 8) {
    throw new Error("CEP deve ter 8 dígitos");
  }
  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
  if (!res.ok) {
    throw new Error("Não foi possível consultar o CEP");
  }
  const data = await res.json();
  if (data.erro) {
    throw new Error("CEP não encontrado");
  }
  return {
    cep: data.cep || formatarCep(clean),
    rua: data.logradouro || "",
    complemento: data.complemento || "",
    bairro: data.bairro || "",
    cidade: data.localidade || "",
    uf: data.uf || "",
  };
}
