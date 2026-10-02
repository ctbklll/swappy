// Usage: node scripts/publish-apk.mjs <path-to.apk> <version> [--notes-th "a|b|c"] [--notes-en "a|b|c"] [--min-android 7.0]
// Copies the APK to public/downloads/ and records size + SHA-256 in src/data/releases.json
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const [apk, version, ...rest] = process.argv.slice(2);
if (!apk || !version) {
  console.error("usage: node scripts/publish-apk.mjs <apk> <version> [--notes-th a|b] [--notes-en a|b] [--min-android 7.0]");
  process.exit(1);
}
const opt = (name) => {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : undefined;
};

const file = `swappy-${version}.apk`;
const dir = path.join("public", "downloads");
mkdirSync(dir, { recursive: true });
copyFileSync(apk, path.join(dir, file));

const buf = readFileSync(path.join(dir, file));
const entry = {
  version,
  date: new Date().toISOString().slice(0, 10),
  file: `/downloads/${file}`,
  sizeBytes: statSync(path.join(dir, file)).size,
  sha256: createHash("sha256").update(buf).digest("hex"),
  minAndroid: opt("--min-android") ?? "7.0",
  notes: { th: [], en: [] },
};

const dbPath = path.join("src", "data", "releases.json");
const list = existsSync(dbPath) ? JSON.parse(readFileSync(dbPath, "utf8")) : [];
const prev = list.find((r) => r.version === version);
entry.notes = {
  th: opt("--notes-th")?.split("|") ?? prev?.notes.th ?? [],
  en: opt("--notes-en")?.split("|") ?? prev?.notes.en ?? [],
};
const next = [entry, ...list.filter((r) => r.version !== version)].sort((a, b) =>
  b.version.localeCompare(a.version, undefined, { numeric: true }),
);
writeFileSync(dbPath, JSON.stringify(next, null, 2) + "\n");
console.log(`Published ${file}: ${(entry.sizeBytes / 1048576).toFixed(1)} MB, sha256 ${entry.sha256}`);
