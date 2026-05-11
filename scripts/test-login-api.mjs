/**
 * Test the login + bootstrap flow end-to-end
 */
const BASE_URL = process.env.APP_URL || "https://pragya-pravah-ui-psi.vercel.app";

function extractCookie(setCookieHeader) {
  if (!setCookieHeader) return "";
  return setCookieHeader.split(",")
    .map(c => c.trim().split(";")[0])
    .filter(c => c.includes("="))
    .join("; ");
}

async function test() {
  console.log(`Testing against: ${BASE_URL}\n`);

  // 1. Login
  console.log("1. POST /api/auth/login ...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo.superadmin@example.com", password: "Password123!" }),
  });
  const loginData = await loginRes.json();
  console.log("   Status:", loginRes.status, loginData.success ? "✅" : "❌", loginData.success ? "Logged in" : loginData.error);

  if (!loginData.success) {
    console.log("\n❌ LOGIN FAILED — cannot proceed.");
    return;
  }

  const cookie = extractCookie(loginRes.headers.get("set-cookie"));
  console.log("   Cookie:", cookie ? "✅" : "⚠️ No cookie", cookie.substring(0, 60) + "...");
  const cookieHeader = cookie ? { Cookie: cookie } : {};

  // 2. Bootstrap
  console.log("\n2. GET /api/app/bootstrap ...");
  const bootRes = await fetch(`${BASE_URL}/api/app/bootstrap`, { headers: cookieHeader });
  const bootData = await bootRes.json();
  console.log("   Status:", bootRes.status, bootRes.status === 200 ? "✅" : "❌");
  if (bootData.viewer) {
    console.log("   User:", bootData.viewer.displayName || bootData.viewer.email);
    console.log("   Roles:", bootData.viewer.effectiveRoles?.map(r => r.code).join(", "));
    const perms = Object.entries(bootData.viewer.permissions || {}).filter(([_, v]) => v).map(([k]) => k);
    console.log("   Permissions:", perms.length, "granted");
  } else if (bootData.error) {
    console.log("   Error:", bootData.error);
  } else {
    console.log("   Payload keys:", Object.keys(bootData));
  }

  // 3. Overview
  console.log("\n3. GET /api/app/overview ...");
  const overviewRes = await fetch(`${BASE_URL}/api/app/overview`, { headers: cookieHeader });
  const overviewText = await overviewRes.text();
  let overviewData;
  try { overviewData = JSON.parse(overviewText); } catch { overviewData = null; }
  console.log("   Status:", overviewRes.status, overviewData?.success ? "✅" : "❌");
  if (!overviewData?.success) console.log("   Raw:", overviewText.substring(0, 200));

  // 4. Actions
  console.log("\n4. GET /api/app/actions ...");
  const actionsRes = await fetch(`${BASE_URL}/api/app/actions`, { headers: cookieHeader });
  const actionsText = await actionsRes.text();
  let actionsData;
  try { actionsData = JSON.parse(actionsText); } catch { actionsData = null; }
  console.log("   Status:", actionsRes.status, actionsData?.success ? "✅" : "❌", actionsData?.data ? `(${actionsData.data.length} actions)` : "");
  if (!actionsData?.success) console.log("   Raw:", actionsText.substring(0, 300));

  // 5. Events
  console.log("\n5. GET /api/v1/events ...");
  const eventsRes = await fetch(`${BASE_URL}/api/v1/events?limit=5`, { headers: cookieHeader });
  const eventsData = await eventsRes.json();
  console.log("   Status:", eventsRes.status, eventsData.success ? "✅" : "❌", `(${eventsData.data?.length ?? 0} events)`);
  if (!eventsData.success) console.log("   Error:", eventsData.error);

  // 6. Users
  console.log("\n6. GET /api/v1/users ...");
  const usersRes = await fetch(`${BASE_URL}/api/v1/users?limit=5`, { headers: cookieHeader });
  const usersData = await usersRes.json();
  console.log("   Status:", usersRes.status, usersData.success ? "✅" : "❌", `(${usersData.data?.length ?? 0} users)`);
  if (!usersData.success) console.log("   Error:", usersData.error);

  // 7. Articles
  console.log("\n7. GET /api/v1/articles ...");
  const articlesRes = await fetch(`${BASE_URL}/api/v1/articles?limit=5`, { headers: cookieHeader });
  const articlesData = await articlesRes.json();
  console.log("   Status:", articlesRes.status, articlesData.success ? "✅" : "❌", `(${articlesData.data?.length ?? 0} articles)`);
  if (!articlesData.success) console.log("   Error:", articlesData.error);

  // 8. Directory
  console.log("\n8. GET /api/v1/directory ...");
  const dirRes = await fetch(`${BASE_URL}/api/v1/directory?limit=5`, { headers: cookieHeader });
  const dirData = await dirRes.json();
  console.log("   Status:", dirRes.status, dirData.success ? "✅" : "❌", `(${dirData.data?.length ?? 0} entries)`);
  if (!dirData.success) console.log("   Error:", dirData.error);

  // 9. Org structure
  console.log("\n9. GET /api/v1/org/structure ...");
  const orgRes = await fetch(`${BASE_URL}/api/v1/org/structure`, { headers: cookieHeader });
  const orgData = await orgRes.json();
  console.log("   Status:", orgRes.status, orgData.success ? "✅" : "❌");
  if (!orgData.success) console.log("   Error:", orgData.error);

  // 10. Logout
  console.log("\n10. POST /api/auth/logout ...");
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, { method: "POST", headers: cookieHeader });
  console.log("   Status:", logoutRes.status, logoutRes.ok ? "✅" : "❌");

  console.log("\n=== ALL TESTS COMPLETE ===");
}

test().catch(err => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
