import { test } from '@playwright/test';
import { authentifierAdmin } from '../globales/authentification';
import { accepterDevis } from '../globales/conversion_devis_commande';
import { creerDevis } from '../globales/creation_devis';
import { convertirCommandeEnFacture } from '../globales/conversion_commande_facture';

test('créer un devis, accepter le devis puis créer la facture', async ({ page }) => {
  test.setTimeout(60000);
  await authentifierAdmin(page);
  const titre = `TEST-${Date.now()}`;
  await creerDevis(page, { titre });
  await accepterDevis(page, { titre });
  await convertirCommandeEnFacture(page, {
    titreDevis: titre,
  });
});
