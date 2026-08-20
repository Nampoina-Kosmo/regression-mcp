import { expect, test } from '@playwright/test';
import { authentifierAdmin } from '../globales/authentification';
import { accepterDevis } from '../globales/conversion_devis_commande';
import { creerDevis } from '../globales/creation_devis';
import { convertirCommandeEnFacture } from '../globales/conversion_commande_facture';
import { creerAvoirDepuisFacture, lireLivraison } from '../globales/creation_avoir';

test('TC06 - Absence de frais de livraison', async ({ page }) => {
  test.setTimeout(180000);
  await authentifierAdmin(page);

  const titre = `TEST-TC06-${Date.now()}`;

  await creerDevis(page, { titre }, {
    frais: {
      fee_setup: false,
      delivery: false,
      financial_expenses: false,
      various: false,
      retention_charge: false,
    },
  });

  await accepterDevis(page, { titre });
  await convertirCommandeEnFacture(page, { titreDevis: titre });

  await creerAvoirDepuisFacture(page, {
    titreDevis: titre,
  }, {
    skipInvoiceLookup: true,
  });

  const livraisonAvoir = await lireLivraison(page);
  if (livraisonAvoir !== 0) {
    throw new Error(
      `KO TC06: aucun frais de livraison n'était attendu, mais l'avoir contient ${livraisonAvoir} €.`,
    );
  }
});
