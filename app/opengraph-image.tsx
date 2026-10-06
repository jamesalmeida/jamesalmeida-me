import { ImageResponse } from "next/og";

export const alt = "James Almeida — AI consultant for small businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#f7f5ef",
          color: "#111111",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            opacity: 0.62,
          }}
        >
          jamesalmeida.me
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 84,
            marginTop: 28,
            lineHeight: 1.05,
          }}
        >
          James Almeida
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            marginTop: 28,
            lineHeight: 1.3,
          }}
        >
          AI consultant for small businesses
        </div>
      </div>
    ),
    { ...size },
  );
}
