export const getProdutos = async () => {
  const res = await fetch("http://localhost:5000/produtos");
  return res.json();
};