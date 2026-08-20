import { expect, test, type Page } from '@playwright/test';
import { authentifierAdmin } from '../globales/authentification';
import { creerAvoirDepuisFacture } from '../globales/creation_avoir';
import { trouverFactureAvecLivraison } from '../globales/recherche_facture_livraison';

async function lireMontantLigneParLibelle(page: Page, libelle: string): Promise<number> {
  const ligne = page
    .getByRole('cell', { name: libelle, exact: true })
    .last()
    .locator('..');

  if (await ligne.count() === 0) {
    return 0;
  }

  const texte = await ligne.locator('td').last().innerText();
  const montant = Number(texte.replace('€', '').replace(',', '.').trim());

  if (Number.isNaN(montant)) {
    throw new Error(`Montant « ${libelle} » illisible: ${texte}`);
  }

  return montant;
}

test('TC04 - Vérification du montant TTC d’une ligne Livraison', async ({ page }) => {
  test.setTimeout(180000);
  await authentifierAdmin(page);

  const { numeroFacture, livraison } = await trouverFactureAvecLivraison(page);
  await expect(page).toHaveURL(/\/admin\/invoices#\d+/, { timeout: 15000 });

  const montantTTCFacture = await lireMontantLigneParLibelle(page, 'Livraison');

  await creerAvoirDepuisFacture(page, {
    titreDevis: numeroFacture,
    livraisonAttendue: livraison,
  }, {
    skipInvoiceLookup: true,
  });

  await expect(page).toHaveURL(/\/admin\/credit_notes\/credit_note\/\d+\/\d+/, {
    timeout: 30000,
  });

  const montantTTCAvoir = await lireMontantLigneParLibelle(page, 'Livraison');
  if (montantTTCAvoir !== montantTTCFacture) {
    throw new Error(
      `KO TC04: le montant TTC de la ligne Livraison n'est pas identique. Facture: ${montantTTCFacture}, Avoir: ${montantTTCAvoir}.`,
    );
  }
});
