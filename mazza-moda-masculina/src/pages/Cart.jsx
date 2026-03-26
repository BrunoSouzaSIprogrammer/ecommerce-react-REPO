import { useCart } from "../context/CartContext";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, total } = useCart();

  return (
    <div>
      <h1>Carrinho</h1>

      {cart.length === 0 && <p>Carrinho vazio</p>}

      {cart.map((item) => (
        <div key={item.id}>
          <h3>{item.nome}</h3>
          <p>R$ {item.preco}</p>

          <input
            type="number"
            value={item.quantity}
            onChange={(e) =>
              updateQuantity(item.id, Number(e.target.value))
            }
          />

          <button onClick={() => removeFromCart(item.id)}>
            Remover
          </button>
        </div>
      ))}

      <h2>Total: R$ {total}</h2>
    </div>
  );
}