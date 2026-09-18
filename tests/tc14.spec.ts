import { expect, test } from '@playwright/test';
import { authentifierAdmin } from '../globales/authentification';
import { clearFiltresDevis } from '../globales/clear_filtres_devis';
import { clearFiltresFactures } from '../globales/clear_filtres_factures';
import { convertirCommandeEnFacture } from '../globales/conversion_commande_facture';
import { accepterDevis } from '../globales/conversion_devis_commande';
import { creerAvoirDepuisFacture } from '../globales/creation_avoir_variante_tc10';
import { creerDevisTva20Tc14 } from '../globales/creation_devis_variante_tc14';
import {
  lireTauxTvaLivraison,
  modifierDerniereLigneFactureTva15,
} from '../globales/modifier_tva_facture_variante_tc14';

test('TC14 - Modifier une ligne de facture de TVA 20 % à 1.5 % puis créer un avoir', async ({ page }) => {
  test.setTimeout(180000);
  await authentifierAdmin(page);

  await clearFiltresDevis(page);

  const titre = `TEST-TC14-${Date.now()}`;
  await creerDevisTva20Tc14(page, titre);

  await clearFiltresDevis(page);
  await accepterDevis(page, { titre });
  await convertirCommandeEnFacture(page, { titreDevis: titre });

  await clearFiltresFactures(page);
  await modifierDerniereLigneFactureTva15(page, titre);

  await creerAvoirDepuisFacture(page, { titreDevis: titre }, { skipInvoiceLookup: true });
  await expect(page).toHaveURL(/\/admin\/credit_notes\/credit_note\/\d+\/\d+/, {
    timeout: 30000,
  });

  expect(await lireTauxTvaLivraison(page)).toBeCloseTo(0, 2);
});