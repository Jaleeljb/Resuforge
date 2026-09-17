// Copies the static assets pdfjs-dist needs (the worker script, character
// maps, and standard font data) into /public so the browser can load them
// same-origin. This runs automatically via "postinstall" so it stays in
// sync whenever pdfjs-dist is installed/updated, including on Vercel.
import { existsSync, mkdirSync, cpSync, copyFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pkgDir = join(root, "node_modules", "pdfjs-dist");
const publicDir = join(root, "public");

if (!existsSync(pkgDir)) {
  console.warn("[copy-pdfjs-assets] pdfjs-dist not found in node_modules, skipping.");
  process.exit(0);
}

mkdirSync(publicDir, { recursive: true });

function copyDir(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}

copyFileSync(join(pkgDir, "build", "pdf.worker.min.mjs"), join(publicDir, "pdf.worker.min.mjs"));
copyDir(join(pkgDir, "cmaps"), join(publicDir, "cmaps"));
copyDir(join(pkgDir, "standard_fonts"), join(publicDir, "standard_fonts"));

console.log("[copy-pdfjs-assets] Copied pdf.worker.min.mjs, cmaps/, and standard_fonts/ into public/.");
