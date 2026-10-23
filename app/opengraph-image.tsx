import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { HEADLINES, PROMPT_EXAMPLES, SITE } from "@/data/site";

export const alt = SITE.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The link preview (Open Graph and X): the landing in one picture. Skaffen, the
// name, the question and the composer, in the site's colours. The serif stands in
// for the site's Iowan Old Style, which isn't free to embed. Fonts are static,
// Latin-only cuts of Source Serif 4 and Inter (SIL OFL) in assets/og.
const BACKGROUND = "#f7f5ef";
const INK = "#111111";
const MUTED = "rgba(17, 17, 17, 0.6)";
const ACCENT = "#2f4858";

// Skaffen's default look (SITE.assistant.avatar: slate squircle, tall white eyes),
// drawn with boxes at `size` px, in the proportions agent-avatars uses.
function Skaffen({ size: body }: { size: number }) {
  const k = body / 150;
  const eye = { width: 20 * k, height: 36 * k, borderRadius: 10 * k, background: "#ffffff" };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 26 * k,
        width: body,
        height: body,
        borderRadius: body * 0.38,
        backgroundColor: ACCENT,
        backgroundImage:
          "radial-gradient(circle at 28% 22%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.34) 100%)",
        boxShadow: "0 24px 60px rgba(17, 17, 17, 0.18)",
      }}
    >
      <div style={{ display: "flex", ...eye, transform: `translate(${-8 * k}px, ${2 * k}px)` }} />
      <div style={{ display: "flex", ...eye, transform: `translate(${-8 * k}px, ${2 * k}px)` }} />
    </div>
  );
}

export default async function OpenGraphImage() {
  const fonts = join(process.cwd(), "assets/og");
  const [serif, sans, sansMedium] = await Promise.all([
    readFile(join(fonts, "SourceSerif4-Display.ttf")),
    readFile(join(fonts, "Inter-Regular.ttf")),
    readFile(join(fonts, "Inter-Medium.ttf")),
  ]);
  const headline = HEADLINES[0];
  const [before, after] = headline.split("AI");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: BACKGROUND,
          backgroundImage: "radial-gradient(circle at 85% 20%, rgba(47,72,88,0.10) 0%, rgba(47,72,88,0) 45%)",
          color: INK,
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Skaffen size={64} />
          <div style={{ display: "flex", fontFamily: "Source Serif", fontSize: 38, letterSpacing: -0.5 }}>
            {SITE.name}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 22, width: 780 }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Source Serif",
                flexWrap: "wrap",
                fontSize: 104,
                lineHeight: 1.02,
                letterSpacing: -2.5,
              }}
            >
              {/* One span per word with a margin: the renderer drops spaces next to an inline span. */}
              {[...before.trim().split(" "), "AI", ...after.trim().split(" ")].map((word, index) => (
                <span key={index} style={{ marginRight: 26, color: word === "AI" ? ACCENT : INK }}>
                  {word}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", fontSize: 30, lineHeight: 1.4, color: MUTED }}>
              AI for individuals and small teams, at your own pace.
            </div>
          </div>
          <Skaffen size={200} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: 760,
              height: 84,
              padding: "0 12px 0 34px",
              borderRadius: 42,
              background: "#ffffff",
              border: "1px solid rgba(17, 17, 17, 0.14)",
              boxShadow: "0 18px 48px rgba(0, 0, 0, 0.07)",
            }}
          >
            <div style={{ display: "flex", fontSize: 28, color: MUTED }}>Try “{PROMPT_EXAMPLES[0]}”</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 60,
                height: 60,
                borderRadius: 30,
                background: ACCENT,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 19V5M5 12l7-7 7 7" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div style={{ display: "flex", fontFamily: "Inter Medium", fontSize: 26, color: MUTED }}>jamesalmeida.me</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Source Serif", data: serif, weight: 400, style: "normal" },
        { name: "Inter", data: sans, weight: 400, style: "normal" },
        { name: "Inter Medium", data: sansMedium, weight: 500, style: "normal" },
      ],
    },
  );
}
