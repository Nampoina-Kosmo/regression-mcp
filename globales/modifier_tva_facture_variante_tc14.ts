import { expect, type Page } from '@playwright/test';

export async function modifierDerniereLigneFactureTva15(
  page: Page,
  titreFacture: string,
): Promise<string> {
  const recherche = page.getByPlaceholder('Rechercher :');
  await expect(recherche).toBeVisible({ timeout: 15000 });
  await recherche.fill(titreFacture);

  const ligneFacture = page.getByRole('row').filter({ hasText: titreFacture }).first();
  await expect(ligneFacture).toBeVisible({ timeout: 15000 });

  const lienEdition = ligneFacture.getByRole('link', { name: 'Editer' });
  await expect(lienEdition).toBeVisible({ timeout: 15000 });
  await lienEdition.click();

  await expect(page).toHaveURL(/\/admin\/invoices\/invoice\/\d+/);

  const taxesLignes = page.locator('table.invoice-items-table select[name$="[taxname][]"]');
  const taxeDerniereLigne = taxesLignes.last();
  await expect(taxeDerniereLigne).toBeVisible({ timeout: 15000 });
  await taxeDerniereLigne.selectOption('OMRI 1.5%|1.50');
  await expect(taxeDerniereLigne).toHaveValue(/1\.50$/);

  await page.locator('button.invoice-form-submit.transaction-submit').click();

  const confirmationTva = page.locator('#vat-mismatch-modal');
  if (await confirmationTva.isVisible({ timeout: 5000 }).catch(() => false)) {
    await confirmationTva.getByRole('button', { name: 'Confirmer' }).click();
  }

  await expect(page).toHaveURL(/\/admin\/invoices(?:\/list_invoices\/\d+)?(?:#\d+)?/, {
    timeout: 15000,
  });

  const identifiantFacture = page.url().match(/\/admin\/invoices\/list_invoices\/(\d+)/)?.[1];
  if (!identifiantFacture) {
    throw new Error(`Identifiant de facture introuvable après enregistrement: ${page.url()}`);
  }

  await page.goto(`/admin/invoices/list_invoices/${identifiantFacture}`);
  await expect(page.getByRole('heading', { name: /^FCT-/ }).first()).toBeVisible({
    timeout: 15000,
  });

  return page.url();
}

export async function lireTauxTvaLivraison(page: Page): Promise<number> {
  const taxeLivraison = page.locator('select[name="delivery_taxname"]');
  await expect(taxeLivraison).toBeVisible({ timeout: 15000 });

  const valeur = await taxeLivraison.inputValue();
  const correspondance = valeur.match(/\|([\d.]+)$/);

  if (!correspondance) {
    throw new Error(`Taux TVA Livraison illisible: ${valeur}`);
  }

  return Number(correspondance[1]);
}