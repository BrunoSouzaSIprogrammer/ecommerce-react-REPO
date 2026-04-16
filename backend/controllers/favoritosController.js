const db = require("../config/firebase");

// ==========================================
// Favoritos — collection "favoritos".
// Documento id = `${userId}_${produtoId}` (idempotente).
// Campos: { userId, produtoId, criadoEm }
// ==========================================

function docId(userId, produtoId) {
  return `${userId}_${produtoId}`;
}

// GET /favoritos — lista favoritos do usuário autenticado (com produto hidratado).
// Ordena em memória (criadoEm desc) para evitar a exigência de índice composto
// Firestore `userId + criadoEm`.
exports.listar = async (req, res) => {
  try {
    const userId = req.user.id;
    const snap = await db
      .firestore()
      .collection("favoritos")
      .where("userId", "==", userId)
      .get();

    // Ordena em memória por criadoEm desc.
    const docsOrdenados = snap.docs
      .map((d) => d.data())
      .sort((a, b) => String(b.criadoEm || "").localeCompare(String(a.criadoEm || "")));

    if (docsOrdenados.length === 0) return res.json([]);

    // Busca produtos em paralelo.
    const produtos = await Promise.all(
      docsOrdenados.map(async (fav) => {
        const p = await db
          .firestore()
          .collection("produtos")
          .doc(fav.produtoId)
          .get();
        if (!p.exists) return null;
        return {
          id: p.id,
          ...p.data(),
          favoritadoEm: fav.criadoEm,
        };
      }),
    );

    res.json(produtos.filter(Boolean));
  } catch (error) {
    console.error("ERRO LISTAR FAVORITOS:", error.message);
    res.status(500).json({ error: "Erro ao listar favoritos" });
  }
};

// GET /favoritos/ids — só os ids (usado para hidratar catálogo/produto rápido).
exports.listarIds = async (req, res) => {
  try {
    const userId = req.user.id;
    const snap = await db
      .firestore()
      .collection("favoritos")
      .where("userId", "==", userId)
      .get();
    res.json(snap.docs.map((d) => d.data().produtoId));
  } catch (error) {
    console.error("ERRO LISTAR IDS FAV:", error.message);
    res.status(500).json({ error: "Erro ao listar favoritos" });
  }
};

// POST /favoritos/:produtoId
exports.adicionar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { produtoId } = req.params;

    const produtoDoc = await db
      .firestore()
      .collection("produtos")
      .doc(produtoId)
      .get();
    if (!produtoDoc.exists) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    await db
      .firestore()
      .collection("favoritos")
      .doc(docId(userId, produtoId))
      .set({
        userId,
        produtoId,
        criadoEm: new Date().toISOString(),
      });

    res.json({ message: "Adicionado aos favoritos", produtoId });
  } catch (error) {
    console.error("ERRO ADICIONAR FAVORITO:", error.message);
    res.status(500).json({ error: "Erro ao adicionar favorito" });
  }
};

// DELETE /favoritos/:produtoId
exports.remover = async (req, res) => {
  try {
    const userId = req.user.id;
    const { produtoId } = req.params;
    await db
      .firestore()
      .collection("favoritos")
      .doc(docId(userId, produtoId))
      .delete();
    res.json({ message: "Removido dos favoritos", produtoId });
  } catch (error) {
    console.error("ERRO REMOVER FAVORITO:", error.message);
    res.status(500).json({ error: "Erro ao remover favorito" });
  }
};

// GET /favoritos/admin/ranking — top produtos mais favoritados (ADMIN).
exports.ranking = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const snap = await db.firestore().collection("favoritos").get();

    const contagem = new Map();
    snap.docs.forEach((d) => {
      const { produtoId } = d.data();
      contagem.set(produtoId, (contagem.get(produtoId) || 0) + 1);
    });

    const ordenado = [...contagem.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const resultado = await Promise.all(
      ordenado.map(async ([produtoId, total]) => {
        const p = await db
          .firestore()
          .collection("produtos")
          .doc(produtoId)
          .get();
        if (!p.exists) return null;
        return { produtoId, total, produto: { id: p.id, ...p.data() } };
      }),
    );

    res.json(resultado.filter(Boolean));
  } catch (error) {
    console.error("ERRO RANKING FAV:", error.message);
    res.status(500).json({ error: "Erro ao gerar ranking" });
  }
};
