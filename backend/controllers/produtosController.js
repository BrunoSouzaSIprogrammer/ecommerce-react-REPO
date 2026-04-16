const db = require("../config/firebase");
const { CATEGORIAS_POR_ID } = require("../shared/filtros");

// ==========================================
// Helpers
// ==========================================

// Normaliza query params que podem vir como string única
// ("Azul") ou lista ("Azul,Preto") em um array.
function parseMulti(value) {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseBool(value) {
  if (value === undefined || value === null || value === "") return null;
  const v = String(value).toLowerCase();
  if (v === "true" || v === "1" || v === "sim") return true;
  if (v === "false" || v === "0" || v === "nao" || v === "não") return false;
  return null;
}

function parseNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Testa se produto.tamanhos inclui algum dos tamanhos pedidos.
// Aceita tanto um array quanto um campo único legado.
function matchArrayOuSingular(campo, filtrosPedidos) {
  if (!filtrosPedidos.length) return true;
  if (campo === undefined || campo === null) return false;
  const valores = Array.isArray(campo) ? campo : [campo];
  return filtrosPedidos.some((pedido) =>
    valores.some((v) => String(v).toLowerCase() === String(pedido).toLowerCase())
  );
}

function matchSingular(campo, filtrosPedidos) {
  if (!filtrosPedidos.length) return true;
  if (campo === undefined || campo === null) return false;
  return filtrosPedidos.some(
    (v) => String(v).toLowerCase() === String(campo).toLowerCase()
  );
}

// ==========================================
// LISTAR com filtros + ordenação
// GET /produtos
// Query params aceitos:
//   categoria=camisetas | cobra-dagua | ...
//   marca=NomeExato
//   q=texto-livre              (busca em nome/descricao)
//   tamanhos=P,M,G
//   cores=Azul,Preto
//   tipos=Polo,Oversize
//   subtipo=Prata 925          (acessórios)
//   estampa=true|false
//   precoMin=50
//   precoMax=500
//   destaque=true
//   ordenar=mais-vendidos|menor-preco|maior-preco
// ==========================================
exports.listarProdutos = async (req, res) => {
  try {
    const {
      categoria,
      marca,
      q,
      subtipo,
      ordenar,
    } = req.query;

    const tamanhos = parseMulti(req.query.tamanhos);
    const cores = parseMulti(req.query.cores);
    const tipos = parseMulti(req.query.tipos);
    const estampa = parseBool(req.query.estampa);
    const precoMin = parseNumber(req.query.precoMin);
    const precoMax = parseNumber(req.query.precoMax);
    const destaque = parseBool(req.query.destaque);

    const snapshot = await db.collection("produtos").get();
    let produtos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Categoria virtual "cobra-dagua" — filtra por marca
    // mesmo se categoria base for outra.
    const catDef = categoria ? CATEGORIAS_POR_ID[categoria] : null;
    if (catDef && catDef.marcaFixa) {
      produtos = produtos.filter(
        (p) =>
          (p.marca || "").toLowerCase() ===
          catDef.marcaFixa.toLowerCase()
      );
    } else if (categoria) {
      produtos = produtos.filter(
        (p) => (p.categoriaId || "").toLowerCase() === categoria.toLowerCase()
      );
    }

    if (marca) {
      const marcaLower = String(marca).toLowerCase();
      produtos = produtos.filter((p) =>
        (p.marca || "").toLowerCase().includes(marcaLower)
      );
    }

    if (q) {
      const qLower = String(q).toLowerCase();
      produtos = produtos.filter((p) => {
        const nome = (p.nome || "").toLowerCase();
        const desc = (p.descricao || "").toLowerCase();
        return nome.includes(qLower) || desc.includes(qLower);
      });
    }

    if (tamanhos.length) {
      produtos = produtos.filter((p) =>
        matchArrayOuSingular(p.tamanhos ?? p.tamanho, tamanhos)
      );
    }

    if (cores.length) {
      produtos = produtos.filter((p) =>
        matchArrayOuSingular(p.cores ?? p.cor, cores)
      );
    }

    if (tipos.length) {
      produtos = produtos.filter((p) => matchSingular(p.tipo, tipos));
    }

    if (subtipo) {
      produtos = produtos.filter(
        (p) => (p.subtipo || "").toLowerCase() === String(subtipo).toLowerCase()
      );
    }

    if (estampa !== null) {
      produtos = produtos.filter((p) => Boolean(p.estampa) === estampa);
    }

    if (precoMin !== null) {
      produtos = produtos.filter((p) => Number(p.preco) >= precoMin);
    }
    if (precoMax !== null) {
      produtos = produtos.filter((p) => Number(p.preco) <= precoMax);
    }

    if (destaque !== null) {
      produtos = produtos.filter((p) => Boolean(p.destaque) === destaque);
    }

    // Estoque zerado: esconde da vitrine pública.
    // Admin pode passar ?incluirSemEstoque=true para ver tudo.
    const incluirSemEstoque = parseBool(req.query.incluirSemEstoque);
    if (!incluirSemEstoque) {
      produtos = produtos.filter((p) => (p.estoque ?? 1) > 0);
    }

    // Ordenação
    switch (ordenar) {
      case "menor-preco":
        produtos.sort((a, b) => Number(a.preco || 0) - Number(b.preco || 0));
        break;
      case "maior-preco":
        produtos.sort((a, b) => Number(b.preco || 0) - Number(a.preco || 0));
        break;
      case "mais-vendidos":
        produtos.sort(
          (a, b) => Number(b.vendidos || 0) - Number(a.vendidos || 0)
        );
        break;
      default:
        break;
    }

    res.json(produtos);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    res.status(500).json({ erro: "Erro ao listar produtos" });
  }
};

// ==========================================
// OBTER por ID
// GET /produtos/:id
// ==========================================
exports.obterProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("produtos").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    res.status(500).json({ erro: "Erro ao buscar produto" });
  }
};

