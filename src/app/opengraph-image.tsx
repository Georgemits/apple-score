import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import {
  APPLE_MARK_PATH,
  APPLE_MARK_VIEWBOX,
  FORMULA,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/components/landing/brand";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function font(file: string) {
  return readFile(path.join(process.cwd(), "src/assets/fonts", file));
}

/** The 1200×630 card shown when a link to the site is shared. */
export default async function OpenGraphImage() {
  const [bold, regular] = await Promise.all([font("Inter-Bold.otf"), font("Inter-Regular.otf")]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0a0a0b 0%, #121218 55%, #0b1a33 100%)",
          color: "#ffffff",
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -160,
            width: 640,
            height: 640,
            borderRadius: 640,
            background:
              "radial-gradient(circle at center, rgba(41,151,255,0.45) 0%, rgba(41,151,255,0) 65%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -260,
            left: -120,
            width: 560,
            height: 560,
            borderRadius: 560,
            background:
              "radial-gradient(circle at center, rgba(187,78,255,0.32) 0%, rgba(187,78,255,0) 65%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width={56} height={56} viewBox={APPLE_MARK_VIEWBOX} fill="#ffffff">
            <path d={APPLE_MARK_PATH} />
          </svg>
          <div style={{ marginLeft: 18, fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 92,
              fontWeight: 700,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            {SITE_TAGLINE}
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 34,
              fontWeight: 400,
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.3,
              maxWidth: 980,
            }}
          >
            Every dollar you have spent on Apple hardware, added up and ranked.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            alignItems: "center",
            padding: "18px 28px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(255,255,255,0.06)",
            fontSize: 28,
            fontWeight: 400,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          {FORMULA}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: bold, weight: 700, style: "normal" },
        { name: "Inter", data: regular, weight: 400, style: "normal" },
      ],
    }
  );
}
