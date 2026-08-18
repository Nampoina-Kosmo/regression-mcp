import { expect, type Page } from '@playwright/test';

export type DonneesDevis = {
  titre: string;
  entreprise?: string;
  attribueA?: string;
  origine?: string;
  produit?: string;
};

const frais = [
  { nom: 'fee_setup', taux: '1.50%' },
  { nom: 'delivery', taux: '6.00%' },
  { nom: 'financial_expenses', taux: '10.00%' },
  { nom: 'various', taux: '16.00%' },
  { nom: 'retention_charge', taux: '20.00%' },
] as const;

export async function creerDevis(
  page: Page,
  donnees: DonneesDevis,
): Promise<string> {
  const entreprise = donnees.entreprise ?? 'ALPHA TEXTIL';
  const attribueA = donnees.attribueA ?? 'Wiem - NACEF -';
  const origine = donnees.origine ?? '04 Web';
  const produit = donnees.produit ?? 'Cartes de Visite';

  await page.goto('/admin/proposals/proposal');
  await page.getByRole('textbox', { name: /\*? Titre/ }).fill(donnees.titre);

  await page.getByRole('button', { name: 'Sélectionner et commencer à écrire' }).click();
  const rechercheEntreprise = page.getByRole('textbox', { name: 'Search' });
  await rechercheEntreprise.pressSequentially(entreprise, { delay: 120 });
  const optionEntreprise = page.getByRole('listbox').getByRole('option', { name: entreprise });
  await expect(optionEntreprise).toBeVisible({ timeout: 15000 });
  await optionEntreprise.click();

  const selectAttribueA = page.getByRole('combobox', { name: '* Attribuer à' });
  await selectAttribueA.locator('xpath=following-sibling::button').click();
  const optionAttribueA = page.getByRole('listbox').getByRole('option', { name: attribueA });
  await expect(optionAttribueA).toBeVisible({ timeout: 10000 });
  await optionAttribueA.click();

  const selectOrigine = page.getByRole('combobox', { name: '* Origine de la demande' });
  await selectOrigine.locator('xpath=following-sibling::button').click();
  const optionOrigine = page.getByRole('listbox').getByRole('option', { name: origine });
  await expect(optionOrigine).toBeVisible({ timeout: 10000 });
  await optionOrigine.click();

  await page.getByRole('button', { name: 'Ajouter un produit' }).click();
  const rechercheProduit = page.getByRole('textbox', { name: 'Search' });
  await rechercheProduit.pressSequentially(produit, { delay: 120 });
  const optionProduit = page
    .getByRole('listbox')
    .getByRole('option', { name: new RegExp(produit, 'i') })
    .first();
  await expect(optionProduit).toBeVisible({ timeout: 15000 });
  await optionProduit.click();

  await page.getByRole('combobox').filter({ has: page.locator('option', { hasText: '20.00%' }) }).first().selectOption({ label: '20.00%' });
  await perdreFocus(page);
  const ligneProduit = page.locator('tr').filter({
    has: page.getByRole('textbox', { name: "Désignation de l'produit" }),
  });
  await ligneProduit.locator('button[onclick*="add_item_to_table"]').click();

  for (const fraisDevis of frais) {
    await page.locator(`input[name="${fraisDevis.nom}"]`).fill('100');
    await perdreFocus(page);
    await page.locator(`select[name="${fraisDevis.nom}_taxname"]`).selectOption(fraisDevis.taux);
    await perdreFocus(page);
  }

  await selectAttribueA.locator('xpath=following-sibling::button').click();
  const dernierOptionAttribueA = page.getByRole('listbox').getByRole('option', { name: attribueA });
  await expect(dernierOptionAttribueA).toBeVisible({ timeout: 10000 });
  await dernierOptionAttribueA.click();
  await expect(selectAttribueA.locator('option:checked')).toHaveText(attribueA);

  const totalHT = await lireMontant(page, 'Total HT :');
  const totalTTC = await lireMontant(page, 'Total TTC :');
  const taxes = await page
    .locator('table')
    .filter({ hasText: 'Total TTC :' })
    .locator('tbody tr')
    .evaluateAll((lignes) => {
      const indexTotalHT = lignes.findIndex((ligne) => ligne.textContent?.includes('Total HT'));
      const indexTotalTTC = lignes.findIndex((ligne) => ligne.textContent?.includes('Total TTC'));

      if (indexTotalHT === -1 || indexTotalTTC === -1) {
        throw new Error('Récapitulatif des montants introuvable.');
      }

      return lignes.slice(indexTotalHT + 1, indexTotalTTC).reduce((total, ligne) => {
        const montants = ligne.textContent?.match(/(\d+[,.]\d{2})\s*€/g) ?? [];
        const montant = montants.at(-1)?.replace('€', '').replace(',', '.').trim();
        return total + (montant ? Number(montant) : 0);
      }, 0);
    });

  expect(totalHT + taxes).toBeCloseTo(totalTTC, 2);
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page).toHaveURL(/\/admin\/proposals\/list_proposals\/\d+/);

  return page.url();
}

async function lireMontant(page: Page, libelle: string): Promise<number> {
  const cellule = page
    .locator('tr')
    .filter({ hasText: libelle })
    .last()
    .locator('td')
    .last();
  const texte = await cellule.innerText();
  const montant = Number(texte.replace('€', '').replace(',', '.').trim());

  if (Number.isNaN(montant)) {
    throw new Error(`Montant illisible pour « ${libelle} »: ${texte}`);
  }

  return montant;
}

async function perdreFocus(page: Page): Promise<void> {
  await page.getByText('Total HT :', { exact: true }).click();
}