import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Base64 of app/icon.png (the hand-pixeled gold sword emblem), embedded directly
// since ImageResponse's Satori renderer can't read local files at request time.
const ICON_B64 =
  "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";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a1026",
          backgroundImage:
            "radial-gradient(circle at 50% 40%, #16224a 0%, #0a1026 70%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${ICON_B64}`}
          width={160}
          height={160}
          alt=""
          style={{ marginBottom: 28 }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: 6,
            color: "#f0c050",
            textShadow: "0 4px 0 #000",
          }}
        >
          SNOW
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 32,
            color: "#e8d9b8",
            letterSpacing: 2,
          }}
        >
          Aman Ahmad — Full-Stack Developer
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 14,
            fontSize: 24,
            color: "#7a6a4a",
          }}
        >
          An explorable pixel-art RPG portfolio
        </div>
      </div>
    ),
    { ...size }
  );
}
