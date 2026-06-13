export const runtime = "nodejs";

export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 520, margin: "80px auto", padding: "0 24px", color: "#2C3E50" }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Bistro Cloud — Orders API</h1>
      <p style={{ color: "#666", lineHeight: 1.6 }}>
        This is the backend service for bistro-cloud.com order checkout. It has no
        public homepage — only API endpoints. To place an order, visit{" "}
        <a href="https://bistro-cloud.com" style={{ color: "#D94E28" }}>bistro-cloud.com</a>.
      </p>
    </main>
  );
}
