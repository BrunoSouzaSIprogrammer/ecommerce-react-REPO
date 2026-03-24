export default function Hero() {
  return (
    <div style={{
      height: "300px",
      background: "var(--card)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <h1 style={{ fontSize: "32px" }}>
        NOVA COLEÇÃO MAZZA 🔥
      </h1>

      <p style={{ opacity: 0.7 }}>
        Estilo, atitude e presença.
      </p>
    </div>
  );
}