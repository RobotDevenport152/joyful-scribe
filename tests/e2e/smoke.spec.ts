import { test, expect } from '@playwright/test';

test('smoke: browse, add to cart, checkout', async ({ page }) => {
  await page.goto('/shop');

  // Wait for a product link and open the first product.
  await page.waitForSelector('a[href^="/product/"]');
  await page.click('a[href^="/product/"]');
  await page.waitForURL(/\/product\//, { timeout: 5000 });

  // Many featured products require a size/variant selection before they can be added.
  // Pick the first visible variant when present so this flow works across products.
  const variantButton = page
    .locator('button')
    .filter({
      hasText: /^(Single|King Single|Queen|King|Super King|Chinese Single|Chinese Double|Chinese Queen|Chinese King|S|M|L|XL)$/,
    })
    .first();

  if (await variantButton.count()) {
    await variantButton.click();
  }

  // Wait for Add to Cart button (English or Chinese)
  const addBtn = page.getByRole('button', { name: /Add to Cart|加入购物车/ });
  await addBtn.waitFor({ state: 'visible', timeout: 5000 });
  await addBtn.click();

  // Drawer should open and show Checkout button
  const checkoutLink = page.getByRole('link', { name: /Checkout|去结账|去结算/ });
  await checkoutLink.waitFor({ state: 'visible', timeout: 5000 });

  // Click checkout - the route is protected, so we may land on /checkout
  // directly or get redirected to /login first.
  await checkoutLink.click();
  await page.waitForURL(/\/(checkout|login)/, { timeout: 5000 });

  if (page.url().includes('/login')) {
    const LOGIN_EMAIL = process.env.TEST_EMAIL;
    const LOGIN_PW = process.env.TEST_PASSWORD;
    if (!LOGIN_EMAIL || !LOGIN_PW) {
      test.skip(true, 'TEST_EMAIL/TEST_PASSWORD env vars required to exercise the login redirect');
    }
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PW);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(checkout|order-success)/, { timeout: 8000 });
  }

  expect(page.url()).toMatch(/\/(checkout|order-success)/);
});
