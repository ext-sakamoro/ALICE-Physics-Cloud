export default function LandingPage() {
  const features = [
    {
      title: "Rigid Body Dynamics",
      description:
        "Full 6-DOF rigid body simulation with impulse-based solver, sleeping bodies, and continuous collision detection.",
    },
    {
      title: "Collision Detection",
      description:
        "GJK/EPA narrow phase for convex shapes, BVH broad phase, and exact contact manifold computation.",
    },
    {
      title: "Raycasting",
      description:
        "Scene-graph raycasting with filter masks, normal computation, and multi-hit sorted results in sub-millisecond latency.",
    },
    {
      title: "Constraint Solver",
      description:
        "Hinge, ball-socket, slider, and fixed joints with configurable limits, motors, and spring-damper parameters.",
    },
    {
      title: "Scene Management",
      description:
        "Persistent named scenes with incremental state updates. Snapshot and replay any simulation frame.",
    },
    {
      title: "Cloud-Native Scale",
      description:
        "Stateless workers scale horizontally. Deterministic simulation replay with bit-exact cross-node results.",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a, #1a0d00)",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <header
        style={{
          padding: "24px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #ffffff10",
        }}
      >
        <h2 style={{ margin: 0, color: "#ff6b35" }}>ALICE Physics-Cloud</h2>
        <a href="/dashboard/console" style={{ color: "#ff6b35", textDecoration: "none", fontWeight: 600 }}>
          Console →
        </a>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            background: "#ff6b3520",
            color: "#ff6b35",
            borderRadius: 20,
            padding: "4px 16px",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 24,
            letterSpacing: 1,
          }}
        >
          CLOUD PHYSICS SIMULATION
        </div>

        <h1 style={{ fontSize: 48, marginBottom: 16, lineHeight: 1.1 }}>
          Physics Simulation
          <br />
          <span style={{ color: "#ff6b35" }}>as a Cloud API</span>
        </h1>

        <p style={{ fontSize: 20, color: "#aaa", marginBottom: 48, maxWidth: 600, margin: "0 auto 48px" }}>
          Rigid body dynamics, collision detection, raycasting, and constraint solving — serverless, deterministic, and sub-millisecond.
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 80 }}>
          <a
            href="/dashboard/console"
            style={{
              background: "#ff6b35",
              color: "#000",
              padding: "14px 32px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Open Console
          </a>
          <a
            href="#features"
            style={{
              background: "#ffffff10",
              color: "#fff",
              padding: "14px 32px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Learn More
          </a>
        </div>

        <div
          id="features"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
            textAlign: "left",
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: "#ffffff08",
                borderRadius: 12,
                padding: 24,
                border: "1px solid #ffffff10",
              }}
            >
              <h3 style={{ margin: "0 0 12px", color: "#ff6b35", fontSize: 16 }}>{f.title}</h3>
              <p style={{ color: "#aaa", margin: 0, lineHeight: 1.6, fontSize: 14 }}>{f.description}</p>
            </div>
          ))}
        </div>
      </main>

      <footer style={{ textAlign: "center", padding: "32px", borderTop: "1px solid #ffffff10", color: "#444", fontSize: 12 }}>
        ALICE Physics-Cloud · AGPL-3.0-or-later · Project A.L.I.C.E.
      </footer>
    </div>
  );
}
