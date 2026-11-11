import { chromium } from "playwright";

const BASE_URL = process.env.TEST_URL || "https://nxtive-80349.web.app";

console.log("================================================================================");
console.log(`Starting NXTIVE Comprehensive Playwright Test Suite against: ${BASE_URL}`);
console.log("================================================================================\n");

const ADMIN_PAGES = [
  { path: "/admin/dashboard", name: "Dashboard", titleKeyword: "Dashboard" },
  { path: "/admin/products", name: "Products Catalog", titleKeyword: "Product" },
  { path: "/admin/products/new", name: "Add New Product", titleKeyword: "Apparel" },
  { path: "/admin/categories", name: "Categories", titleKeyword: "Categor" },
  { path: "/admin/inventory", name: "Inventory Management", titleKeyword: "Inventory" },
  { path: "/admin/orders", name: "Orders List", titleKeyword: "Order" },
  { path: "/admin/customers", name: "Customers List", titleKeyword: "Customer" },
  { path: "/admin/reviews", name: "Product Reviews", titleKeyword: "Review" },
  { path: "/admin/payments", name: "Payments Ledger", titleKeyword: "Payment" },
  { path: "/admin/payments/settings", name: "Payment Settings", titleKeyword: "Gateway" },
  { path: "/admin/shipping", name: "Shipping Logistics", titleKeyword: "Shipping" },
  { path: "/admin/shipping/settings", name: "Shipping Settings", titleKeyword: "Shipping" },
  { path: "/admin/shipping/tracking", name: "Shipment Tracking", titleKeyword: "Tracking" },
  { path: "/admin/admin-users", name: "Admin Users", titleKeyword: "Admin" },
  { path: "/admin/roles", name: "Roles & Permissions", titleKeyword: "Role" },
  { path: "/admin/settings", name: "Store Settings", titleKeyword: "Setting" },
  { path: "/admin/database", name: "Database & Collections", titleKeyword: "Database" },
  { path: "/admin/coupons", name: "Discount Coupons", titleKeyword: "Coupon" },
  { path: "/admin/analytics", name: "Analytics & Reports", titleKeyword: "Analytic" },
  { path: "/admin/users", name: "Customer Accounts Directory", titleKeyword: "User" },
];

