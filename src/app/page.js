/**
 * Homepage placeholder.
 *
 * Replace this file with your actual frontend homepage.
 * The admin portal is available at /admin once the backend is configured.
 */
export default function HomePage() {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 600,
        margin: "80px auto",
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16 }}>
        Global Backend is Ready
      </h1>
      <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 32 }}>
        Replace this file with your own homepage. The admin and CRM portals are
        live at the links below.
      </p>
      <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
        <a
          href="/admin"
          style={{
            padding: "10px 24px",
            background: "#1b1b1b",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Admin Portal →
        </a>
        <a
          href="/crm"
          style={{
            padding: "10px 24px",
            background: "#4f46e5",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          CRM Portal →
        </a>
      </div>
    </main>
  );
}
