import { ImageResponse } from "next/og";

export const alt = "Forge developer toolkit and workflow workspace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #15181e 0%, #1d222a 58%, #121419 100%)",
        color: "#f7f1e8",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          opacity: 0.16,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 620,
          height: 620,
          right: -170,
          top: -250,
          display: "flex",
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(218, 132, 74, 0.42), rgba(218, 132, 74, 0))",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 420,
          height: 420,
          left: -210,
          bottom: -250,
          display: "flex",
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(89, 107, 131, 0.3), rgba(89, 107, 131, 0))",
        }}
      />

      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 76px 58px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 68,
              height: 68,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              borderRadius: 16,
              background: "linear-gradient(145deg, #dc8a52, #a94f2c)",
              boxShadow: "0 16px 40px rgba(192, 91, 47, 0.28)",
            }}
          >
            <div
              style={{
                width: 9,
                height: 40,
                display: "flex",
                position: "absolute",
                borderRadius: 5,
                background: "#fff8ee",
                transform: "rotate(-42deg) translate(7px, 5px)",
              }}
            />
            <div
              style={{
                width: 41,
                height: 11,
                display: "flex",
                position: "absolute",
                borderRadius: 5,
                background: "#fff8ee",
                transform: "rotate(-42deg) translate(0, -11px)",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 34, fontWeight: 750, letterSpacing: -1 }}>Forge</span>
            <span
              style={{
                marginTop: 4,
                color: "#d79261",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              Developer workshop
            </span>
          </div>
        </div>

        <div style={{ width: 920, display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 70,
              lineHeight: 1.02,
              fontWeight: 750,
              letterSpacing: -3.5,
            }}
          >
            Everything a developer needs, in one tab.
          </div>
          <div
            style={{
              width: 850,
              display: "flex",
              color: "#aeb6c2",
              fontSize: 25,
              lineHeight: 1.35,
            }}
          >
            Browser-native utilities, Kanban time tracking, bookmarks, resources, webhooks, and
            uptime monitoring.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: "#8f99a8",
            fontSize: 17,
            letterSpacing: 1,
          }}
        >
          <span style={{ color: "#d9824d" }}>forge /</span>
          <span>build</span>
          <span style={{ color: "#59616d" }}>•</span>
          <span>test</span>
          <span style={{ color: "#59616d" }}>•</span>
          <span>ship</span>
        </div>
      </div>
    </div>,
    size,
  );
}
