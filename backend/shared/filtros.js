// ==========================================
// Definição central de categorias e filtros.
// Source of truth compartilhado entre backend
// (validação + listagem) e frontend (renderização
// dinâmica). NÃO duplicar — o frontend importa
// uma cópia espelhada em src/utils/filtros.js.
// Qualquer mudança aqui deve ser refletida lá.
// ==========================================

const CORES = [
  "Azul",
  "Amarelo",
  "Verde",
  "Vermelho",
  "Laranja",
  "Roxo",
  "Preto",
  "Branco",
  "Marrom",
  "Cinza",
];

// 36 ao 56, pulando de 2 em 2 → [36, 38, ..., 56]
const TAMANHOS_NUMERICOS_36_56 = [];
for (let i = 36; i <= 56; i += 2) TAMANHOS_NUMERICOS_36_56.push(String(i));

// 36 ao 48 (shorts)
const TAMANHOS_NUMERICOS_36_48 = [];
for (let i = 36; i <= 48; i += 2) TAMANHOS_NUMERICOS_36_48.push(String(i));

const TAMANHOS_LETRAS = ["P", "M", "G", "GG", "G1", "G2", "G3", "G4"];
const TAMANHOS_LETRAS_REDUZIDO = ["P", "M", "G", "GG"]; // shorts Mauricinho
const TAMANHOS_CALCADOS = ["38", "39", "40", "41", "42", "43"];
const TAMANHOS_BONES = ["P", "M", "Único"];

const CATEGORIAS = [
  {
    id: "camisetas",
    label: "Camisetas",
    icone: "👕",
    filtros: {
      marca: { tipo: "texto" },
      tamanho: { tipo: "multi", opcoes: TAMANHOS_LETRAS },
      cor: { tipo: "multi", opcoes: CORES },
      tipo: {
        tipo: "multi",
        opcoes: [
          "Polo",
          "Oversize",
          "Camisas Premium 30.1",
          "Peruana 40.1",
          "Importadas",
          "Times",
          "Regatas",
        ],
      },
      estampa: { tipo: "bool" },
    },
  },
  {
    id: "blusas",
    label: "Blusas",
    icone: "🧥",
    filtros: {
      marca: { tipo: "texto" },
      tamanho: { tipo: "multi", opcoes: TAMANHOS_LETRAS },
      cor: { tipo: "multi", opcoes: CORES },
      tipo: { tipo: "multi", opcoes: ["Moletom", "Jaquetas", "Bobojaco", "Sueter"] },
      estampa: { tipo: "bool" },
    },
  },
  {
    id: "calcas",
    label: "Calças",
    icone: "👖",
    filtros: {
      marca: { tipo: "texto" },
      tamanho: { tipo: "multi", opcoes: TAMANHOS_NUMERICOS_36_56 },
      cor: { tipo: "multi", opcoes: CORES },
      tipo: { tipo: "multi", opcoes: ["Jeans", "Sarja", "Moletom"] },
    },
  },
  {
    id: "bermudas",
    label: "Bermudas",
    icone: "🩳",
    filtros: {
      marca: { tipo: "texto" },
      tamanho: { tipo: "multi", opcoes: TAMANHOS_NUMERICOS_36_56 },
      cor: { tipo: "multi", opcoes: CORES },
      tipo: { tipo: "multi", opcoes: ["Jeans", "Sarja", "Linho"] },
      estampa: { tipo: "bool" },
    },
  },
  {
    id: "shorts",
    label: "Shorts",
    icone: "🩳",
    // Observação: se tipo === "Mauricinho", a UI deve trocar
    // o conjunto de tamanhos para TAMANHOS_LETRAS_REDUZIDO.
    filtros: {
      marca: { tipo: "texto" },
      tamanho: {
        tipo: "multi",
        opcoes: TAMANHOS_NUMERICOS_36_48,
        opcoesMauricinho: TAMANHOS_LETRAS_REDUZIDO,
      },
      cor: { tipo: "multi", opcoes: CORES },
      tipo: { tipo: "multi", opcoes: ["Mauricinho", "Elastano"] },
      estampa: { tipo: "bool" },
    },
  },
  {
    id: "calcados",
    label: "Calçados",
    icone: "👟",
    filtros: {
      marca: { tipo: "texto" },
      tamanho: { tipo: "multi", opcoes: TAMANHOS_CALCADOS },
      cor: { tipo: "multi", opcoes: CORES },
      tipo: {
        tipo: "multi",
        opcoes: [
          "12Mola",
          "Skatista",
          "TS",
          "TN",
          "Twist",
          "DunkLow",
          "Air Force",
          "Sapatenis",
          "Chinelo",
        ],
      },
    },
  },
  {
    id: "bones",
    label: "Bonés",
    icone: "🧢",
    filtros: {
      marca: { tipo: "texto" },
      tamanho: { tipo: "multi", opcoes: TAMANHOS_BONES },
      cor: { tipo: "multi", opcoes: CORES },
      tipo: { tipo: "multi", opcoes: ["Flex Fit", "Aba Reta", "Presilha", "Fita"] },
    },
  },
  {
    id: "acessorios",
    label: "Acessórios",
    icone: "💍",
    // Acessórios têm uma hierarquia de subtipo (ex: Correntes → Prata 925).
    // Modelado como tipo + subtipo.
    filtros: {
      marca: { tipo: "texto" },
      tipo: {
        tipo: "select",
        opcoes: [
          "Correntes",
          "Pulseiras",
          "Brincos",
          "Piercings",
          "Relógios",
          "Colares",
          "Limpa Pratas",
          "Cuecas",
          "Meias",
          "Cintos",
          "Carteiras",
          "Pochetes",
          "Perfumes",
          "Bags",
          "Óculos",
        ],
      },
      subtipo: {
        tipo: "select",
        // subtipoPor mapeia tipo → lista de subtipos válidos.
        // Tipos não listados aqui não têm subtipo.
        subtipoPor: {
          Correntes: ["Prata 925", "Folheado", "Aço"],
          Pulseiras: ["Prata 925", "Folheado", "Aço", "Couro"],
          Brincos: ["Prata 925", "Folheado", "Aço"],
        },
      },
    },
  },
  {
    // Categoria virtual: filtra por marca === "Cobra D'Água"
    // em produtos de quaisquer categorias base.
    id: "cobra-dagua",
    label: "Cobra D'Água",
    icone: "🐍",
    marcaFixa: "Cobra D'Água",
    filtros: {
      tipo: {
        tipo: "multi",
        opcoes: [
          "Regatas",
          "Polos",
          "Camisetas",
          "Camisas",
          "Shorts Linho",
          "Bonés",
          "Moletom",
          "Jaquetas",
          "Bobojaco",
        ],
      },
      cor: { tipo: "multi", opcoes: CORES },
    },
  },
];

const CATEGORIAS_POR_ID = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]));

const ORDENACOES = [
  { id: "mais-vendidos", label: "Mais vendidos" },
  { id: "menor-preco", label: "Menor preço" },
  { id: "maior-preco", label: "Maior preço" },
];

module.exports = {
  CORES,
  TAMANHOS_LETRAS,
  TAMANHOS_LETRAS_REDUZIDO,
  TAMANHOS_NUMERICOS_36_56,
  TAMANHOS_NUMERICOS_36_48,
  TAMANHOS_CALCADOS,
  TAMANHOS_BONES,
  CATEGORIAS,
  CATEGORIAS_POR_ID,
  ORDENACOES,
};
