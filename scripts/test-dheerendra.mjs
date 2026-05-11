/**
 * Full system test — login as Dheerendra Chaturvedi (new super admin)
 */
const BASE_URL = process.env.APP_URL || "https://pragya-pravah-ui-psi.vercel.app";

function extractCookie(setCookieHeader) {
  if (!setCookieHeader) return "";
  return setCookieHeader.split(",")
    .map(c => c.trim().split(";")[0])
    .filter(c => c.includes("="))
    .join("; ");
}

async function jsonOrText(res) {
  const text = await res.text();
  try { return { data: JSON.parse(text), text }; } catch { return { data: null, text }; }
}

async function test() {
  console.log(`Testing as Dheerendra Chaturvedi → ${BASE_URL}\n`);

  // 1. Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "dheerendrachaturvedi@pragyapravah.in", password: "Pragya@123" }),
  });
  const { data: loginData } = await jsonOrText(loginRes);
  if (!loginData?.success) {
    console.log("❌ LOGIN FAILED:", loginData?.error);
    return;
  }
  const cookie = extractCookie(loginRes.headers.get("set-cookie"));
  const h = { Cookie: cookie };
  console.log("✅ Logged in as", loginData.data?.displayName || loginData.data?.email);
  console.log("   Primary Role:", loginData.data?.primaryRoleCode);
  console.log("   Effective Roles:", loginData.data?.effectiveRoleCodes?.join(", "));
  console.log("   Requires password change:", loginData.data?.requiresPasswordChange);

  // 2. Bootstrap
  const bootRes = await fetch(`${BASE_URL}/api/app/bootstrap`, { headers: h });
  const { data: bootData } = await jsonOrText(bootRes);
  console.log("\n📦 BOOTSTRAP:", bootData?.viewer ? "✅" : "❌");
  if (bootData?.viewer) {
    console.log("   User:", bootData.viewer.displayName || bootData.viewer.email);
    console.log("   Roles:", bootData.viewer.effectiveRoles?.join(", "));
    console.log("   Permissions:", Object.entries(bootData.viewer.permissions || {}).filter(([_, v]) => v).length);
    console.log("   Events:", bootData.events?.length ?? 0);
    console.log("   Articles:", bootData.articles?.length ?? 0);
  }

  // 3. Overview
  const oRes = await fetch(`${BASE_URL}/api/app/overview`, { headers: h });
  const { data: oData } = await jsonOrText(oRes);
  console.log("\n📊 OVERVIEW:", oData?.success ? "✅" : "❌");
  if (oData?.data?.workflow) {
    const w = oData.data.workflow;
    console.log("   Pending Events:", w.pendingEvents);
    console.log("   Pending Articles:", w.pendingArticles);
    console.log("   Published Events:", w.publishedEvents);
    console.log("   Published Articles:", w.publishedArticles);
  }

  // 4. Events
  const eRes = await fetch(`${BASE_URL}/api/v1/events?limit=10`, { headers: h });
  const { data: eData } = await jsonOrText(eRes);
  console.log("\n📅 EVENTS:", eData?.success ? `✅ (${eData.data?.length ?? 0})` : `❌ ${eData?.error}`);

  // 5. Event Detail
  if (eData?.data?.[0]?.id) {
    const edRes = await fetch(`${BASE_URL}/api/v1/events/${eData.data[0].id}`, { headers: h });
    const { data: edData } = await jsonOrText(edRes);
    console.log("🔍 EVENT DETAIL:", edData?.success ? `✅ (${edData.data?.title})` : `❌ ${edData?.error}`);
  }

  // 6. Articles
  const arRes = await fetch(`${BASE_URL}/api/v1/articles?limit=10`, { headers: h });
  const { data: arData } = await jsonOrText(arRes);
  console.log("\n📰 ARTICLES:", arData?.success ? `✅ (${arData.data?.length ?? 0})` : `❌ ${arData?.error}`);

  // 7. Users (Super Admin only)
  const uRes = await fetch(`${BASE_URL}/api/v1/users?limit=10`, { headers: h });
  const { data: uData } = await jsonOrText(uRes);
  console.log("👥 USERS:", uData?.success ? `✅ (${uData.data?.length ?? 0})` : `❌ ${uData?.error}`);

  // 8. Roles (Super Admin only)
  const rRes = await fetch(`${BASE_URL}/api/v1/roles`, { headers: h });
  const { data: rData } = await jsonOrText(rRes);
  console.log("🛡️ ROLES:", rData?.success ? `✅ (${rData.data?.length ?? 0})` : `❌ ${rData?.error}`);

  // 9. Org Structure
  const osRes = await fetch(`${BASE_URL}/api/v1/org/structure`, { headers: h });
  const { data: osData } = await jsonOrText(osRes);
  console.log("🏢 ORG STRUCTURE:", osData?.success ? `✅ (units: ${osData.data?.units?.length ?? 0}, aayams: ${osData.data?.departments?.length ?? 0})` : `❌ ${osData?.error}`);

  // 10. Directory
  const dRes = await fetch(`${BASE_URL}/api/v1/directory?limit=10`, { headers: h });
  const { data: dData } = await jsonOrText(dRes);
  console.log("📖 DIRECTORY:", dData?.success ? `✅ (${dData.data?.length ?? 0})` : `❌ ${dData?.error}`);

  // 11. Notifications
  const nRes = await fetch(`${BASE_URL}/api/v1/notifications?limit=5`, { headers: h });
  const { data: nData } = await jsonOrText(nRes);
  console.log("🔔 NOTIFICATIONS:", nData?.success ? `✅ (${nData.data?.length ?? 0})` : `❌ ${nData?.error}`);

  // 12. Activity
  const acRes = await fetch(`${BASE_URL}/api/v1/activity?limit=5`, { headers: h });
  const { data: acData } = await jsonOrText(acRes);
  console.log("📈 ACTIVITY:", acData?.success ? `✅ (${acData.data?.length ?? 0})` : `❌ ${acData?.error}`);

  // 13. Public Event (no auth)
  if (eData?.data?.[0]?.id) {
    const peRes = await fetch(`${BASE_URL}/api/public/events/${eData.data[0].id}`);
    const { data: peData } = await jsonOrText(peRes);
    console.log("\n🌐 PUBLIC EVENT:", peData?.event ? `✅ (${peData.event.title})` : `❌`);
  }

  // 14. Logout
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, { method: "POST", headers: h });
  console.log("\n🔓 LOGOUT:", logoutRes.ok ? "✅" : "❌");

  console.log("\n=== ALL TESTS COMPLETE ===");
}

test().catch(err => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
