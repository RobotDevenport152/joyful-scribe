import { test, expect } from '@playwright/test';

test('smoke: browse, add to cart, checkout', async ({ page }) => {
  await page.goto('http://localhost:8080/shop');

  // wait for product links and open first product
  await page.waitForSelector('a[href^="/product/"]');
  await page.click('a[href^="/product/"]');

  // wait for Add to Cart button (English or Chinese)
  const addBtn = page.getByRole('button', { name: /Add to Cart|加入购物车/ });
  await addBtn.waitFor({ state: 'visible', timeout: 5000 });
  await addBtn.click();

  // Drawer should open and show 'Checkout' button
  const checkoutLink = page.getByRole('link', { name: /Checkout|去结账|去结算/ });
  await checkoutLink.waitFor({ state: 'visible', timeout: 5000 });

  // Click checkout — the route is protected, so we may land on /checkout
  // directly or get redirected to /login first.
  await checkoutLink.click();
  await page.waitForURL(/\/(checkout|login)/, { timeout: 5000 });

  if (page.url().includes('/login')) {
    const LOGIN_EMAIL = process.env.TEST_EMAIL || 'xwy16923@163.com';
    const LOGIN_PW = process.env.TEST_PASSWORD || '123456';
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PW);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(checkout|order-success)/, { timeout: 8000 });
  }

  expect(page.url()).toMatch(/\/(checkout|order-success)/);
});
