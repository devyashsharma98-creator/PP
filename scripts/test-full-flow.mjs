/**
 * Full system connectivity test — logs in as super admin and tests every module
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
  console.log(`Testing: ${BASE_URL}\n`);

  // 1. Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo.superadmin@example.com", password: "Password123!" }),
  });
  const { data: loginData } = await jsonOrText(loginRes);
  if (!loginData?.success) {
    console.log("❌ LOGIN FAILED:", loginData?.error);
    return;
  }
  const cookie = extractCookie(loginRes.headers.get("set-cookie"));
  const h = { Cookie: cookie };
  console.log("✅ Logged in as", loginData.data?.displayName || loginData.data?.email);

  // 2. Bootstrap — deep inspect
  const bootRes = await fetch(`${BASE_URL}/api/app/bootstrap`, { headers: h });
  const { data: bootData } = await jsonOrText(bootRes);
  console.log("\n📦 BOOTSTRAP:");
  if (!bootData) { console.log("   ❌ Invalid JSON"); }
  else if (bootData.error) { console.log("   ❌ Error:", bootData.error); }
  else {
    const v = bootData.viewer;
    if (!v) { console.log("   ⚠️ No viewer"); }
    else {
      console.log("   User:", v.displayName || v.email);
      console.log("   Primary Role:", v.primaryRoleCode);
      console.log("   Effective Roles:", v.effectiveRoles?.join(", ") || "❌ EMPTY");
      console.log("   Assignments:", v.assignments?.length ?? 0);
      const perms = Object.entries(v.permissions || {}).filter(([_, val]) => val).map(([k]) => k);
      console.log("   Permissions:", perms.length, "granted");
      console.log("   Events:", bootData.events?.length ?? 0);
      console.log("   Articles:", bootData.articles?.length ?? 0);
    }
  }

  // 3. Overview
  const oRes = await fetch(`${BASE_URL}/api/app/overview`, { headers: h });
  const { data: oData } = await jsonOrText(oRes);
  console.log("\n📊 OVERVIEW:", oData?.success ? "✅" : `❌ ${oData?.error}`);
  if (oData?.data) {
    const w = oData.data.workflow || {};
    console.log("   Pending Events:", w.pendingEvents ?? "N/A");
    console.log("   Pending Articles:", w.pendingArticles ?? "N/A");
    console.log("   Published Events:", w.publishedEvents ?? "N/A");
    console.log("   Published Articles:", w.publishedArticles ?? "N/A");
    console.log("   Open Prachar:", w.openPracharCampaigns ?? "N/A");
    const l = oData.data.login || {};
    console.log("   Total Accounts:", l.totalAccounts ?? "N/A");
    console.log("   Active Accounts:", l.activeAccounts ?? "N/A");
  }

  // 4. Events
  const eRes = await fetch(`${BASE_URL}/api/v1/events?limit=10`, { headers: h });
  const { data: eData } = await jsonOrText(eRes);
  console.log("\n📅 EVENTS:", eData?.success ? `✅ (${eData.data?.length ?? 0})` : `❌ ${eData?.error}`);

  // 5. Articles
  const arRes = await fetch(`${BASE_URL}/api/v1/articles?limit=10`, { headers: h });
  const { data: arData } = await jsonOrText(arRes);
  console.log("📰 ARTICLES:", arData?.success ? `✅ (${arData.data?.length ?? 0})` : `❌ ${arData?.error}`);

  // 6. Users
  const uRes = await fetch(`${BASE_URL}/api/v1/users?limit=10`, { headers: h });
  const { data: uData } = await jsonOrText(uRes);
  console.log("👥 USERS:", uData?.success ? `✅ (${uData.data?.length ?? 0})` : `❌ ${uData?.error}`);

  // 7. Directory
  const dRes = await fetch(`${BASE_URL}/api/v1/directory?limit=10`, { headers: h });
  const { data: dData } = await jsonOrText(dRes);
  console.log("📖 DIRECTORY:", dData?.success ? `✅ (${dData.data?.length ?? 0})` : `❌ ${dData?.error}`);

  // 8. Org Structure
  const osRes = await fetch(`${BASE_URL}/api/v1/org/structure`, { headers: h });
  const { data: osData } = await jsonOrText(osRes);
  console.log("🏢 ORG STRUCTURE:", osData?.success ? `✅ (units: ${osData.data?.units?.length ?? 0}, aayams: ${osData.data?.departments?.length ?? 0})` : `❌ ${osData?.error}`);

  // 9. Roles
  const rRes = await fetch(`${BASE_URL}/api/v1/roles`, { headers: h });
  const { data: rData } = await jsonOrText(rRes);
  console.log("🛡️ ROLES:", rData?.success ? `✅ (${rData.data?.length ?? 0})` : `❌ ${rData?.error}`);

  // 10. Notifications
  const nRes = await fetch(`${BASE_URL}/api/v1/notifications?limit=5`, { headers: h });
  const { data: nData } = await jsonOrText(nRes);
  console.log("🔔 NOTIFICATIONS:", nData?.success ? `✅ (${nData.data?.length ?? 0})` : `❌ ${nData?.error}`);

  // 11. Activity Feed
  const acRes = await fetch(`${BASE_URL}/api/v1/activity?limit=5`, { headers: h });
  const { data: acData } = await jsonOrText(acRes);
  console.log("📈 ACTIVITY:", acData?.success ? `✅ (${acData.data?.length ?? 0})` : `❌ ${acData?.error}`);

  // 12. Public Event (no auth)
  const evRes = await fetch(`${BASE_URL}/api/v1/events?limit=1`, { headers: h });
  const { data: evData } = await jsonOrText(evRes);
  const eventId = evData?.data?.[0]?.id;
  if (eventId) {
    const peRes = await fetch(`${BASE_URL}/api/public/events/${eventId}`);
    const { data: peData } = await jsonOrText(peRes);
    console.log("🌐 PUBLIC EVENT:", peData?.event ? `✅ (${peData.event.title})` : `❌ ${peData?.error || "Not found"}`);
  }

  // 13. Event detail
  if (eventId) {
    const edRes = await fetch(`${BASE_URL}/api/v1/events/${eventId}`, { headers: h });
    const { data: edData } = await jsonOrText(edRes);
    console.log("🔍 EVENT DETAIL:", edData?.success ? `✅ (${edData.data?.title})` : `❌ ${edData?.error}`);
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
