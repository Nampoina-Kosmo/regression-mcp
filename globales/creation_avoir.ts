import { expect, type Locator, type Page } from '@playwright/test';

export type CreationAvoir = {
  titreDevis: string;
  livraisonAttendue?: number;
};

export async function creerAvoirDepuisFacture(
  page: Page,
  donnees: CreationAvoir,
): Promise<string> {
  await page.goto('/admin/invoices');

  const recherche = page.getByRole('searchbox').last();
  await recherche.fill(donnees.titreDevis);

  const ligneFacture = page.getByRole('row').filter({ hasText: donnees.titreDevis }).first();
  await expect(ligneFacture).toBeVisible({ timeout: 15000 });
  await ligneFacture.getByRole('link', { name: /^FCT-/ }).click();
  await expect(page).toHaveURL(/\/admin\/invoices#\d+/);
  await expect(page.getByRole('heading', { name: /^FCT-/ }).first()).toBeVisible({
    timeout: 15000,
  });

  const livraisonFacture = await lireLivraison(page);
  if (donnees.livraisonAttendue !== undefined) {
    expect(livraisonFacture).toBe(donnees.livraisonAttendue);
  }

  await page.getByRole('button', { name: 'Options' }).click();
  await page.locator('#invoice_create_credit_note').click();

  const confirmation = page.locator('#confirm-invoice-credit-note');
  if (await confirmation.count() > 0) {
    await expect(confirmation).toBeVisible({ timeout: 10000 });
    await confirmation.scrollIntoViewIfNeeded();
    await confirmation.click();
  }

  await expect(page).toHaveURL(/\/admin\/credit_notes\/credit_note\/\d+\/\d+/, {
    timeout: 20000,
  });

  await page.waitForTimeout(5000);
  const tableau = page.locator('table').filter({ hasText: 'Total HT :' });
  const ligneLivraison = page
    .getByRole('cell', { name: 'Livraison', exact: true })
    .last()
    .locator('..');

  if (livraisonFacture > 0 && await ligneLivraison.count() === 0) {
    throw new Error(
      `KO TC01: la facture source contient Livraison ${livraisonFacture.toFixed(2)} €, ` +
      'mais aucune ligne Livraison n\'a été créée sur l\'avoir.',
    );
  }

  if (livraisonFacture > 0) {
    const montantLivraisonAvoir = await lireMontantLigne(ligneLivraison);
    expect(montantLivraisonAvoir).toBe(livraisonFacture);
  }

  await page.getByRole('button', { name: 'Enregistrer et envoyer' }).click();
  return page.url();
}

async function lireMontantLigne(ligne: Locator): Promise<number> {
  const texte = await ligne.locator('td').last().innerText();
  const montant = Number(texte.replace('€', '').replace(',', '.').trim());

  if (Number.isNaN(montant)) {
    throw new Error(`Montant Livraison illisible sur l’avoir: ${texte}`);
  }

  return montant;
}

async function lireLivraison(page: Page): Promise<number> {
  const ligne = page
    .getByRole('cell', { name: 'Livraison', exact: true })
    .last()
    .locator('..');

  if (await ligne.count() === 0) {
    return 0;
  }

  const texte = await ligne.locator('td').last().innerText();
  const montant = Number(texte.replace('€', '').replace(',', '.').trim());

  if (Number.isNaN(montant)) {
    throw new Error(`Montant Livraison illisible sur la facture source: ${texte}`);
  }

  return montant;
}
