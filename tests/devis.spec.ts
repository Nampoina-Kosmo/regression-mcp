import { test } from '@playwright/test';
import { authentifierAdmin } from '../globales/authentification';
import { creerDevis } from '../globales/creation_devis';

test('créer un devis', async ({ page }) => {
  await authentifierAdmin(page);
  await creerDevis(page, { titre: `TEST-${Date.now()}` });
});
