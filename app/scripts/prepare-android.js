const os = require("os");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

function getConnectedAdbDevices() {
  try {
    const output = execFileSync("adb", ["devices"], { encoding: "utf8" });
    return output
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.trim())
      .filter((line) => /\tdevice\b/.test(line))
      .map((line) => line.split("\t", 1)[0]);
  } catch {
    return [];
  }
}

function reverseMetroPort(devices, port) {
  for (const device of devices) {
    execFileSync("adb", ["-s", device, "reverse", `tcp:${port}`, `tcp:${port}`], {
      stdio: "inherit",
    });
  }
}

function getBestIP() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(interfaces)) {
    const isVirtual = /virtual|vbox|veth|docker|wsl|lo|utun|bridge/i.test(name);

    for (const iface of interfaces[name] || []) {
      if ((iface.family === "IPv4" || iface.family === 4) && !iface.internal) {
        candidates.push({
          address: iface.address,
          isVirtual,
          name,
        });
      }
    }
  }

  candidates.sort((a, b) => {
    if (a.isVirtual !== b.isVirtual) {
      return a.isVirtual ? 1 : -1;
    }
    if (a.address.startsWith("192.168")) {
      return -1;
    }
    if (b.address.startsWith("192.168")) {
      return 1;
    }
    return 0;
  });

  return candidates.length > 0 ? candidates[0].address : "127.0.0.1";
}

const devices = getConnectedAdbDevices();

if (devices.length === 0) {
  process.exit(1);
}

reverseMetroPort(devices, 8081);

const ip = getBestIP();
const envLocalPath = path.resolve(__dirname, "../.env.local");

let content = "";
if (fs.existsSync(envLocalPath)) {
  content = fs.readFileSync(envLocalPath, "utf8");
}

const lines = content.split("\n");
const newLines = lines.filter(
  (line) => line.trim() !== "" && !line.startsWith("EXPO_PUBLIC_IPV4="),
);
newLines.push(`EXPO_PUBLIC_IPV4=${ip}`);

fs.writeFileSync(envLocalPath, `${newLines.join("\n").trim()}\n`);
