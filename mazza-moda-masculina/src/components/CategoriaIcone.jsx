// SVGs inline por categoria. Todos usam `currentColor` para seguir o tema.
// Usado em chips, tabs, badges e títulos. Não funciona em <option> (HTML puro).

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const ICONES = {
  camisetas: (
    <svg {...baseProps}>
      <path d="M8 3l-5 3 2 4 3-1v12h12V9l3 1 2-4-5-3-3 2c-.7.6-1.7 1-3 1s-2.3-.4-3-1L8 3z" />
    </svg>
  ),
  blusas: (
    <svg {...baseProps}>
      <path d="M7 3l-4 4 2 4 3-1v13h12V10l3 1 2-4-4-4-2 2c-1 1-2.5 1.5-4 1.5S9 6 8 5L7 3z" />
      <path d="M12 7v15" />
    </svg>
  ),
  calcas: (
    <svg {...baseProps}>
      <path d="M5 3h14l-1 6-2 12h-3l-1-9-1 9H8L6 9 5 3z" />
      <path d="M5 3h14" />
    </svg>
  ),
  bermudas: (
    <svg {...baseProps}>
      <path d="M5 3h14l-.5 5-1.5 9h-3l-1-7-1 7H8L6.5 8 5 3z" />
      <path d="M5 3h14" />
    </svg>
  ),
  shorts: (
    <svg {...baseProps}>
      <path d="M5 3h14l-.5 5-1.5 9h-3l-1-7-1 7H8L6.5 8 5 3z" />
      <path d="M5 3h14" />
    </svg>
  ),
  calcados: (
    <svg {...baseProps}>
      <path d="M2 16c0-2 1-3 3-3l4-1 3-4 4 1c2 .5 4 2 5 4l1 3c.3 1-.4 2-1.4 2H4c-1.1 0-2-.9-2-2z" />
      <path d="M9 12l2 2M14 9l2 2" />
    </svg>
  ),
  bones: (
    <svg {...baseProps}>
      <path d="M3 16c0-5 4-9 9-9s9 4 9 9" />
      <path d="M3 16h18l1 3H2l1-3z" />
      <path d="M12 7V4" />
    </svg>
  ),
  acessorios: (
    <svg {...baseProps}>
      <circle cx="12" cy="14" r="6" />
      <path d="M9 8l3-5 3 5" />
    </svg>
  ),
  "cobra-dagua": (
    <svg {...baseProps}>
      <path d="M4 18c2-1 3-3 3-5s-1-4-3-5c3-1 6 1 6 4s-2 4-2 6 2 3 4 3 5-2 5-5" />
      <circle cx="18" cy="9" r="1" fill="currentColor" />
      <path d="M19 8l1-1" />
    </svg>
  ),
};

export default function CategoriaIcone({
  categoria,
  size = 20,
  className,
  style,
}) {
  const svg = ICONES[categoria];
  if (!svg) return null;
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        lineHeight: 0,
        ...style,
      }}
      aria-hidden="true"
    >
      {svg}
    </span>
  );
}
