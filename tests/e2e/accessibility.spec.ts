import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// jsx-a11y (eslint.config.js) catches JSX-level issues statically; this
// catches what only exists once the page actually renders — computed
// accessible names, focus order, color contrast. Scoped to critical/serious
// impact so it fails CI on real bugs without blocking on the long tail of
// moderate/minor findings that need a dedicated audit pass.
//
// color-contrast is excluded: the brand's gold accent and footer muted-text
// tokens fail AA almost everywhere they're used as text (~2.6:1 of a
// required 4.5:1). Fixing that means darkening on-brand colors used
// throughout the site — a visual-design decision, deferred pending a
// dedicated pass rather than fixed incidentally here. Tracked debt, same
// pattern as the any-related eslint downgrades in eslint.config.js.
const pages = ['/', '/shop', '/login'];

for (const path of pages) {
  test(`a11y: ${path} has no critical/serious axe violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (v) => (v.impact === 'critical' || v.impact === 'serious') && v.id !== 'color-contrast',
    );

    if (blocking.length) {
      console.log(JSON.stringify(blocking, null, 2));
    }
    expect(blocking, `critical/serious a11y violations on ${path}`).toEqual([]);
  });
}
