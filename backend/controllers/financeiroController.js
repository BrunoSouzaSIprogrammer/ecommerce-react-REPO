const db = require("../config/firebase");

const COMISSAO_PADRAO = Number(process.env.COMISSAO_PADRAO || 5);

function inicioDoDia(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function chaveDia(date) {
  const d = inicioDoDia(date);
  return d.toISOString().slice(0, 10);
}

function filtrarPorPeriodo(pedidos, periodo) {
  if (periodo === "all") return pedidos;
  const dias = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
  const limite = Date.now() - dias * 24 * 60 * 60 * 1000;
  return pedidos.filter((p) => {
    const ts = p.pagoEm || p.criadoEm;
    if (!ts) return false;
    return new Date(ts).getTime() >= limite;
  });
}

exports.resumo = async (req, res) => {
  try {
    const periodo = req.query.periodo || "30d";

    const snapshot = await db.collection("pedidos").get();
    const todosPedidos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    const pagos = todosPedidos.filter((p) => p.statusPagamento === "pago");
    const pagosNoPeriodo = filtrarPorPeriodo(pagos, periodo);

    const totalVendas = pagosNoPeriodo.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
    const totalPedidos = pagosNoPeriodo.length;
    const ticketMedio = totalPedidos ? totalVendas / totalPedidos : 0;

    const comissaoAdmin = totalVendas * (COMISSAO_PADRAO / 100);
    const valorLiquidoSeller = totalVendas - comissaoAdmin;

    // vendas por dia (últimos 30 dias, independente do período — pra gráfico padrão)
    const diasGrafico = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
    const hoje = inicioDoDia(new Date());
    const vendasPorDia = [];
    for (let i = diasGrafico - 1; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(d.getDate() - i);
      const key = chaveDia(d);
      const pedidosDoDia = pagos.filter((p) => {
        const ts = p.pagoEm || p.criadoEm;
        return ts && chaveDia(new Date(ts)) === key;
      });
      const total = pedidosDoDia.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
      vendasPorDia.push({
        data: key,
        total,
        pedidos: pedidosDoDia.length,
      });
    }

    // top produtos (por receita e unidades)
    const contagemProdutos = new Map();
    pagosNoPeriodo.forEach((pedido) => {
      (pedido.itens || []).forEach((item) => {
        const id = item.produtoId || item.id;
        if (!id) return;
        const atual = contagemProdutos.get(id) || {
          produtoId: id,
          nome: item.nome || "Produto",
          unidades: 0,
          receita: 0,
        };
        atual.unidades += Number(item.quantidade) || 1;
        atual.receita += (Number(item.preco) || 0) * (Number(item.quantidade) || 1);
        contagemProdutos.set(id, atual);
      });
    });
    const topProdutos = Array.from(contagemProdutos.values())
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 5);

    // distribuição por status (todos os pedidos, sem filtro de período)
    const statusCount = {};
    todosPedidos.forEach((p) => {
      const s = p.status || "indefinido";
      statusCount[s] = (statusCount[s] || 0) + 1;
    });

    // pedidos pendentes (não pagos) — sinaliza receita a realizar
    const pendentes = todosPedidos.filter(
      (p) => p.statusPagamento === "pendente" || p.statusPagamento === "aguardando"
    );
    const receitaPendente = pendentes.reduce((acc, p) => acc + (Number(p.total) || 0), 0);

    res.json({
      periodo,
      comissaoPercentual: COMISSAO_PADRAO,
      totalVendas,
      totalPedidos,
      ticketMedio,
      comissaoAdmin,
      valorLiquidoSeller,
      receitaPendente,
      pedidosPendentes: pendentes.length,
      vendasPorDia,
      topProdutos,
      statusCount,
    });
  } catch (error) {
    console.error("Erro ao gerar resumo financeiro:", error);
    res.status(500).json({ erro: "Erro ao gerar resumo financeiro" });
  }
};
