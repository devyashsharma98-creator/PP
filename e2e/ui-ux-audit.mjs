import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = "https://pragya-pravah-ui-psi.vercel.app";
const outDir = path.resolve(__dirname, "audit");
const shotsDir = path.resolve(outDir, "screenshots");
mkdirSync(shotsDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

const findings = [];
function note(category, severity, element, detail) {
  findings.push({ category, severity, element, detail });
  const icon = { high: "❌", medium: "⚠️", low: "🔍", info: "💡" }[severity] || "  ";
  console.log(`  ${icon} [${severity.toUpperCase()}] ${category}: ${element} — ${detail}`);
}

let page;

async function goto(url) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
}
async function shot(name) {
  await page.screenshot({ path: `${shotsDir}/${name}.png`, fullPage: true });
}
async function evalInPage(fn) {
  return await page.evaluate(fn);
}

// ================================================================
// VIEWPORT AUDIT
// ================================================================
const VIEWPORTS = [
  { w: 1280, h: 800, label: "desktop" },
  { w: 768, h: 1024, label: "tablet" },
  { w: 375, h: 667, label: "mobile" },
];

const PAGES = [
  { path: "/", name: "homepage", label: "Public Homepage" },
  { path: "/login", name: "login", label: "Login" },
  { path: "/library", name: "library", label: "Library" },
  { path: "/feed", name: "feed", label: "Feed" },
  { path: "/parichay", name: "parichay", label: "Parichay (About)" },
  { path: "/aalekh", name: "aalekh", label: "Aalekh (auth)" },
  { path: "/calendar", name: "calendar", label: "Calendar (auth)" },
  { path: "/prachar", name: "prachar", label: "Prachar (auth)" },
];

for (const vp of VIEWPORTS) {
  console.log(`\n═══════════════════════════════════════`);
  console.log(`  VIEWPORT: ${vp.label} (${vp.w}x${vp.h})`);
  console.log(`═══════════════════════════════════════`);

  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  page = await ctx.newPage();

  for (const p of PAGES) {
    console.log(`\n  ── ${p.label} ──`);
    await goto(`${BASE}${p.path}`);
    await shot(`${vp.label}-${p.name}`);

    // ── RESPONSIVE BREAKAGE ──
    const overflow = await evalInPage(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth ? doc.scrollWidth - doc.clientWidth : 0;
    });
    if (overflow > 5) {
      note("Responsive", "medium", `${p.label} @${vp.label}`, `Horizontal overflow: ${Math.round(overflow)}px`);
    }

    // ── VISIBLE CONTENT ──
    const bodyText = await evalInPage(() => document.body?.textContent?.trim().length || 0);
    if (bodyText < 50) {
      note("Content", "high", `${p.label} @${vp.label}`, `Suspiciously little content: ${bodyText} chars`);
    }

    // ── EMPTY LINKS ──
    const emptyLinks = await evalInPage(() =>
      Array.from(document.querySelectorAll("a[href]")).filter(a => !a.textContent.trim() && !a.querySelector("img, svg")).length
    );
    if (emptyLinks > 0) {
      note("Accessibility", "medium", `${p.label} @${vp.label}`, `${emptyLinks} anchor(s) with no text content`);
    }

    // ── BROKEN IMAGES ──
    if (p.name === "library" || p.name === "homepage" || p.name === "parichay") {
      const brokenImgs = await evalInPage(() =>
        Array.from(document.querySelectorAll("img")).filter(img => !img.complete || img.naturalWidth === 0).length
      );
      if (brokenImgs > 0) {
        note("Content", "high", `${p.label} @${vp.label}`, `${brokenImgs} broken/missing image(s)`);
      }
    }

    // ── INTERACTIVE TARGET SIZE (mobile) ──
    if (vp.label === "mobile") {
      const smallTargets = await evalInPage(() =>
        Array.from(document.querySelectorAll("button, a, input, select, textarea")).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
        }).length
      );
      if (smallTargets > 0) {
        note("Touch (Mobile)", "medium", `${p.label} @mobile`, `${smallTargets} interactive elements smaller than 44x44px`);
      }
    }

    // ── FOCUS INDICATORS (tab through) ──
    if (vp.label === "desktop" && (p.name === "login" || p.name === "homepage")) {
      const focusable = await evalInPage(() =>
        document.querySelectorAll("a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])").length
      );
      if (focusable < 2) {
        note("Accessibility", "high", `${p.label}`, `Only ${focusable} focusable elements`);
      } else {
        console.log(`       ${focusable} focusable elements`);
      }
    }

    // ── BILINGUAL CONTENT CHECK ──
    if (p.name === "login" || p.name === "homepage") {
      const hasHindi = await evalInPage(() =>
        /[\u0900-\u097F]/.test(document.body?.textContent || "")
      );
      if (!hasHindi) {
        note("Bilingual", "medium", `${p.label}`, "No Hindi/Devanagari text found on page");
      }
    }
  }

  await ctx.close();
}

