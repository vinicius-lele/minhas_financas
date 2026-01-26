const { execSync } = require("child_process");

try {
  execSync("node -v", { stdio: "ignore" });
} catch {
  console.error("❌ Node.js não está instalado.");
  console.error("👉 Instale o Node LTS em: https://nodejs.org");
  process.exit(1);
}
