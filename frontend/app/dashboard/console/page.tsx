"use client";
import { useState } from "react";

type Tab = "simulate" | "collision" | "raycast" | "constraint" | "stats";

const DEFAULTS: Record<Tab, string> = {
  simulate: JSON.stringify(
    {
      scene_id: "scene-0001",
      bodies: [
        { id: "box-a", mass: 1.0, position: [0, 5, 0], velocity: [0, 0, 0], shape: "box", half_extents: [0.5, 0.5, 0.5] },
        { id: "floor", mass: 0.0, position: [0, 0, 0], velocity: [0, 0, 0], shape: "plane", normal: [0, 1, 0] },
      ],
      gravity: [0, -9.81, 0],
      dt: 0.016,
      steps: 300,
    },
    null,
    2
  ),
  collision: JSON.stringify(
    {
      body_a: { shape: "sphere", radius: 1.0, position: [0, 0, 0] },
      body_b: { shape: "box", half_extents: [1.0, 1.0, 1.0], position: [1.5, 0, 0] },
      compute_contact: true,
    },
    null,
    2
  ),
  raycast: JSON.stringify(
    {
      scene_id: "scene-0001",
      ray: {
        origin: [0, 10, 0],
        direction: [0, -1, 0],
        max_distance: 100.0,
      },
      filter_mask: "all",
      return_normal: true,
    },
    null,
    2
  ),
  constraint: JSON.stringify(
    {
      scene_id: "scene-0001",
      constraint: {
        type: "hinge",
        body_a: "box-a",
        body_b: "box-b",
        pivot_a: [0, -0.5, 0],
        pivot_b: [0, 0.5, 0],
        axis: [0, 0, 1],
        limits: { lower: -1.5708, upper: 1.5708 },
      },
    },
    null,
    2
  ),
  stats: JSON.stringify({}, null, 2),
};

const ENDPOINTS: Record<Tab, { method: string; path: string }> = {
  simulate: { method: "POST", path: "/api/v1/physics/simulate" },
  collision: { method: "POST", path: "/api/v1/physics/collision" },
  raycast: { method: "POST", path: "/api/v1/physics/raycast" },
  constraint: { method: "POST", path: "/api/v1/physics/constraint" },
  stats: { method: "GET", path: "/api/v1/stats" },
};

const TAB_LABELS: Record<Tab, string> = {
  simulate: "Simulate",
  collision: "Collision",
  raycast: "Raycast",
  constraint: "Constraint",
  stats: "Stats",
};

export default function ConsolePage() {
  const [activeTab, setActiveTab] = useState<Tab>("simulate");
  const [inputs, setInputs] = useState<Record<Tab, string>>(DEFAULTS);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const API = "http://localhost:8081";

  const send = async () => {
    setLoading(true);
    setResponse("");
    const { method, path } = ENDPOINTS[activeTab];
    try {
      const opts: RequestInit = { method, headers: { "Content-Type": "application/json" } };
      if (method === "POST") opts.body = inputs[activeTab];
      const res = await fetch(`${API}${path}`, opts);
      setResponse(JSON.stringify(await res.json(), null, 2));
    } catch (e: unknown) {
      setResponse(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(false);
  };

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    padding: "8px 16px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: activeTab === tab ? 700 : 400,
    background: activeTab === tab ? "#ff6b35" : "#1a1a2e",
    color: activeTab === tab ? "#000" : "#aaa",
  });

  return (
    <div style={{ padding: 24, fontFamily: "monospace", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <h1 style={{ color: "#ff6b35", marginBottom: 8 }}>ALICE Physics-Cloud — Console</h1>
      <p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>
        Cloud physics simulation · API: {API}
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
          <button key={tab} style={tabStyle(tab)} onClick={() => setActiveTab(tab)}>
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 8, fontSize: 12, color: "#666" }}>
        {ENDPOINTS[activeTab].method} {ENDPOINTS[activeTab].path}
      </div>

      <textarea
        value={inputs[activeTab]}
        onChange={(e) => setInputs((prev) => ({ ...prev, [activeTab]: e.target.value }))}
        rows={12}
        style={{
          width: "100%",
          fontFamily: "monospace",
          fontSize: 13,
          background: "#111",
          color: "#e0e0e0",
          border: "1px solid #333",
          borderRadius: 6,
          padding: 12,
          boxSizing: "border-box",
        }}
        placeholder={ENDPOINTS[activeTab].method === "GET" ? "// GET request — no body needed" : "// JSON payload"}
      />

      <button
        onClick={send}
        disabled={loading}
        style={{
          marginTop: 8,
          padding: "10px 24px",
          background: loading ? "#333" : "#ff6b35",
          color: loading ? "#666" : "#000",
          border: "none",
          borderRadius: 6,
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "monospace",
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        {loading ? "Sending..." : "Send"}
      </button>

      <pre
        style={{
          background: "#111",
          color: "#0f0",
          padding: 16,
          marginTop: 16,
          minHeight: 200,
          overflow: "auto",
          borderRadius: 6,
          border: "1px solid #1a3a1a",
          fontSize: 13,
        }}
      >
        {response || "// Response will appear here"}
      </pre>
    </div>
  );
}
