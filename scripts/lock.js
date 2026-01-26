const fs = require("fs");
const path = require("path");

const lockFile = path.join(__dirname, "..", ".app.lock");

if (fs.existsSync(lockFile)) {
  console.log("❌ O aplicativo já está em execução.");
  process.exit(0);
}

fs.writeFileSync(lockFile, "running");

process.on("exit", () => {
  if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
});

process.on("SIGINT", () => process.exit());
process.on("SIGTERM", () => process.exit());
