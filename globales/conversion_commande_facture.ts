import { expect, type Page } from '@playwright/test';

export type ConversionCommandeFacture = {
  titreDevis: string;
};

export async function convertirCommandeEnFacture(
  page: Page,
  donnees: ConversionCommandeFacture,
): Promise<string> {
  await page.goto('/admin/proposals');

  const recherche = page.getByPlaceholder('Rechercher :');
  await recherche.fill(donnees.titreDevis);

  const ligneDevis = page.getByRole('row').filter({ hasText: donnees.titreDevis }).first();
  await expect(ligneDevis).toBeVisible({ timeout: 15000 });

  const nomDevis = ligneDevis.getByRole('link', { name: donnees.titreDevis, exact: true });
  await nomDevis.click();
  await expect(page).toHaveURL(/\/admin\/proposals#\d+/);

  const lienCommande = page.getByRole('link', { name: /^CDE-/ }).first();
  await expect(lienCommande).toBeVisible({ timeout: 15000 });
  await lienCommande.click();
  await expect(page).toHaveURL(/\/admin\/estimates\/list_estimates\/\d+/);
  await expect(page.getByRole('heading', { name: /^CDE-/ }).first()).toBeVisible({
    timeout: 15000,
  });

  const factureExistante = page.getByRole('link', { name: /^FCT-/ }).first();
  const boutonConversion = page.getByRole('button', { name: 'Convertir en facture' });
  await expect
    .poll(async () => (await factureExistante.count()) > 0 || (await boutonConversion.count()) > 0, {
      timeout: 15000,
    })
    .toBe(true);

  if (await factureExistante.count() > 0) {
    await factureExistante.click();
    await expect(page).toHaveURL(/\/admin\/invoices\/list_invoices\/\d+/);
    return page.url();
  }

  await boutonConversion.click();

  const optionConvertir = page.getByRole('link', { name: 'Convertir', exact: true });
  await expect(optionConvertir).toBeVisible({ timeout: 10000 });
  await optionConvertir.click();
  await expect(page).toHaveURL(/\/admin\/invoices(?:\/list_invoices\/\d+)?/);

  return page.url();
}
