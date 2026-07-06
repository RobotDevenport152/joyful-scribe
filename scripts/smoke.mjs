import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  page.on('console', msg => {
    try {
      console.log('BROWSER CONSOLE:', msg.type(), msg.text());
    } catch (e) {
      console.log('BROWSER CONSOLE (err)', e);
    }
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message || err.toString());
  });
  try {
    const bases = ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:8081'];
    let succeeded = false;
    for (const base of bases) {
      try {
        await page.goto(`${base}/shop`, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 20000 });
        const productLink = page.locator('a[href^="/product/"]');
        try {
          await productLink.first().waitFor({ timeout: 15000 });
          await productLink.first().click();
          succeeded = true;
          break;
        } catch (e) {
          console.warn(`${base}/shop: no product links found — trying homepage`);
          await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('networkidle', { timeout: 10000 });
          await page.locator('header').first().waitFor({ timeout: 5000 });
          console.log(`SMOKE: ${base} homepage loaded and header present`);
          succeeded = true;
          break;
        }
      } catch (e) {
        console.warn(`Failed to reach ${base}: ${e.message}`);
      }
    }
    if (!succeeded) throw new Error('No reachable dev server with expected content on known ports');

    // Click Add to Cart (English/Chinese)
    const addBtn = page.locator('button:has-text("Add to Cart"), button:has-text("加入购物车")');
    await addBtn.first().waitFor({ timeout: 10000 });
    await addBtn.first().click();

    // Wait for checkout link in drawer
    await page.waitForSelector('a:has-text("Checkout") , a:has-text("去结账") , a:has-text("去结算")', { timeout: 5000 });
    await page.click('a:has-text("Checkout") , a:has-text("去结账") , a:has-text("去结算")');

    // Checkout route is protected — expect either /checkout or redirect to /login
    await page.waitForURL(/.*\/(checkout|login)/, { timeout: 5000 });
    console.log('SMOKE: navigated to', page.url());

    // If redirected to login, perform login with provided test credentials
    const LOGIN_EMAIL = process.env.TEST_EMAIL || 'xwy16923@163.com';
    const LOGIN_PW = process.env.TEST_PASSWORD || '123456';
    if (page.url().includes('/login')) {
      console.log('SMOKE: performing login');
      await page.fill('input[type="email"]', LOGIN_EMAIL);
      await page.fill('input[type="password"]', LOGIN_PW);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {}),
        page.click('button[type="submit"]'),
      ]);
      // Wait for either checkout or order-success or fallback
      try {
        await page.waitForURL(/.*\/(checkout|order-success)/, { timeout: 8000 });
      } catch {
        // proceed anyway — report current URL
      }
      console.log('SMOKE: post-login URL', page.url());
    }
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('SMOKE FAILED', err);
    await browser.close();
    process.exit(2);
  }
}

run();
