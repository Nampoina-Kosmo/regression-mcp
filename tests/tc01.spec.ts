import { test } from '@playwright/test';
import { authentifierAdmin } from '../globales/authentification';
import { accepterDevis } from '../globales/conversion_devis_commande';
import { creerDevis } from '../globales/creation_devis';
import { convertirCommandeEnFacture } from '../globales/conversion_commande_facture';
import { creerAvoirDepuisFacture } from '../globales/creation_avoir';

test('TC01 - Création d’un avoir avec frais de livraison', async ({ page }) => {
  test.setTimeout(120000);
  await authentifierAdmin(page);
  const titre = `TEST-${Date.now()}`;
  await creerDevis(page, { titre });
  await accepterDevis(page, { titre });
  await convertirCommandeEnFacture(page, { titreDevis: titre });
  await creerAvoirDepuisFacture(page, {
    titreDevis: titre,
    livraisonAttendue: 100,
  });
});
