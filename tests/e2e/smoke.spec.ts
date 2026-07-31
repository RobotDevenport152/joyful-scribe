import { test, expect } from '@playwright/test';

test('smoke: browse, add to cart, checkout', async ({ page }) => {
  await page.goto('/shop');

  // Wait for the grid to render, then collect every product href up front.
  // The catalog can (and does) contain out-of-stock products, so blindly
  // clicking the first one isn't reliable — walk them in order and use the
  // first one whose own product page actually has a working Add to Cart
  // button, rather than trusting the shop grid's disabled state (which used
  // to be able to disagree with the product page's own stock check).
  await page.waitForSelector('a[href^="/product/"]');
  const hrefs = await page
    .locator('a[href^="/product/"]')
    .evaluateAll((els) => [...new Set(els.map((el) => el.getAttribute('href')))]);

  const MAX_PRODUCTS_TO_TRY = 5;
  let addBtn: ReturnType<typeof page.getByRole> | undefined;

  for (const href of hrefs.slice(0, MAX_PRODUCTS_TO_TRY)) {
    await page.goto(href!);
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

    // A product page renders exactly one Add to Cart button when in stock,
    // and none (a disabled "Sold Out" button instead) when it isn't — so a
    // successful match here is a trustworthy signal, unlike the shop grid.
    // Locator.isVisible() checks immediately and does NOT poll — unlike
    // waitFor(), it won't wait for the product data to finish loading, so it
    // was returning false on every product before React had rendered
    // anything. waitFor() polls for up to the given timeout instead.
    const candidate = page.getByRole('button', { name: /^(Add to Cart|加入购物车)$/ });
    const found = await candidate
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (found) {
      addBtn = candidate;
      break;
    }
  }

  expect(addBtn, `no in-stock product found in the first ${MAX_PRODUCTS_TO_TRY} shop listings`).toBeTruthy();
  await addBtn!.click();

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
