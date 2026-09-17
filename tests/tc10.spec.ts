import { expect, test, type Page } from '@playwright/test';
import { authentifierAdmin } from '../globales/authentification';
import { accepterDevis } from '../globales/conversion_devis_commande';
import { convertirCommandeEnFacture } from '../globales/conversion_commande_facture';
import { creerAvoirDepuisFacture, lireLivraison, lireTotalHT } from '../globales/creation_avoir';
import { creerDevisTva20 } from '../globales/creation_devis_variante_tc10';

async function lireMontantRecap(page: Page, libelle: RegExp): Promise<number> {
  const ligne = page
    .locator('tr')
    .filter({ has: page.getByRole('cell', { name: libelle, exact: false }) })
    .last();

  await expect(ligne).toBeVisible({ timeout: 15000 });

  const cellule = ligne.locator('td').last();
  const texte = (await cellule.innerText()).trim();
  const montant = Number(texte.replace('€', '').replace(',', '.').trim());

  if (Number.isNaN(montant)) {
    throw new Error(`Montant illisible pour « ${libelle} »: ${texte}`);
  }

  return montant;
}

test('TC10 - Avoir avec livraison et TVA à 20 %', async ({ page }) => {
  test.setTimeout(180000);
  await authentifierAdmin(page);

  const titre = `TEST-TC10-${Date.now()}`;

  await creerDevisTva20(page, titre);

  await accepterDevis(page, { titre });
  await convertirCommandeEnFacture(page, { titreDevis: titre });

  await expect(page).toHaveURL(/\/admin\/invoices(?:\/list_invoices\/\d+)?(?:#\d+)?/, {
    timeout: 15000,
  });

  const livraisonFacture = await lireLivraison(page);
  const totalHtFacture = await lireTotalHT(page);
  const totalTvaFacture = await lireMontantRecap(page, /^TVA/i);
  const totalTtcFacture = await lireMontantRecap(page, /^Total TTC/i);

  expect(livraisonFacture).toBeGreaterThan(0);

  await creerAvoirDepuisFacture(page, {
    titreDevis: titre,
    livraisonAttendue: livraisonFacture,
  }, {
    skipInvoiceLookup: true,
  });

  await expect(page).toHaveURL(/\/admin\/credit_notes\/credit_note\/\d+\/\d+/, {
    timeout: 30000,
  });

  const livraisonAvoir = await lireLivraison(page);
  const totalHtAvoir = await lireTotalHT(page);
  const totalTvaAvoir = await lireMontantRecap(page, /^TVA/i);
  const totalTtcAvoir = await lireMontantRecap(page, /^Total TTC/i);

  expect(livraisonAvoir).toBe(livraisonFacture);
  expect(totalHtAvoir).toBeCloseTo(totalHtFacture, 2);
  expect(totalTvaAvoir).toBeCloseTo(totalTvaFacture, 2);
  expect(totalTtcAvoir).toBeCloseTo(totalTtcFacture, 2);
  expect(totalTtcAvoir).toBeCloseTo(totalHtAvoir + totalTvaAvoir, 2);
});
