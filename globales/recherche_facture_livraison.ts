import { expect, type Page } from '@playwright/test';
import { lireLivraison } from './creation_avoir';

export type FactureAvecLivraison = {
  numeroFacture: string;
  livraison: number;
};

export async function trouverFactureAvecLivraison(
  page: Page,
  maxLignesAParcourir = 30,
): Promise<FactureAvecLivraison> {
  await page.goto('/admin/invoices');

  const selecteurPagination = page.getByRole('combobox').first();
  await selecteurPagination.selectOption('Tous');

  const lignes = page.getByRole('row').filter({
    has: page.getByRole('link', { name: /^FCT-/ }),
  });
  await expect(lignes.first()).toBeVisible({ timeout: 15000 });

  const nombreLignes = Math.min(await lignes.count(), maxLignesAParcourir);

  for (let index = 0; index < nombreLignes; index += 1) {
    const lienFacture = lignes.nth(index).getByRole('link', { name: /^FCT-/ });
    const numeroFacture = (await lienFacture.innerText()).trim();
    await lienFacture.click();
    await expect(page).toHaveURL(/\/admin\/invoices(?:\/list_invoices\/\d+)?(?:#\d+)?/);
    await expect(
      page.getByRole('heading', { name: numeroFacture }).first(),
    ).toBeVisible({ timeout: 15000 });

    const livraison = await lireLivraison(page);
    if (livraison > 0) {
      return { numeroFacture, livraison };
    }
  }

  throw new Error(
    `KO TC02: aucune facture avec une ligne Livraison > 0 n'a été trouvée parmi les ${nombreLignes} premières factures.`,
  );
}
