export function animateToCart(event) {
  const button = event.currentTarget;
  const cart = document.getElementById("cart-icon");

  if (!cart) return;

  const buttonRect = button.getBoundingClientRect();
  const cartRect = cart.getBoundingClientRect();

  const clone = button.cloneNode(true);

  clone.style.position = "fixed";
  clone.style.top = `${buttonRect.top}px`;
  clone.style.left = `${buttonRect.left}px`;
  clone.style.width = `${buttonRect.width}px`;
  clone.style.zIndex = 1000;
  clone.style.transition = "all 0.6s ease-in-out";
  clone.style.pointerEvents = "none";

  document.body.appendChild(clone);

  setTimeout(() => {
    clone.style.top = `${cartRect.top}px`;
    clone.style.left = `${cartRect.left}px`;
    clone.style.transform = "scale(0.3)";
    clone.style.opacity = "0.5";
  }, 10);

  setTimeout(() => {
    clone.remove();
  }, 700);
}