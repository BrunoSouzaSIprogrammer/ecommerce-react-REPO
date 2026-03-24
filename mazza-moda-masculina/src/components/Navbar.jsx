import useTheme from "../hooks/useTheme";

export default function Navbar() {
  const { theme, setTheme } = useTheme();

  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 40px",
      background: "var(--card)",
      borderBottom: "1px solid var(--border)"
    }}>
      <h1 style={{ color: "var(--primary)", fontWeight: "bold" }}>
        MAZZA
      </h1>

      <input
        placeholder="Buscar produtos..."
        style={{
          padding: "10px",
          borderRadius: "8px",
          border: "none",
          width: "300px"
        }}
      />

        <div>
        🛒 👤
        </div>

      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        🌙
      </button>
    </nav>
  );
}