import { ImageResponse } from "next/og";
import { APPLE_MARK_PATH, APPLE_MARK_VIEWBOX } from "@/components/landing/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The iOS home-screen icon: a black rounded square with the white mark. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          borderRadius: 40,
        }}
      >
        <svg width={116} height={116} viewBox={APPLE_MARK_VIEWBOX} fill="#ffffff">
          <path d={APPLE_MARK_PATH} />
        </svg>
      </div>
    ),
    size
  );
}
