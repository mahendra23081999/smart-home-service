/** @type {import('next').NextConfig} */
export default {
  // NEXT_DIST_DIR lets a production build run without clobbering a running dev server's .next folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Photos in public/images are served as AVIF/WebP at the right size for each screen.
  images: { formats: ["image/avif", "image/webp"] },
};
