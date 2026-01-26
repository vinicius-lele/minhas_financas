const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
require("./checkNode");

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

// Limpa lock antigo
const lock = path.join(__dirname, "..", ".app.lock");
if (fs.existsSync(lock)) fs.unlinkSync(lock);

console.log("🔧 Instalando dependências...");
run("npm install");
run("npm install --prefix backend");
run("npm install --prefix frontend");

console.log("✅ Dependências instaladas!");

console.log("🔗 Criando atalho na área de trabalho...");
run("powershell -ExecutionPolicy Bypass -File scripts\\createShortcut.ps1");

console.log("✅ Setup concluído! Use o atalho na Área de Trabalho para iniciar o app.");
