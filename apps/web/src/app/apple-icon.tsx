import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#c8f24a",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "relative",
          width: 92,
          height: 92,
          transform: "rotate(45deg)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 38,
            top: 8,
            width: 16,
            height: 62,
            background: "#24380f",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 14,
            top: 8,
            width: 64,
            height: 18,
            background: "#24380f",
          }}
        />
      </div>
    </div>,
    size,
  );
}
