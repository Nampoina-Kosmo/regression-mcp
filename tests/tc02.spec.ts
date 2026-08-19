import { test } from '@playwright/test';
import { authentifierAdmin } from '../globales/authentification';
import { creerAvoirDepuisFacture } from '../globales/creation_avoir';
import { trouverFactureAvecLivraison } from '../globales/recherche_facture_livraison';

test('TC02 - Générer un avoir contenant des frais de livraison', async ({ page }) => {
  test.setTimeout(120000);
  await authentifierAdmin(page);
  const { numeroFacture, livraison } = await trouverFactureAvecLivraison(page);
  await creerAvoirDepuisFacture(page, {
    titreDevis: numeroFacture,
    livraisonAttendue: livraison,
  }, {
    skipInvoiceLookup: true,
  });
});
