import { expect, test, type Page } from '@playwright/test';
import { authentifierAdmin } from '../globales/authentification';
import { creerAvoirDepuisFacture, lireTotalHT } from '../globales/creation_avoir';
import { trouverFactureAvecLivraison } from '../globales/recherche_facture_livraison';

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

test('TC05 - Vérification des totaux d’un avoir', async ({ page }) => {
  test.setTimeout(180000);
  await authentifierAdmin(page);

  const { numeroFacture, livraison } = await trouverFactureAvecLivraison(page);
  await expect(page).toHaveURL(/\/admin\/invoices(?:\/list_invoices\/\d+)?(?:#\d+)?/, { timeout: 15000 });

  const totalHtFacture = await lireTotalHT(page);
  const totalTvaFacture = await lireMontantRecap(page, /^TVA/i);
  const totalTtcFacture = await lireMontantRecap(page, /^Total TTC/i);

  await creerAvoirDepuisFacture(page, {
    titreDevis: numeroFacture,
    livraisonAttendue: livraison,
  }, {
    skipInvoiceLookup: true,
  });

  await expect(page).toHaveURL(/\/admin\/credit_notes\/credit_note\/\d+\/\d+/, {
    timeout: 30000,
  });

  const totalHtAvoir = await lireTotalHT(page);
  const totalTvaAvoir = await lireMontantRecap(page, /^TVA/i);
  const totalTtcAvoir = await lireMontantRecap(page, /^Total TTC/i);

  expect(totalHtAvoir).toBeCloseTo(totalHtFacture, 2);
  expect(totalTvaAvoir).toBeCloseTo(totalTvaFacture, 2);
  expect(totalTtcAvoir).toBeCloseTo(totalTtcFacture, 2);
});