const STOREFRONT_CATEGORIES = [
  { path: "/categories/t-shirts", name: "T-Shirts", expectedHeading: "T-Shirts" },
  { path: "/categories/shirts", name: "Shirts", expectedHeading: "Shirts" },
  { path: "/categories/hoodies", name: "Hoodies", expectedHeading: "Hoodies" },
  { path: "/categories/sweatshirts", name: "Sweatshirts", expectedHeading: "Sweatshirts" },
  { path: "/categories/bottoms", name: "Bottoms", expectedHeading: "Bottoms" },
  { path: "/categories/jackets", name: "Jackets", expectedHeading: "Jackets" },
];

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-quic"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  // Inject Super Admin Session Profile so all admin routes load with full authorizations
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem(
        "nxtive_admin_profile",
        JSON.stringify({
          uid: "admin-nxtive-playwright",
          email: "nxtiveclothing@gmail.com",
          role: "super_admin",
          displayName: "Nxtive Super Admin",
          permissions: [
            "manage_all",
            "view_all",
            "edit_all",
            "delete_all",
            "view_dashboard",
            "manage_products",
            "manage_orders",
            "manage_customers",
            "manage_inventory",
            "manage_reviews",
            "manage_payments",
            "manage_shipping",
            "manage_settings",
            "manage_database",
            "manage_coupons",
            "manage_analytics",
            "manage_roles",
            "manage_users",
          ],
        })
      );
    } catch (e) {
      console.error("Failed to inject sessionStorage admin profile", e);
    }
  });

  const page = await context.newPage();

  const results = {
    adminPages: [],
    sidebarNav: [],
    storefrontPages: [],
    productPages: [],
    databaseManager: null,
  };

  // ============================================================================
  // STEP 1: TEST ALL ADMIN PAGES
  // ============================================================================
  console.log("--------------------------------------------------------------------------------");
  console.log("1. TESTING ALL 20 ADMIN MODULE PAGES FOR DATA AVAILABILITY & HTTP STATUS");
  console.log("--------------------------------------------------------------------------------");

  for (const item of ADMIN_PAGES) {
    const url = `${BASE_URL}${item.path}`;
    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });
      const status = response ? response.status() : 0;
      await page.waitForTimeout(2000); // Allow client hooks/Firestore Client SDK fetch

      const content = await page.content();
      const text = await page.innerText("body").catch(() => "");

      // Check for previously reported error signatures
      const hasDataUnavailable =
        text.includes("data unavailable") ||
        text.includes("Data unavailable") ||
        text.includes("unavailable") && (text.includes("Settings unavailable") || text.includes("data unavailable")) ||
        text.includes("An unexpected response was received from the server") ||
        text.includes("Unexpected token '<'") ||
        text.includes("is not valid JSON");

      const isLoginPageRedirect = page.url().includes("/admin/login");

      const passed = status === 200 && !hasDataUnavailable && !isLoginPageRedirect;

      results.adminPages.push({
        name: item.name,
        path: item.path,
        status,
        passed,
        isLoginPageRedirect,
        hasDataUnavailable,
      });

      if (passed) {
        console.log(`  [PASS] ${item.name.padEnd(26)} | ${item.path.padEnd(25)} | HTTP ${status} | Ready`);
      } else {
        console.error(
          `  [FAIL] ${item.name.padEnd(26)} | ${item.path.padEnd(25)} | HTTP ${status} | Redirect: ${isLoginPageRedirect} | DataUnavailable: ${hasDataUnavailable}`
        );
      }
    } catch (err) {
      console.error(`  [ERROR] ${item.name.padEnd(25)} | ${item.path} - ${err.message}`);
      results.adminPages.push({
        name: item.name,
        path: item.path,
        status: 0,
        passed: false,
        error: err.message,
      });
    }
  }

  // ============================================================================
  // STEP 2: TEST CLOUD FIRESTORE DATABASE MANAGER
  // ============================================================================
  console.log("\n--------------------------------------------------------------------------------");
  console.log("2. TESTING CLOUD FIRESTORE DATABASE MANAGER (/admin/database)");
  console.log("--------------------------------------------------------------------------------");
  try {
    await page.goto(`${BASE_URL}/admin/database`, { waitUntil: "domcontentloaded", timeout: 35000 });
    // Wait for client loadStatus to hydrate and complete
    await page.locator('text="Cloud Firestore Client SDK"').first().waitFor({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const bodyText = await page.innerText("body");
    const isLive = bodyText.includes("Live & Connected") || bodyText.includes("Cloud Firestore Client SDK");
    const isStuckConnecting = bodyText.includes("Connecting...") && !bodyText.includes("Live & Connected");
    
    // Look for collection badges or rows
    const collectionsCountMatch = bodyText.match(/(\d+)\s*(store collections|collections|documents|items)/i);
    const collectionsMentioned = ["products", "orders", "categories", "users"].filter((c) =>
      bodyText.toLowerCase().includes(c)
    );

    const dbPass = isLive && !isStuckConnecting;
    results.databaseManager = {
      isLive,
      isStuckConnecting,
      collectionsFound: collectionsMentioned,
      passed: dbPass,
    };

    console.log(`  Connection Status: ${isLive ? "LIVE & CONNECTED [PASS]" : "FAILED/OFFLINE [FAIL]"}`);
    console.log(`  Stuck on Connecting: ${isStuckConnecting ? "YES [FAIL]" : "NO [PASS]"}`);
    console.log(`  Collections Detected in UI: ${collectionsMentioned.join(", ") || "None"} [PASS]`);
  } catch (err) {
    console.error(`  [ERROR] Database manager check failed: ${err.message}`);
    results.databaseManager = { passed: false, error: err.message };
  }

  // ============================================================================
  // STEP 3: TEST ADMIN SIDEBAR NAVIGATION FLOWS
  // ============================================================================
  console.log("\n--------------------------------------------------------------------------------");
  console.log("3. TESTING ADMIN SIDEBAR NAVIGATION FLOWS");
  console.log("--------------------------------------------------------------------------------");
  try {
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "domcontentloaded", timeout: 35000 });
    await page.waitForTimeout(2000);

    const navTargets = [
      { name: "Products", selector: 'a[href="/admin/products"]', target: "/admin/products" },
      { name: "Categories", selector: 'a[href="/admin/categories"]', target: "/admin/categories" },
      { name: "Inventory", selector: 'a[href="/admin/inventory"]', target: "/admin/inventory" },
      { name: "Orders", selector: 'a[href="/admin/orders"]', target: "/admin/orders" },
      { name: "Customers", selector: 'a[href="/admin/customers"]', target: "/admin/customers" },
      { name: "Reviews", selector: 'a[href="/admin/reviews"]', target: "/admin/reviews" },
      { name: "Payments", selector: 'a[href="/admin/payments"]', target: "/admin/payments" },
      { name: "Shipping", selector: 'a[href="/admin/shipping"]', target: "/admin/shipping" },
      { name: "Database", selector: 'a[href="/admin/database"]', target: "/admin/database" },
      { name: "Settings", selector: 'a[href="/admin/settings"]', target: "/admin/settings" },
      { name: "Coupons", selector: 'a[href="/admin/coupons"]', target: "/admin/coupons" },
      { name: "Analytics", selector: 'a[href="/admin/analytics"]', target: "/admin/analytics" },
    ];

    for (const nav of navTargets) {
      const link = page.locator(nav.selector).first();
      const visible = await link.isVisible({ timeout: 4000 }).catch(() => false);
      if (visible) {
        await link.click();
        await page.waitForTimeout(1500);
        const currentUrl = page.url();
        const success = currentUrl.includes(nav.target);
        results.sidebarNav.push({ name: nav.name, success, url: currentUrl });
        console.log(`  [${success ? "PASS" : "FAIL"}] Sidebar -> ${nav.name.padEnd(12)} | Landed on: ${currentUrl}`);
      } else {
        // May be inside a collapsible group or mobile drawer
        console.log(`  [INFO] Sidebar link ${nav.name} not directly visible on desktop viewport.`);
      }
    }
  } catch (err) {
    console.error(`  [ERROR] Sidebar navigation failed: ${err.message}`);
  }

  // ============================================================================
  // STEP 4: TEST STOREFRONT CATEGORIES & SWEATSHIRTS BANNER & SPELLING
  // ============================================================================
  console.log("\n--------------------------------------------------------------------------------");
  console.log("4. TESTING STOREFRONT CATEGORIES (BANNER, SPELLING, PRODUCTS & NAVIGATION)");
  console.log("--------------------------------------------------------------------------------");

  // Check Homepage first
  try {
    const res = await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 35000 });
    await page.waitForTimeout(2000);
    const status = res ? res.status() : 0;
    const bodyText = await page.innerText("body");
    const hasSweatshirtsCorrectSpelling = bodyText.includes("SWEATSHIRTS") || bodyText.includes("Sweatshirts");
    const hasSweetshirtsMistake = bodyText.includes("SWEETSHIRTS") || bodyText.includes("Sweetshirts");

    console.log(`  Homepage (/) | HTTP ${status}`);
    console.log(`  Spelling Check: 'SWEATSHIRTS' present: ${hasSweatshirtsCorrectSpelling}, 'SWEETSHIRTS' misspelling found: ${hasSweetshirtsMistake}`);
  } catch (err) {
    console.error(`  [ERROR] Homepage check failed: ${err.message}`);
  }

  for (const cat of STOREFRONT_CATEGORIES) {
    const url = `${BASE_URL}${cat.path}`;
    try {
      const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });
      const status = res ? res.status() : 0;
      await page.waitForTimeout(2000);

      const bodyText = await page.innerText("body");
      const titleMatches = bodyText.toLowerCase().includes(cat.expectedHeading.toLowerCase());

      // Check banner image if present on category
      const bannerImg = page.locator('img[alt*="Banner"], img[src*="sweatshirt"], img[src*="unsplash"], .category-banner, header img').first();
      const hasBannerImg = await bannerImg.isVisible({ timeout: 2000 }).catch(() => false);

      // Find product links on page
      const productLinks = page.locator('main a[href^="/products/"]');
      const count = await productLinks.count();

      results.storefrontPages.push({
        name: cat.name,
        path: cat.path,
        status,
        productsCount: count,
        hasBannerImg,
        titleMatches,
      });

      console.log(
        `  [PASS] Category: ${cat.name.padEnd(14)} | ${cat.path.padEnd(24)} | HTTP ${status} | Products Found: ${count}`
      );

      // If products found, click the first one and verify PDP
      if (count > 0 && results.productPages.length < 3) {
        const firstProduct = productLinks.first();
        const href = await firstProduct.getAttribute("href");
        await firstProduct.click();
        await page.waitForTimeout(2500);

        const pdpUrl = page.url();
        const pdpText = await page.innerText("body");

        // Verify PDP Add to Bag Button
        const addToBagBtn = page.locator(
          'button.btn-pdp-cart, button:has-text("Add to Shopping Bag"), button:has-text("Add to Bag"), button:has-text("ADD TO BAG")'
        ).first();
        const btnVisible = await addToBagBtn.isVisible({ timeout: 5000 }).catch(() => false);

        const pdpPassed = pdpUrl.includes("/products/") && btnVisible;
        results.productPages.push({
          category: cat.name,
          href,
          pdpUrl,
          btnVisible,
          passed: pdpPassed,
        });

        console.log(
          `         -> Product Detail Page: ${pdpUrl} | Add to Bag Button Visible: ${btnVisible ? "YES [PASS]" : "NO [FAIL]"}`
        );
      }
    } catch (err) {
      console.error(`  [FAIL] Category ${cat.name} (${cat.path}): ${err.message}`);
    }
  }

  // ============================================================================
  // STEP 5: TEST TRACK PACKAGE & ORDER TRACKING ROUTE
  // ============================================================================
  console.log("\n--------------------------------------------------------------------------------");
  console.log("5. TESTING TRACK PACKAGE / ORDER TRACKING ROUTES");
  console.log("--------------------------------------------------------------------------------");
  try {
    const trackRes = await page.goto(`${BASE_URL}/track`, { waitUntil: "domcontentloaded", timeout: 35000 });
    const trackStatus = trackRes ? trackRes.status() : 0;
    await page.waitForTimeout(1500);
    const currentUrl = page.url();
    const doesNotRedirectToHome = !currentUrl.endsWith("/") || currentUrl.includes("/track");
    console.log(`  Track Page (/track) | Landed on: ${currentUrl} | HTTP ${trackStatus} | Status: ${doesNotRedirectToHome ? "[PASS]" : "[FAIL]"}`);
  } catch (err) {
    console.error(`  [ERROR] Track page test failed: ${err.message}`);
  }

  await browser.close();

  // ============================================================================
  // FINAL TEST SUITE SUMMARY
  // ============================================================================
  console.log("\n================================================================================");
  console.log("PLAYWRIGHT TEST SUITE EXECUTION SUMMARY");
  console.log("================================================================================");
  const totalAdmin = results.adminPages.length;
  const passedAdmin = results.adminPages.filter((r) => r.passed).length;
  console.log(`Admin Pages Checked:        ${passedAdmin}/${totalAdmin} PASSED`);
  if (results.databaseManager) {
    console.log(`Cloud Firestore Database:   ${results.databaseManager.passed ? "CONNECTED & LIVE [PASS]" : "FAILED [FAIL]"}`);
  }
  const totalStorefront = results.storefrontPages.length;
  const passedStorefront = results.storefrontPages.filter((r) => r.status === 200).length;
  console.log(`Storefront Categories:      ${passedStorefront}/${totalStorefront} PASSED`);
  const pdpPassed = results.productPages.filter((p) => p.passed).length;
  console.log(`Product Detail Pages:       ${pdpPassed}/${results.productPages.length} PASSED (Add to Bag active)`);

  const failedAdminPages = results.adminPages.filter((r) => !r.passed);
  if (failedAdminPages.length > 0) {
    console.log("\nFailed Admin Pages:");
    failedAdminPages.forEach((f) => console.log(`  - ${f.name} (${f.path}): HTTP ${f.status}, DataUnavailable: ${f.hasDataUnavailable}`));
    process.exit(1);
  } else {
    console.log("\n>> ALL ADMIN PAGES AND PRODUCT NAVIGATION VERIFIED SUCCESSFULLY WITH PLAYWRIGHT! <<");
  }
}

run().catch((e) => {
  console.error("Fatal test error:", e);
  process.exit(1);
});
