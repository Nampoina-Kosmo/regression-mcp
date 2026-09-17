import { expect, test, type Page } from '@playwright/test';
import { authentifierAdmin } from '../globales/authentification';
import { clearFiltresDevis } from '../globales/clear_filtres_devis';
import { creerDevisTva10 } from '../globales/creation_devis_variante_tc11';
import { accepterDevis } from '../globales/conversion_devis_commande';
import { convertirCommandeEnFacture } from '../globales/conversion_commande_facture';
import { creerAvoirDepuisFacture, lireTotalHT } from '../globales/creation_avoir_variante_tc10';

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

test('TC11 - Création devis variante TVA 10 %', async ({ page }) => {
  test.setTimeout(180000);
  await authentifierAdmin(page);

  await clearFiltresDevis(page);

  const titre = `TEST-TC11-${Date.now()}`;

  await creerDevisTva10(page, titre);

  await clearFiltresDevis(page);

  await accepterDevis(page, { titre });
  await convertirCommandeEnFacture(page, { titreDevis: titre });

  await expect(page).toHaveURL(/\/admin\/invoices(?:\/list_invoices\/\d+)?(?:#\d+)?/, {
    timeout: 15000,
  });

  const totalHtFacture = await lireTotalHT(page);
  const totalTvaFacture = await lireMontantRecap(page, /(TVA|OMRI)/i);
  expect(totalHtFacture).toBeGreaterThan(0);
  expect(totalTvaFacture).toBeGreaterThan(0);

  await creerAvoirDepuisFacture(page, {
    titreDevis: titre,
  }, {
    skipInvoiceLookup: true,
  });

  await expect(page).toHaveURL(/\/admin\/credit_notes\/credit_note\/\d+\/\d+/, {
    timeout: 30000,
  });

  const totalHtAvoir = await lireTotalHT(page);
  const totalTvaAvoir = await lireMontantRecap(page, /(TVA|OMRI)/i);
  const tauxTvaAppliqueAvoir = totalHtAvoir > 0 ? totalTvaAvoir / totalHtAvoir : 0;

  expect(totalHtAvoir).toBeGreaterThan(0);
  expect(totalTvaAvoir).toBeGreaterThan(0);
  expect(tauxTvaAppliqueAvoir).toBeCloseTo(0.1, 2);
});
