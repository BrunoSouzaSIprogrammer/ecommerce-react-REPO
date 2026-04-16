const db = require("../config/firebase");

const COLLECTION = "banners";

exports.listarBanners = async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION).orderBy("ordem", "asc").get();
    const banners = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(banners);
  } catch (error) {
    console.error("Erro ao listar banners:", error);
    res.status(500).json({ erro: "Erro ao listar banners" });
  }
};

exports.listarBannersAtivos = async (_req, res) => {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where("ativo", "==", true)
      .orderBy("ordem", "asc")
      .get();
    const banners = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(banners);
  } catch (error) {
    console.error("Erro ao listar banners ativos:", error);
    res.status(500).json({ erro: "Erro ao listar banners" });
  }
};

exports.criarBanner = async (req, res) => {
  try {
    const { titulo, subtitulo, imagemUrl, linkTo, corFundo, corTexto } = req.body;

    if (!titulo) {
      return res.status(400).json({ erro: "Título é obrigatório" });
    }

    const snapshot = await db.collection(COLLECTION).get();
    const ordem = snapshot.size;

    const banner = {
      titulo,
      subtitulo: subtitulo || "",
      imagemUrl: imagemUrl || "",
      linkTo: linkTo || "",
      corFundo: corFundo || "#0a0a0a",
      corTexto: corTexto || "#ffffff",
      ativo: true,
      ordem,
      criadoEm: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTION).add(banner);
    res.json({ id: docRef.id, ...banner });
  } catch (error) {
    console.error("Erro ao criar banner:", error);
    res.status(500).json({ erro: "Erro ao criar banner" });
  }
};

exports.atualizarBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = {};
    const body = req.body;

    if (body.titulo !== undefined) patch.titulo = body.titulo;
    if (body.subtitulo !== undefined) patch.subtitulo = body.subtitulo;
    if (body.imagemUrl !== undefined) patch.imagemUrl = body.imagemUrl;
    if (body.linkTo !== undefined) patch.linkTo = body.linkTo;
    if (body.corFundo !== undefined) patch.corFundo = body.corFundo;
    if (body.corTexto !== undefined) patch.corTexto = body.corTexto;
    if (body.ativo !== undefined) patch.ativo = body.ativo;
    if (body.ordem !== undefined) patch.ordem = body.ordem;

    await db.collection(COLLECTION).doc(id).update(patch);
    res.json({ mensagem: "Banner atualizado" });
  } catch (error) {
    console.error("Erro ao atualizar banner:", error);
    res.status(500).json({ erro: "Erro ao atualizar banner" });
  }
};

exports.deletarBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection(COLLECTION).doc(id).delete();
    res.json({ mensagem: "Banner deletado" });
  } catch (error) {
    console.error("Erro ao deletar banner:", error);
    res.status(500).json({ erro: "Erro ao deletar banner" });
  }
};
