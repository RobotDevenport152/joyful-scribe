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

  // Click checkout and assert navigation
  await checkoutLink.click();
  await page.waitForURL(/.*\/checkout/, { timeout: 5000 });
  expect(page.url()).toMatch(/\/checkout$/);
});