// ================================================================
// INTERACTIVE STATE TESTS (desktop only)
// ================================================================
console.log(`\n═══════════════════════════════════════`);
console.log(`  INTERACTIVE STATES`);
console.log(`═══════════════════════════════════════`);

const ctxDesktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
page = await ctxDesktop.newPage();

// Login page - button hover states
await goto(`${BASE}/login`);
await shot("states-login-default");

const btnSelector = "button:has-text('Sign In')";
const btnExists = await page.locator(btnSelector).count();
if (btnExists > 0) {
  await page.locator(btnSelector).first().hover();
  await shot("states-login-hover-signin");
  note("Interactive", "info", "Sign In button", "Hover snapshot captured");
  
  // Focus state
  await page.locator(btnSelector).first().focus();
  await shot("states-login-focus-signin");
  note("Interactive", "info", "Sign In button", "Focus snapshot captured");
}

// Library filter hover
await goto(`${BASE}/library`);
const filterBtn = page.locator("button").filter({ hasText: "Vastu" });
if (await filterBtn.count() > 0) {
  await filterBtn.first().hover();
  await shot("states-library-filter-hover");
  note("Interactive", "info", "Library filter (Vastu)", "Hover snapshot captured");
  
  await filterBtn.first().click();
  await shot("states-library-filter-active");
  note("Interactive", "info", "Library filter (Vastu)", "Active/selected state captured");
  
  // Check visual difference
  const selectedBg = await evalInPage(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const vastu = btns.find(b => b.textContent?.trim() === "Vastu");
    const all = btns.find(b => b.textContent?.trim() === "All");
    if (vastu && all) {
      return { vastuBg: vastu.style.background, vastuClass: vastu.className, allBg: all.style.background, allClass: all.className };
    }
    return null;
  });
  if (selectedBg) {
    const hasVisualDiff = selectedBg.vastuClass !== selectedBg.allClass;
    if (!hasVisualDiff) {
      note("Visual Feedback", "medium", "Library filter", "Active filter has same style as inactive — no visual distinction");
    }
  }
}

// Library card detail link — check if overlay blocks interaction
const detailLink = page.locator("a, button").filter({ hasText: /View Details/i });
if (await detailLink.count() > 0) {
  const isBlocked = await evalInPage(() => {
    const btn = Array.from(document.querySelectorAll("button, a")).find(el => el.textContent?.includes("View Details"));
    if (!btn) return false;
    const rect = btn.getBoundingClientRect();
    const el = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
    return el !== btn && !btn.contains(el);
  });
  if (isBlocked) {
    note("Interactive", "medium", "Library cards", "View Details button is covered by an overlay div — click/hover intercepted");
  }
  try {
    await detailLink.first().hover({ force: true });
    await shot("states-library-card-hover");
  } catch {
    note("Interactive", "medium", "Library cards", "Cannot hover View Details — overlay blocks pointer events");
  }
}

// Homepage - nav link hover
await goto(`${BASE}`);
const navLogin = page.locator('a[href="/login"]').first();
if (await navLogin.count() > 0) {
  await navLogin.hover();
  await shot("states-home-nav-hover");
  note("Interactive", "info", "Nav link (/login)", "Hover snapshot captured");
}

