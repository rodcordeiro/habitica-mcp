import fs from "fs";
import path from "path";

const repo = "C:/Users/rodrigo.cordeiro/projetos/personal/habitica-mcp";
const envPath = path.join(repo, ".env");
const mcpPath = path.join(process.env.USERPROFILE, ".cursor/mcp.json");
const skillSrc = path.join(repo, "skills/habitica-rpg");
const skillDest = path.join(process.env.USERPROFILE, ".cursor/skills/habitica-rpg");
const dist = path.join(repo, "dist/index.js").replace(/\//g, "\\");

const envText = fs.readFileSync(envPath, "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}
for (const k of ["HABITICA_USER_ID", "HABITICA_API_TOKEN", "HABITICA_X_CLIENT"]) {
  if (!env[k]) throw new Error("Missing " + k + " in .env");
}

const mcp = JSON.parse(fs.readFileSync(mcpPath, "utf8"));
mcp.mcpServers = mcp.mcpServers || {};
mcp.mcpServers.habitica = {
  command: "C:\\Program Files\\nodejs\\node",
  args: [dist],
  env: {
    HABITICA_USER_ID: env.HABITICA_USER_ID,
    HABITICA_API_TOKEN: env.HABITICA_API_TOKEN,
    HABITICA_X_CLIENT: env.HABITICA_X_CLIENT,
  },
};
fs.writeFileSync(mcpPath, JSON.stringify(mcp, null, 2) + "\n");

fs.mkdirSync(path.dirname(skillDest), { recursive: true });
if (fs.existsSync(skillDest)) {
  fs.rmSync(skillDest, { recursive: true, force: true });
}
fs.symlinkSync(skillSrc, skillDest, "junction");

console.log("ok mcp=habitica skill=junction");
console.log("dist_exists=" + fs.existsSync(dist));
console.log("skill_exists=" + fs.existsSync(path.join(skillDest, "SKILL.md")));
console.log("mcp_has_habitica=" + Boolean(mcp.mcpServers.habitica));
