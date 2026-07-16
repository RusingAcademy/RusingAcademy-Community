import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx",
]);

const rules = [
  { id: "google-api-key", pattern: /AIza[0-9A-Za-z_-]{20,}/g },
  { id: "aws-access-key", pattern: /AKIA[0-9A-Z]{16}/g },
  { id: "github-token", pattern: /gh[pousr]_[0-9A-Za-z]{20,}/g },
  { id: "stripe-live-secret", pattern: /sk_live_[0-9A-Za-z]{16,}/g },
  {
    id: "private-key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  { id: "direct-tenor-key-reference", pattern: /TENOR_API_KEY/g },
  { id: "direct-tenor-upstream", pattern: /tenor\.googleapis\.com\/v2/g },
];

function collectFiles(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = resolve(directory, entry);
    if (statSync(path).isDirectory()) files.push(...collectFiles(path));
    else if (textExtensions.has(extname(entry).toLowerCase())) files.push(path);
  }
  return files;
}

export function scanText(text) {
  return rules
    .filter(rule => {
      rule.pattern.lastIndex = 0;
      return rule.pattern.test(text);
    })
    .map(rule => rule.id);
}

export function scanClientArtifacts() {
  const findings = [];
  const clientFiles = collectFiles(resolve(projectRoot, "client"));
  const bundleFiles = collectFiles(
    resolve(projectRoot, "dist", "public")
  ).filter(file =>
    /(?:^|[\\/])index(?:[-.][^\\/]*)?\.(?:html|js|css)$/.test(file)
  );

  // Vite emits many third-party language/wasm chunks whose encoded grammars can
  // coincidentally match provider prefixes. Application entry bundles are the
  // relevant surface for this component and avoid those known false positives.
  for (const file of [...clientFiles, ...bundleFiles]) {
    const matches = scanText(readFileSync(file, "utf8"));
    for (const rule of matches) {
      findings.push({ file: relative(projectRoot, file), rule });
    }
  }
  return findings;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const findings = scanClientArtifacts();
  if (findings.length > 0) {
    console.error("Client secret guard failed. Matched rule IDs and paths:");
    for (const finding of findings) {
      console.error(`- ${finding.rule}: ${finding.file}`);
    }
    process.exit(1);
  }
  console.log("Client secret guard passed.");
}
