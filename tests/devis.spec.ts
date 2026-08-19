import { test } from '@playwright/test';
import { authentifierAdmin } from '../globales/authentification';
import { accepterDevis } from '../globales/conversion_devis_commande';
import { creerDevis } from '../globales/creation_devis';

test('créer un devis puis accepter le devis', async ({ page }) => {
  await authentifierAdmin(page);
  const titre = `TEST-${Date.now()}`;
  await creerDevis(page, { titre });
  await accepterDevis(page, { titre });
});
