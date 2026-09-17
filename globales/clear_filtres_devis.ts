import { expect, type Page } from '@playwright/test';

export async function clearFiltresDevis(page: Page): Promise<void> {
  await page.goto('https://frhq.kosmopos.com/admin/proposals');

  const boutonFiltre = page.locator('button.btn.btn-default.dropdown-toggle').filter({
    has: page.locator('i.fa.fa-filter'),
  }).first();

  await expect(boutonFiltre).toBeVisible({ timeout: 15000 });
  await boutonFiltre.click();

  const lienClearAll = page.locator('a.all.allcheckbox[data-cview="all"]').first();
  await expect(lienClearAll).toBeVisible({ timeout: 15000 });
  await lienClearAll.click();
  await page.waitForTimeout(5000);

  await boutonFiltre.click();
}
