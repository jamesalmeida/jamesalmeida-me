// The link preview's image and video: files made in /admin → Settings → Share card
// and committed to public/og. A page that sets its own `openGraph` replaces the
// layout's whole object, so every page spreads OG_MEDIA into it.

import { SITE } from "@/data/site";

export const OG_IMAGE = {
  url: "/og/og-image.png",
  width: 1200,
  height: 630,
  alt: SITE.title,
  type: "image/png",
};

// Absolute: Next resolves image URLs against metadataBase but not video URLs.
export const OG_VIDEO = {
  url: `${SITE.url}/og/og-video.mp4`,
  secureUrl: `${SITE.url}/og/og-video.mp4`,
  width: 1200,
  height: 630,
  type: "video/mp4",
};

export const OG_MEDIA = { images: [OG_IMAGE], videos: [OG_VIDEO] };
