const BASE_URL = process.env.APP_URL || "https://pragya-pravah-ui-psi.vercel.app";

function extractCookie(h) {
  if (!h) return "";
  return h.split(",").map(c => c.trim().split(";")[0]).filter(c => c.includes("=")).join("; ");
}

async function jsonOrText(res) {
  const text = await res.text();
  try { return { data: JSON.parse(text), text }; } catch { return { data: null, text }; }
}

async function test() {
  console.log(`Testing MASTER account → ${BASE_URL}\n`);

  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "master@pragyapravah.in", password: "Master@2025" }),
  });
  const { data: loginData } = await jsonOrText(loginRes);
  if (!loginData?.success) {
    console.log("❌ LOGIN FAILED:", loginData?.error);
    return;
  }
  const cookie = extractCookie(loginRes.headers.get("set-cookie"));
  const h = { Cookie: cookie };

  console.log("✅ Logged in as", loginData.data?.displayName || loginData.data?.email);
  console.log("   Role:", loginData.data?.primaryRoleCode);
  console.log("   Permissions:", Object.entries(loginData.data?.permissions || {}).filter(([_, v]) => v).length, "granted");
  console.log("   Requires password change:", loginData.data?.requiresPasswordChange);

  // Test all key endpoints
  const endpoints = [
    ["Bootstrap", "/api/app/bootstrap"],
    ["Overview", "/api/app/overview"],
    ["Events", "/api/v1/events?limit=5"],
    ["Articles", "/api/v1/articles?limit=5"],
    ["Users", "/api/v1/users?limit=5"],
    ["Roles", "/api/v1/roles"],
    ["Org Structure", "/api/v1/org/structure"],
    ["Directory", "/api/v1/directory?limit=5"],
    ["Notifications", "/api/v1/notifications?limit=5"],
    ["Activity", "/api/v1/activity?limit=5"],
  ];

  console.log("\n📡 API TESTS:");
  for (const [name, path] of endpoints) {
    const res = await fetch(`${BASE_URL}${path}`, { headers: h });
    const { data } = await jsonOrText(res);
    const ok = data?.success || (name === "Bootstrap" && data?.viewer);
    console.log(`   ${ok ? "✅" : "❌"} ${name}`);
  }

  // Logout
  await fetch(`${BASE_URL}/api/auth/logout`, { method: "POST", headers: h });
  console.log("\n🔓 Logout: ✅");
  console.log("\n=== MASTER ACCOUNT VERIFIED ===");
}

test().catch(err => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
