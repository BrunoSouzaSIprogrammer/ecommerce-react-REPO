// Apaga dados transacionais de teste e zera contadores em produtos.
// Uso: node scripts/limparTestes.js
//
// Operações (todas exigem confirmação interativa antes de executar):
//   1. Apaga TODOS os documentos das coleções: pedidos, favoritos, cupons.
//      Avaliações ficam embutidas em pedidos, então saem junto.
//   2. Zera o campo `vendidos` em todos os produtos (mantém o restante).
//
// NÃO mexe em: produtos (exceto `vendidos`), users, banners.

const path = require("path");
const readline = require("readline");

// Carrega .env do diretório do backend, igual ao server.js.
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const db = require("../config/firebase");

const COLECOES_PARA_LIMPAR = ["pedidos", "favoritos", "cupons"];
const BATCH_SIZE = 400; // Firestore: limite 500 ops por batch.

function pergunta(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
}

async function apagarColecao(nome) {
  const ref = db.collection(nome);
  let totalApagados = 0;

  while (true) {
    const snap = await ref.limit(BATCH_SIZE).get();
    if (snap.empty) break;

    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    totalApagados += snap.size;
    console.log(`  • ${nome}: apagados ${totalApagados} documento(s)...`);

    if (snap.size < BATCH_SIZE) break;
  }

  return totalApagados;
}

async function zerarVendidosDosProdutos() {
  const snap = await db.collection("produtos").get();
  if (snap.empty) {
    console.log("  • produtos: nenhum produto encontrado.");
    return 0;
  }

  let atualizados = 0;
  let batch = db.batch();
  let opsNoBatch = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (Number(data.vendidos || 0) === 0) continue;

    batch.update(doc.ref, { vendidos: 0 });
    opsNoBatch += 1;
    atualizados += 1;

    if (opsNoBatch >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      opsNoBatch = 0;
    }
  }

  if (opsNoBatch > 0) await batch.commit();

  console.log(`  • produtos: campo 'vendidos' resetado em ${atualizados} produto(s).`);
  return atualizados;
}

async function main() {
  console.log("\n=== LIMPEZA DE DADOS DE TESTE ===\n");
  console.log("Será apagado:");
  COLECOES_PARA_LIMPAR.forEach((c) => console.log(`  - todos os documentos da coleção '${c}'`));
  console.log("  - campo 'vendidos' será zerado em todos os produtos");
  console.log("\nIntocados: produtos (exceto 'vendidos'), users, banners.\n");

  const resp = await pergunta('Digite exatamente "SIM APAGAR" para confirmar: ');
  if (resp.trim() !== "SIM APAGAR") {
    console.log("Cancelado. Nada foi apagado.");
    process.exit(0);
  }

  console.log("\nIniciando limpeza...\n");

  for (const nome of COLECOES_PARA_LIMPAR) {
    const total = await apagarColecao(nome);
    console.log(`  ✔ ${nome}: ${total} documento(s) removido(s).\n`);
  }

  await zerarVendidosDosProdutos();

  console.log("\n✔ Limpeza concluída. O sistema está pronto para receber compras reais.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("\nERRO durante a limpeza:", err);
  process.exit(1);
});
