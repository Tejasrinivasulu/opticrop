const { spawn } = require("child_process");

const candidates = [
  ...(process.env.PYTHON ? [{ cmd: process.env.PYTHON, args: ["app.py"] }] : []),
  { cmd: "python", args: ["app.py"] },
  { cmd: "python3", args: ["app.py"] },
  { cmd: "py", args: ["-3", "app.py"] },
  {
    cmd: "C:\\Users\\Teja Srinivasulu\\AppData\\Local\\Programs\\Python\\Python312\\python.exe",
    args: ["app.py"],
  },
];

function runCandidate(index) {
  if (index >= candidates.length) {
    console.error("Could not find a working Python command.");
    console.error("Install Python 3.10+ and ensure it is available in PATH.");
    process.exit(1);
  }

  const candidate = candidates[index];
  const startedAt = Date.now();
  const child = spawn(candidate.cmd, candidate.args, {
    stdio: "inherit",
    shell: false,
  });

  child.on("error", () => runCandidate(index + 1));

  child.on("exit", (code) => {
    // If command was missing, shell typically returns 9009 on Windows.
    const ranForMs = Date.now() - startedAt;
    const startupFailure = (code === 9009 || code === 1) && ranForMs < 4000;
    if (startupFailure) {
      runCandidate(index + 1);
      return;
    }
    process.exit(code ?? 0);
  });
}

console.log("Starting OptiCrop Flask server...");
runCandidate(0);
