import { test, expect } from '@playwright/test';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { listDocsRoutes } = require(path.join(process.cwd(), 'scripts', 'list-docs-routes.js'));

const routes: string[] = listDocsRoutes();

test.describe.configure({ mode: 'parallel' });

for (const route of routes) {
  test(`renders ${route}`, async ({ page }) => {
    const pageErrors: Error[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (err) => pageErrors.push(err));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      // Ignore benign resource load failures (e.g., missing images/favicons) that don't break rendering
      if (text.includes('Failed to load resource')) return;
      if (text.includes('favicon.ico')) return;
      consoleErrors.push(text);
    });

    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response && response.ok()).toBeTruthy();

    await expect(page.locator('main')).toBeVisible();
    const title = await page.title();
    expect(title).not.toEqual('');

    expect(pageErrors, `page errors on ${route}`).toEqual([]);
    expect(consoleErrors, `console errors on ${route}`).toEqual([]);
  });
}