// ================================================================
// COLOR & VISUAL CONSISTENCY
// ================================================================
console.log(`\n═══════════════════════════════════════`);
console.log(`  COLOR & VISUAL CONSISTENCY`);
console.log(`═══════════════════════════════════════`);

await goto(`${BASE}/login`);

// Check CSS custom properties
const cssVars = await evalInPage(() => {
  const style = getComputedStyle(document.documentElement);
  return {
    background: style.getPropertyValue("--background").trim(),
    foreground: style.getPropertyValue("--foreground").trim(),
    primary: style.getPropertyValue("--primary").trim(),
    primaryForeground: style.getPropertyValue("--primary-foreground").trim(),
    muted: style.getPropertyValue("--muted").trim(),
    mutedForeground: style.getPropertyValue("--muted-foreground").trim(),
    border: style.getPropertyValue("--border").trim(),
    card: style.getPropertyValue("--card").trim(),
    cardForeground: style.getPropertyValue("--card-foreground").trim(),
  };
});

const C = cssVars;
console.log(`       Design tokens:`);
for (const [key, val] of Object.entries(C)) {
  console.log(`         --${key}: ${val}`);
}

if (!C.primary) {
  note("Design Tokens", "high", "CSS variables", "Primary color token is missing");
}
if (!C.background) {
  note("Design Tokens", "high", "CSS variables", "Background token is missing");
}

// Check background color is light/off-white
const bodyBg = await evalInPage(() => {
  return getComputedStyle(document.body).backgroundColor;
});
console.log(`       body background-color: ${bodyBg}`);

// Button color consistency
const btnBg = await evalInPage(() => {
  const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Sign In"));
  return btn ? getComputedStyle(btn).background : "not found";
});
console.log(`       Sign In button background: ${btnBg}`);

// ================================================================
// FONT / TYPOGRAPHY
// ================================================================
console.log(`\n═══════════════════════════════════════`);
console.log(`  TYPOGRAPHY`);
console.log(`═══════════════════════════════════════`);

await goto(`${BASE}`);

const fonts = await evalInPage(() => {
  const body = document.body;
  const style = getComputedStyle(body);
  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    color: style.color,
  };
});
console.log(`       Body font: ${fonts.fontFamily}`);
console.log(`       Size: ${fonts.fontSize}, Weight: ${fonts.fontWeight}, Line height: ${fonts.lineHeight}`);

if (fonts.fontFamily.includes("serif") || fonts.fontFamily.includes("Serif")) {
  note("Typography", "info", "body", "Uses serif font (editorial/dignified feel)");
}

// Heading font
const headingFont = await evalInPage(() => {
  const h1 = document.querySelector("h1");
  return h1 ? getComputedStyle(h1).fontFamily : "no h1 found";
});
console.log(`       Heading font: ${headingFont}`);

// ================================================================
// HI VERSION CHECK (bilingual)
// ================================================================
console.log(`\n═══════════════════════════════════════`);
console.log(`  BILINGUAL (EN/HI) TOGGLE`);
console.log(`═══════════════════════════════════════`);

await goto(`${BASE}/login`);

// Click language toggle
const toggleHi = page.locator("button").filter({ hasText: "हिंदी" });
if (await toggleHi.count() > 0) {
  await toggleHi.first().click({ force: true });
  await page.waitForTimeout(500);
  await shot("states-login-hindi");
  
  const hindiContent = await evalInPage(() => {
    const body = document.body?.textContent || "";
    const devanagari = body.match(/[\u0900-\u097F]/g);
    return { devanagariCount: devanagari?.length || 0, sample: body.substring(0, 200) };
  });
  
  if (hindiContent.devanagariCount > 20) {
    note("Bilingual", "info", "Login page (HI)", `Switch to Hindi works — ${hindiContent.devanagariCount} Devanagari chars`);
  } else {
    note("Bilingual", "medium", "Login page (HI)", `Switch to Hindi may be incomplete — only ${hindiContent.devanagariCount} Devanagari chars`);
  }
  
  // Switch back to EN — use force:true because overlay intercepts
  const toggleEnBtn = page.locator("button").filter({ hasText: "EN" });
  if (await toggleEnBtn.count() > 0) {
    await toggleEnBtn.first().click({ force: true });
    await page.waitForTimeout(300);
    note("Interactive", "info", "Language toggle", "Switch back to EN (force click due to overlay)");
  } else {
    note("Interactive", "medium", "Language toggle", "EN toggle button not found — may be hidden behind overlay");
  }
}