// ==========================================
// Helper: extrai e valida o body vindo de
// multipart/form-data (todos os campos chegam
// como strings, precisamos parsear arrays/bools).
// ==========================================
function extrairDadosProduto(body) {
  const dados = {
    nome: body.nome,
    descricao: body.descricao || "",
    preco: body.preco !== undefined ? Number(body.preco) : undefined,
    categoriaId: body.categoriaId,
    marca: body.marca || "",
    tipo: body.tipo || "",
    subtipo: body.subtipo || "",
    cores: parseMulti(body.cores),
    tamanhos: parseMulti(body.tamanhos),
    estampa: parseBool(body.estampa) ?? false,
    destaque: parseBool(body.destaque) ?? false,
    estoque:
      body.estoque !== undefined && body.estoque !== ""
        ? Number(body.estoque)
        : 0,
    vendidos: 0,
  };
  return dados;
}

// ==========================================
// CRIAR
// POST /produtos (multipart)
// ==========================================
exports.criarProduto = async (req, res) => {
  try {
    const dados = extrairDadosProduto(req.body);

    if (!dados.nome) return res.status(400).json({ erro: "Nome é obrigatório" });
    if (!dados.categoriaId)
      return res.status(400).json({ erro: "Categoria é obrigatória" });
    if (!Number.isFinite(dados.preco))
      return res.status(400).json({ erro: "Preço inválido" });

    const imagens = [];
    if (req.files && req.files.length) {
      imagens.push(...req.files.map((f) => f.filename));
    } else if (req.file) {
      imagens.push(req.file.filename);
    }

    const novoProduto = {
      ...dados,
      imagens,
      // Mantém `imagem` (singular) para compatibilidade com código legado.
      imagem: imagens[0] || null,
      criadoEm: new Date().toISOString(),
    };

    const docRef = await db.collection("produtos").add(novoProduto);
    res.json({
      mensagem: "Produto criado!",
      id: docRef.id,
      produto: { id: docRef.id, ...novoProduto },
    });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
};

// ==========================================
// ATUALIZAR
// PUT /produtos/:id  (JSON — sem troca de imagem)
// ==========================================
exports.atualizarProduto = async (req, res) => {
  try {
    const { id } = req.params;

    // Só atualiza campos enviados — evita sobrescrever com undefined.
    const patch = {};
    const body = req.body;

    if (body.nome !== undefined) patch.nome = body.nome;
    if (body.descricao !== undefined) patch.descricao = body.descricao;
    if (body.preco !== undefined) patch.preco = Number(body.preco);
    if (body.categoriaId !== undefined) patch.categoriaId = body.categoriaId;
    if (body.marca !== undefined) patch.marca = body.marca;
    if (body.tipo !== undefined) patch.tipo = body.tipo;
    if (body.subtipo !== undefined) patch.subtipo = body.subtipo;
    if (body.cores !== undefined) patch.cores = parseMulti(body.cores);
    if (body.tamanhos !== undefined) patch.tamanhos = parseMulti(body.tamanhos);
    if (body.estampa !== undefined) patch.estampa = parseBool(body.estampa) ?? false;
    if (body.destaque !== undefined) patch.destaque = parseBool(body.destaque) ?? false;
    if (body.estoque !== undefined) patch.estoque = Number(body.estoque);

    await db.collection("produtos").doc(id).update(patch);
    res.json({ mensagem: "Produto atualizado" });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
};

// ==========================================
// DELETAR
// DELETE /produtos/:id
// ==========================================
exports.deletarProduto = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("produtos").doc(id).delete();
    res.json({ mensagem: "Produto deletado" });
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    res.status(500).json({ error: "Erro ao deletar produto" });
  }
};

// ==========================================
// ATUALIZAR ESTOQUE
// PATCH /produtos/:id/estoque  ou PUT /produtos/estoque/:id (legado)
// ==========================================
exports.atualizarEstoque = async (req, res) => {
  try {
    const { id } = req.params;
    const estoque = Number(req.body.estoque);
    if (!Number.isFinite(estoque) || estoque < 0) {
      return res.status(400).json({ erro: "Estoque inválido" });
    }
    await db.collection("produtos").doc(id).update({ estoque });
    res.json({ message: "Estoque atualizado" });
  } catch (error) {
    console.error("Erro ao atualizar estoque:", error);
    res.status(500).json({ error: "Erro ao atualizar estoque" });
  }
};
