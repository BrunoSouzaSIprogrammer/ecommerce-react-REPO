const db = require("../config/firebase");

// ==========================================
// Cupons — collection "cupons".
// Documento id = código em UPPERCASE (ex.: "BLACKFRIDAY20").
//
// Campos:
//   codigo         (string, UPPERCASE — index id)
//   descricao      (string opcional)
//   tipo           ("percentual" | "valor_fixo")
//   valor          (number — 20 significa 20% se percentual, ou R$20 se fixo)
//   minimoCompra   (number — subtotal mínimo em itens)
//   escopo         ({ tipo: "total" | "categoria" | "filtro", categoria?, filtros? })
//   validoDe       (ISO string)
//   validoAte      (ISO string)
//   maxUsos        (number | null — null = ilimitado)
//   usos           (number — incrementado a cada compra aprovada)
//   ativo          (boolean)
//   criadoEm / atualizadoEm
// ==========================================

const COL = "cupons";

function normalizarCodigo(c) {
  return String(c || "").trim().toUpperCase();
}

// Retorna { ok, cupom, erro, desconto } — núcleo usado também pelo pagamentosController.
async function validarCupom({ codigo, subtotalItens, categorias }) {
  const cod = normalizarCodigo(codigo);
  if (!cod) return { ok: false, erro: "Código do cupom é obrigatório" };

  const doc = await db.firestore().collection(COL).doc(cod).get();
  if (!doc.exists) return { ok: false, erro: "Cupom inválido" };

  const cupom = { id: doc.id, ...doc.data() };
  if (!cupom.ativo) return { ok: false, erro: "Cupom inativo" };

  const agora = Date.now();
  if (cupom.validoDe && new Date(cupom.validoDe).getTime() > agora) {
    return { ok: false, erro: "Cupom ainda não é válido" };
  }
  if (cupom.validoAte && new Date(cupom.validoAte).getTime() < agora) {
    return { ok: false, erro: "Cupom expirado" };
  }
  if (cupom.maxUsos && cupom.usos >= cupom.maxUsos) {
    return { ok: false, erro: "Cupom esgotado" };
  }
  if (
    Number.isFinite(cupom.minimoCompra) &&
    cupom.minimoCompra > 0 &&
    subtotalItens < cupom.minimoCompra
  ) {
    return {
      ok: false,
      erro: `Subtotal mínimo de R$ ${Number(cupom.minimoCompra).toFixed(2)}`,
    };
  }

  // Verifica escopo.
  if (cupom.escopo?.tipo === "categoria" && cupom.escopo?.categoria) {
    const tem = (categorias || []).some(
      (c) =>
        String(c || "").toLowerCase() ===
        String(cupom.escopo.categoria).toLowerCase(),
    );
    if (!tem) {
      return {
        ok: false,
        erro: `Cupom válido apenas para ${cupom.escopo.categoria}`,
      };
    }
  }

  // Calcula desconto sobre o subtotal de itens (não sobre o frete).
  let desconto = 0;
  if (cupom.tipo === "percentual") {
    desconto = (subtotalItens * Number(cupom.valor || 0)) / 100;
  } else {
    desconto = Number(cupom.valor || 0);
  }
  desconto = Math.min(desconto, subtotalItens);
  desconto = Number(desconto.toFixed(2));

  return { ok: true, cupom, desconto };
}

exports.validarCupom = validarCupom;

// ================= ADMIN CRUD =================
exports.listar = async (req, res) => {
  try {
    const snap = await db
      .firestore()
      .collection(COL)
      .orderBy("criadoEm", "desc")
      .get();
    const cupons = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(cupons);
  } catch (error) {
    console.error("ERRO LISTAR CUPONS:", error.message);
    res.status(500).json({ error: "Erro ao listar cupons" });
  }
};

