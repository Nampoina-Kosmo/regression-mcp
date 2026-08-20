import { expect, type Locator, type Page } from '@playwright/test';

export type CreationAvoir = {
  titreDevis: string;
  livraisonAttendue?: number;
};

export type OptionsCreationAvoir = {
  skipInvoiceLookup?: boolean;
};

export async function creerAvoirDepuisFacture(
  page: Page,
  donnees: CreationAvoir,
  options: OptionsCreationAvoir = {},
): Promise<string> {
  if (!options.skipInvoiceLookup) {
    await page.goto('/admin/invoices');

    const boutonFiltrer = page.getByRole('button', { name: /Filtrer par|Filter by/i }).first();
    if (await boutonFiltrer.count() > 0) {
      await boutonFiltrer.click();

      const boutonClearAll = page.getByRole('button', { name: /Clear All|Effacer tout|Tout effacer/i }).first();
      if (await boutonClearAll.count() > 0) {
        await boutonClearAll.click();
      }

      await page.locator('body').click({ position: { x: 10, y: 10 } });
    }

    const recherche = page.getByRole('searchbox').last();
    await recherche.fill(donnees.titreDevis);

    const ligneFacture = page.getByRole('row').filter({ hasText: donnees.titreDevis }).first();
    await expect(ligneFacture).toBeVisible({ timeout: 15000 });
    await ligneFacture.getByRole('link', { name: /^FCT-/ }).click();
  }

  await expect(page).toHaveURL(/\/admin\/invoices(?:\/list_invoices\/\d+)?(?:#\d+)?/);
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

export async function lireLivraison(page: Page): Promise<number> {
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

export async function lireTotalHT(page: Page): Promise<number> {
  const libelle = page.getByRole('cell', { name: 'Total HT', exact: true }).last();
  await expect(libelle).toBeVisible({ timeout: 15000 });

  const ligne = libelle.locator('xpath=ancestor::tr[1]');
  const cellule = ligne.locator('td').last();

  const texte = await cellule.innerText();
  const montant = Number(texte.replace('€', '').replace(',', '.').trim());

  if (Number.isNaN(montant)) {
    throw new Error(`Montant Total HT illisible: ${texte}`);
  }

  return montant;
}
