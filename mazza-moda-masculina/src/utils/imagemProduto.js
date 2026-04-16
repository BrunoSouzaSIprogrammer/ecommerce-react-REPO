const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const UPLOADS_BASE = `${API_URL}/uploads`;

// Resolve a URL da imagem principal de um produto/item de pedido.
// Aceita o objeto inteiro, lidando com `imagens[0]`, `imagem` (legacy)
// e `image` (compat antiga). Se já vier URL absoluta, retorna como está.
export function imagemProduto(item) {
  if (!item) return null;
  const arq =
    (Array.isArray(item.imagens) && item.imagens[0]) ||
    item.imagem ||
    item.image;
  if (!arq) return null;
  if (/^https?:\/\//i.test(arq)) return arq;
  return `${UPLOADS_BASE}/${arq}`;
}
