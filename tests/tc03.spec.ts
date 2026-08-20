import { expect, test } from '@playwright/test';
import { authentifierAdmin } from '../globales/authentification';
import {
  creerAvoirDepuisFacture,
  lireLivraison,
  lireTotalHT,
} from '../globales/creation_avoir';
import { trouverFactureAvecLivraison } from '../globales/recherche_facture_livraison';

test('TC03 - Vérification du montant HT sur un avoir avec livraison', async ({ page }) => {
  test.setTimeout(180000);
  await authentifierAdmin(page);

  const { numeroFacture, livraison } = await trouverFactureAvecLivraison(page);
  await expect(page).toHaveURL(/\/admin\/invoices#\d+/, { timeout: 15000 });

  const totalHtFacture = await lireTotalHT(page);

  await creerAvoirDepuisFacture(page, {
    titreDevis: numeroFacture,
    livraisonAttendue: livraison,
  }, {
    skipInvoiceLookup: true,
  });

  await expect(page).toHaveURL(/\/admin\/credit_notes\/credit_note\/\d+\/\d+/, {
    timeout: 30000,
  });

  const livraisonAvoir = await lireLivraison(page);
  if (livraisonAvoir !== livraison) {
    throw new Error(
      `KO TC03: la livraison n'est pas identique. Facture: ${livraison}, Avoir: ${livraisonAvoir}.`,
    );
  }

  const totalHtAvoir = await lireTotalHT(page);
  if (totalHtAvoir !== totalHtFacture) {
    throw new Error(
      `KO TC03: le Total HT n'est pas identique. Facture: ${totalHtFacture}, Avoir: ${totalHtAvoir}.`,
    );
  }
});
