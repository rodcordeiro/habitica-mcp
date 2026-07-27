import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");
const dist = path.join(root, "dist", "index.js");

if (!fs.existsSync(dist)) {
  console.error("dist/index.js ausente. Rode pnpm build antes.");
  process.exit(1);
}

const env = { ...process.env };
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
}

for (const key of ["HABITICA_USER_ID", "HABITICA_API_TOKEN", "HABITICA_X_CLIENT"]) {
  if (!env[key]) {
    console.error(`Variável ausente: ${key}`);
    process.exit(1);
  }
}

const methodArgs = process.argv.slice(2);
const args = ["dlx", "@modelcontextprotocol/inspector", "--cli", "node", dist, ...methodArgs];

const result = spawnSync("pnpm", args, {
  cwd: root,
  env,
  encoding: "utf8",
  shell: true,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
