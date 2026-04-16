const API_URL = "http://localhost:5000";

// ================= AUTH =================
export const login = async (email, senha) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Login inválido");
  }

  return data;
};

export const register = async (nome, email, senha) => {
  const res = await fetch(`${API_URL}/cadastrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Erro ao cadastrar");
  }

  return data;
};

// ================= PRODUTOS =================
export const getProdutos = async (token = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_URL}/produtos`, { headers });
  return res.json();
};

// Listagem com filtros — usada pela página Catálogo.
// params: { categoria, marca, q, tamanhos, cores, tipos,
//           subtipo, estampa, precoMin, precoMax, destaque, ordenar }
export const listarProdutos = async (params = {}, token = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.append(k, String(v));
  });
  const url = qs.toString()
    ? `${API_URL}/produtos?${qs.toString()}`
    : `${API_URL}/produtos`;
  const res = await fetch(url, { headers });
  return res.json();
};

export const getProdutoById = async (id, token = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_URL}/produtos/${id}`, { headers });
  return res.json();
};

// Alias mais claro — usado pela página de Produto.
export const obterProduto = getProdutoById;

export const createProduto = async (produto, token) => {
  const formData = new FormData();
  formData.append("nome", produto.nome);
  formData.append("preco", produto.preco);
  formData.append("categoriaId", produto.categoriaId);
  formData.append("destaque", produto.destaque || false);
  if (produto.imagem) {
    formData.append("imagem", produto.imagem);
  }

  const res = await fetch(`${API_URL}/produtos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Erro ao criar produto");
  }

  return res.json();
};

export const updateProduto = async (id, produto, token) => {
  const res = await fetch(`${API_URL}/produtos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(produto)
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Erro ao atualizar produto");
  }

  return res.json();
};

export const deleteProduto = async (id, token) => {
  const res = await fetch(`${API_URL}/produtos/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Erro ao deletar produto");
  }

  return res.json();
};

export const updateEstoque = async (id, estoque, token) => {
  const res = await fetch(`${API_URL}/produtos/${id}/estoque`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ estoque })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Erro ao atualizar estoque");
  }

  return res.json();
};

// ================= CATEGORIAS =================
export const getCategorias = async () => {
  const res = await fetch(`${API_URL}/categorias`);
  return res.json();
};

export const createCategoria = async (nome, token) => {
  const res = await fetch(`${API_URL}/categorias`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ nome })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Erro ao criar categoria");
  }

  return res.json();
};

export const deleteCategoria = async (id, token) => {
  const res = await fetch(`${API_URL}/categorias/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Erro ao deletar categoria");
  }

  return res.json();
};

// ================= PEDIDOS =================
export const getPedidos = async (token) => {
  const res = await fetch(`${API_URL}/pedidos`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const createPedido = async (pedido, token) => {
  const res = await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      itens: pedido.itens,
      total: pedido.total,
      metodoPagamento: pedido.metodoPagamento,
      dadosPagamento: pedido.dadosPagamento || {}
    })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Erro ao criar pedido");
  }

  return res.json();
};

// Alias mais descritivo para o frontend.
export const listarPedidos = getPedidos;

export const obterPedido = async (id, token) => {
  const res = await fetch(`${API_URL}/pedidos/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao obter pedido");
  }
  return res.json();
};

export const atualizarStatusPedido = async (id, status, token) => {
  const res = await fetch(`${API_URL}/pedidos/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao atualizar status");
  }
  return res.json();
};

export const atualizarRastreio = async (id, dados, token) => {
  const res = await fetch(`${API_URL}/pedidos/${id}/rastreio`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao atualizar rastreio");
  }
  return res.json();
};

export const consultarRastreio = async (id, token) => {
  const res = await fetch(`${API_URL}/pedidos/${id}/rastreio`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao consultar rastreio");
  }
  return res.json();
};

export const avaliarPedido = async (id, nota, comentario, token) => {
  const res = await fetch(`${API_URL}/pedidos/${id}/avaliar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ nota, comentario }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao avaliar pedido");
  }
  return res.json();
};

export const getComissaoConfig = async (token) => {
  const res = await fetch(`${API_URL}/pedidos/comissao/config`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

// ================= FINANCEIRO =================
export const getFinanceiro = async (token) => {
  const res = await fetch(`${API_URL}/financeiro`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

// ================= FRETE =================
// itens: [{ id, preco, quantidade, peso?, altura?, largura?, comprimento? }]
export const calcularFrete = async (cepDestino, itens) => {
  const res = await fetch(`${API_URL}/frete/calcular`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cepDestino, itens }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.erro || "Erro ao calcular frete");
  }
  return res.json();
};

// ================= PAGAMENTOS (Mercado Pago) =================
// Cria preferência e retorna { pedidoId, initPoint, stub, feePercent, total }.
export const criarPreferenciaPagamento = async (dados, token) => {
  const res = await fetch(`${API_URL}/pagamentos/preferencia`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao criar pagamento");
  }
  return res.json();
};

// ================= OAUTH MP =================
export const mpOauthStatus = async (token) => {
  const res = await fetch(`${API_URL}/admin/mp-oauth/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { conectado: false };
  return res.json();
};

// URL direta — não é fetch, é redirect do browser.
export const mpOauthStartUrl = () => `${API_URL}/admin/mp-oauth/start`;

// ================= FAVORITOS =================
export const listarFavoritos = async (token) => {
  const res = await fetch(`${API_URL}/favoritos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao listar favoritos");
  }
  return res.json();
};

export const listarFavoritosIds = async (token) => {
  const res = await fetch(`${API_URL}/favoritos/ids`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao listar favoritos");
  }
  return res.json();
};

export const adicionarFavorito = async (produtoId, token) => {
  const res = await fetch(`${API_URL}/favoritos/${produtoId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao adicionar favorito");
  }
  return res.json();
};

export const removerFavorito = async (produtoId, token) => {
  const res = await fetch(`${API_URL}/favoritos/${produtoId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao remover favorito");
  }
  return res.json();
};

export const rankingFavoritos = async (token, limit = 20) => {
  const res = await fetch(`${API_URL}/favoritos/admin/ranking?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao obter ranking");
  }
  return res.json();
};

// ================= CUPONS =================
// { codigo, subtotalItens, categorias } -> { codigo, tipo, valor, desconto, descricao }
export const validarCupom = async (dados, token) => {
  const res = await fetch(`${API_URL}/cupons/validar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Cupom inválido");
  }
  return res.json();
};

export const listarCupons = async (token) => {
  const res = await fetch(`${API_URL}/cupons`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao listar cupons");
  }
  return res.json();
};

export const criarCupom = async (cupom, token) => {
  const res = await fetch(`${API_URL}/cupons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(cupom),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao criar cupom");
  }
  return res.json();
};

export const atualizarCupom = async (codigo, patch, token) => {
  const res = await fetch(`${API_URL}/cupons/${codigo}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao atualizar cupom");
  }
  return res.json();
};

export const deletarCupom = async (codigo, token) => {
  const res = await fetch(`${API_URL}/cupons/${codigo}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao deletar cupom");
  }
  return res.json();
};