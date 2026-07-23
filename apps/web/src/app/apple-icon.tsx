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
        position: "relative",
        borderRadius: 36,
        background: "linear-gradient(145deg, #dc8a52, #9f4729)",
      }}
    >
      <div
        style={{
          width: 22,
          height: 102,
          display: "flex",
          position: "absolute",
          borderRadius: 11,
          background: "#fff8ee",
          transform: "rotate(-42deg) translate(17px, 12px)",
        }}
      />
      <div
        style={{
          width: 104,
          height: 27,
          display: "flex",
          position: "absolute",
          borderRadius: 12,
          background: "#fff8ee",
          transform: "rotate(-42deg) translate(0, -28px)",
        }}
      />
    </div>,
    size,
  );
}
