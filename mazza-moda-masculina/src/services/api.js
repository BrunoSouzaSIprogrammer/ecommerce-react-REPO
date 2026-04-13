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

export const getProdutoById = async (id, token = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_URL}/produtos/${id}`, { headers });
  return res.json();
};

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