exports.criar = async (req, res) => {
  try {
    const {
      codigo,
      descricao,
      tipo,
      valor,
      minimoCompra,
      escopo,
      validoDe,
      validoAte,
      maxUsos,
      ativo,
    } = req.body;

    const cod = normalizarCodigo(codigo);
    if (!cod) return res.status(400).json({ error: "Código é obrigatório" });
    if (!["percentual", "valor_fixo"].includes(tipo)) {
      return res.status(400).json({ error: "Tipo deve ser percentual ou valor_fixo" });
    }
    const v = Number(valor);
    if (!Number.isFinite(v) || v <= 0) {
      return res.status(400).json({ error: "Valor deve ser positivo" });
    }
    if (tipo === "percentual" && v > 100) {
      return res.status(400).json({ error: "Percentual máximo é 100" });
    }

    const exists = await db.firestore().collection(COL).doc(cod).get();
    if (exists.exists) {
      return res.status(409).json({ error: "Código já existe" });
    }

    const doc = {
      codigo: cod,
      descricao: descricao || "",
      tipo,
      valor: v,
      minimoCompra: Number(minimoCompra) || 0,
      escopo: escopo || { tipo: "total" },
      validoDe: validoDe || null,
      validoAte: validoAte || null,
      maxUsos: maxUsos ? Number(maxUsos) : null,
      usos: 0,
      ativo: ativo !== false,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      criadoPor: req.user.id,
    };

    await db.firestore().collection(COL).doc(cod).set(doc);
    res.status(201).json({ id: cod, ...doc });
  } catch (error) {
    console.error("ERRO CRIAR CUPOM:", error.message);
    res.status(500).json({ error: "Erro ao criar cupom" });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const cod = normalizarCodigo(req.params.codigo);
    const ref = db.firestore().collection(COL).doc(cod);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Cupom não encontrado" });

    const body = { ...req.body };
    delete body.codigo; // código é imutável (é o id).
    delete body.usos;   // usos é controlado pelo sistema.

    if (body.tipo && !["percentual", "valor_fixo"].includes(body.tipo)) {
      return res.status(400).json({ error: "Tipo inválido" });
    }
    if (body.valor !== undefined) {
      const v = Number(body.valor);
      if (!Number.isFinite(v) || v <= 0) {
        return res.status(400).json({ error: "Valor inválido" });
      }
      body.valor = v;
    }

    body.atualizadoEm = new Date().toISOString();
    await ref.update(body);
    const updated = await ref.get();
    res.json({ id: cod, ...updated.data() });
  } catch (error) {
    console.error("ERRO ATUALIZAR CUPOM:", error.message);
    res.status(500).json({ error: "Erro ao atualizar cupom" });
  }
};

exports.deletar = async (req, res) => {
  try {
    const cod = normalizarCodigo(req.params.codigo);
    await db.firestore().collection(COL).doc(cod).delete();
    res.json({ message: "Cupom removido", codigo: cod });
  } catch (error) {
    console.error("ERRO DELETAR CUPOM:", error.message);
    res.status(500).json({ error: "Erro ao deletar cupom" });
  }
};

// ================= CLIENTE: VALIDAR =================
// POST /cupons/validar { codigo, subtotalItens, categorias }
exports.validarEndpoint = async (req, res) => {
  try {
    const { codigo, subtotalItens, categorias } = req.body;
    const result = await validarCupom({
      codigo,
      subtotalItens: Number(subtotalItens) || 0,
      categorias: Array.isArray(categorias) ? categorias : [],
    });
    if (!result.ok) {
      return res.status(400).json({ error: result.erro });
    }
    res.json({
      codigo: result.cupom.codigo,
      tipo: result.cupom.tipo,
      valor: result.cupom.valor,
      desconto: result.desconto,
      descricao: result.cupom.descricao || null,
    });
  } catch (error) {
    console.error("ERRO VALIDAR CUPOM:", error.message);
    res.status(500).json({ error: "Erro ao validar cupom" });
  }
};