// ================================================================
// SCROLL BEHAVIOR (homepage)
// ================================================================
console.log(`\n═══════════════════════════════════════`);
console.log(`  SCROLL BEHAVIOR`);
console.log(`═══════════════════════════════════════`);

await goto(`${BASE}`);

// Check for smooth scroll
const scrollBehavior = await evalInPage(() => {
  const style = getComputedStyle(document.documentElement);
  return style.scrollBehavior;
});
if (scrollBehavior === "smooth") {
  note("UX", "info", "html", "Smooth scrolling enabled");
} else {
  note("UX", "low", "html", `Smooth scrolling: ${scrollBehavior || "not set"}`);
}

// Check sticky elements
const stickyEls = await evalInPage(() => {
  return Array.from(document.querySelectorAll("*"))
    .filter(el => {
      const pos = getComputedStyle(el).position;
      return pos === "sticky" || pos === "fixed";
    })
    .map(el => `${el.tagName}${el.id ? "#" + el.id : ""}${el.className ? "." + el.className.slice(0,20) : ""}`);
});
if (stickyEls.length > 0) {
  console.log(`       Sticky/fixed elements: ${stickyEls.join(", ")}`);
}

// ================================================================
// PRINT SUMMARY
// ================================================================
console.log(`\n═══════════════════════════════════════`);
console.log(`  UI/UX AUDIT COMPLETE`);
console.log(`═══════════════════════════════════════`);
console.log(`  Screenshots: ${shotsDir}`);

// Generate report
const high = findings.filter(f => f.severity === "high");
const med = findings.filter(f => f.severity === "medium");
const low = findings.filter(f => f.severity === "low");
const info = findings.filter(f => f.severity === "info");

console.log(`\n  FINDINGS SUMMARY:`);
console.log(`    ❌ High:   ${high.length}`);
console.log(`    ⚠️  Medium: ${med.length}`);
console.log(`    🔍 Low:    ${low.length}`);
console.log(`    💡 Info:   ${info.length}`);

if (high.length > 0) {
  console.log(`\n  ❌ HIGH SEVERITY ISSUES:`);
  high.forEach(f => console.log(`    - ${f.category}: ${f.element} — ${f.detail}`));
}
if (med.length > 0) {
  console.log(`\n  ⚠️  MEDIUM SEVERITY ISSUES:`);
  med.forEach(f => console.log(`    - ${f.category}: ${f.element} — ${f.detail}`));
}
if (low.length > 0) {
  console.log(`\n  🔍 LOW SEVERITY:`);
  low.forEach(f => console.log(`    - ${f.category}: ${f.element} — ${f.detail}`));
}

// Save report
const report = `UI/UX Audit Report
Date: ${new Date().toISOString()}
Site: ${BASE}
Viewports: ${VIEWPORTS.map(v => `${v.label}(${v.w}x${v.h})`).join(", ")}

FINDINGS:
${findings.map(f => `[${f.severity.toUpperCase()}] ${f.category}: ${f.element} — ${f.detail}`).join("\n")}

SUMMARY:
  High: ${high.length}
  Medium: ${med.length}
  Low: ${low.length}
  Info: ${info.length}
`;

writeFileSync(path.resolve(outDir, "audit-report.txt"), report);
console.log(`\n  Report saved: ${outDir}/audit-report.txt`);

await browser.close();
process.exit(high.length > 0 ? 1 : 0);
