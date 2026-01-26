require("./checkNode");
require("./lock");

const { spawn, exec, execSync } = require("child_process");
const path = require("path");

const projectPath = path.resolve(__dirname, "..");
const mode = (process.argv[2] || "dev").toLowerCase();

if (mode === "prod") {
  console.log("🏗️ Construindo backend...");
  execSync("npm run build --prefix backend", { cwd: projectPath, stdio: "inherit" });

  console.log("🚀 Iniciando backend (porta 3333)...");
  spawn("npm", ["run", "start:prod", "--prefix", "backend"], {
    cwd: projectPath,
    stdio: "ignore",
    shell: true,
    detached: true,
    windowsHide: true
  }).unref();

  console.log("🏗️ Construindo frontend...");
  execSync("npm run build --prefix frontend", { cwd: projectPath, stdio: "inherit" });

  console.log("🚀 Iniciando frontend (preview, porta 5173)...");
  spawn("npm", ["run", "preview", "--prefix", "frontend", "--", "--port", "5173"], {
    cwd: projectPath,
    stdio: "ignore",
    shell: true,
    detached: true,
    windowsHide: true
  }).unref();

  setTimeout(() => {
    console.log("🌐 Abrindo aplicação no navegador...");
    exec(`start "" "http://localhost:5173"`);
  }, 4000);
} else {
  // ----------------------
  // Backend (dev)
  // ----------------------
  console.log("🚀 Iniciando backend (porta 3333)...");
  spawn("npm", ["run", "dev", "--prefix", "backend"], {
    cwd: projectPath,
    stdio: "ignore",
    shell: true,
    detached: true,
    windowsHide: true
  }).unref();

  // ----------------------
  // Frontend (dev)
  // ----------------------
  console.log("🚀 Iniciando frontend (porta 5173)...");
  spawn("npm", ["run", "dev", "--prefix", "frontend"], {
    cwd: projectPath,
    stdio: "ignore",
    shell: true,
    detached: true,
    windowsHide: true
  }).unref();

  // ----------------------
  // Abrir navegador
  // ----------------------
  setTimeout(() => {
    console.log("🌐 Abrindo aplicação no navegador...");
    exec(`start "" "http://localhost:5173"`);
  }, 5000);
}
