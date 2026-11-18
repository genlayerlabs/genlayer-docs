import { test, expect } from '@playwright/test';

test('image processing presents all three visual input examples', async ({ page }) => {
  await page.goto('/developers/intelligent-contracts/features/image-processing');
  const main = page.locator('main');

  await expect(main.getByRole('heading', { name: /^Sending Images to LLMs/, level: 2 })).toBeVisible();
  await expect(main.getByRole('heading', { name: /^Sending Multiple Images/, level: 2 })).toBeVisible();
  await expect(main.getByRole('heading', { name: /^Capturing Screenshots from the Web/, level: 2 })).toBeVisible();

  const examples = main.locator('pre');
  await expect(examples).toHaveCount(3);
  await expect(examples.nth(0)).toContainText('images=[image_data]');
  await expect(examples.nth(1)).toContainText('images=[product_image, reference_image]');
  await expect(examples.nth(2)).toContainText("mode='screenshot'");
  await expect(examples.nth(2)).toContainText('images=[screenshot]');

  await main.locator('p').getByRole('link', { name: 'Calling LLMs', exact: true }).click();
  await expect(page).toHaveURL(/\/features\/calling-llms$/);
  await expect(page.getByRole('heading', { name: 'Calling LLMs', exact: true })).toBeVisible();
});
