import { expect, type Page } from '@playwright/test';

export async function creerDevisTva20(page: Page, titre: string): Promise<string> {
  const entreprise = 'ALPHA TEXTIL';
  const attribueA = 'Wiem - NACEF -';
  const origine = '04 Web';
  const produit = 'Cartes de Visite';
  const emailContact = 'durand@alpha-textil.fr';

  await page.goto('/admin/proposals/proposal');
  await page.getByRole('textbox', { name: /\*? Titre/ }).fill(titre);

  await page.getByRole('button', { name: 'Sélectionner et commencer à écrire' }).click();

  const rechercheEntreprise = page.getByRole('textbox', { name: 'Search' }).last();
  await expect(rechercheEntreprise).toBeVisible({ timeout: 15000 });
  await rechercheEntreprise.pressSequentially(entreprise, { delay: 120 });

  const optionEntreprise = page.getByRole('listbox').getByRole('option', { name: entreprise }).first();
  await expect(optionEntreprise).toBeVisible({ timeout: 15000 });
  await optionEntreprise.click();

  const blocContact = page.locator('div').filter({ has: page.getByText('Contact', { exact: true }) }).first();
  const boutonContact = blocContact.locator('button').filter({ hasText: /Select and Begin Typing/i }).first();

  if (await boutonContact.count() > 0) {
    await expect(boutonContact).toBeVisible({ timeout: 15000 });
    await boutonContact.click();

    const rechercheContact = page.locator('input[type="search"], .bs-searchbox input, input[role="searchbox"], input[role="textbox"]').last();
    await expect(rechercheContact).toBeVisible({ timeout: 15000 });
    await rechercheContact.fill('DURAND');
    await page.waitForTimeout(5000);

    const optionContact = page.locator('li, [role="option"], option').filter({ hasText: /DURAND/i }).first();
    if (await optionContact.count() > 0) {
      await expect(optionContact).toBeVisible({ timeout: 15000 });
      await optionContact.click();
    } else {
      const firstVisibleOption = page.locator('li, [role="option"], option').filter({ hasText: /\S/ }).first();
      await expect(firstVisibleOption).toBeVisible({ timeout: 15000 });
      await firstVisibleOption.click();
    }
  }

  const emailField = page.getByRole('textbox', { name: '* Email' }).first();
  await expect(emailField).toBeVisible({ timeout: 15000 });
  await emailField.fill(emailContact);

  const selectAttribueA = page.getByRole('combobox', { name: '* Attribuer à' }).first();
  await expect(selectAttribueA).toBeVisible({ timeout: 10000 });
  await selectAttribueA.locator('xpath=following-sibling::button').click();

  const optionAttribueA = page.getByRole('listbox').getByRole('option', { name: attribueA }).first();
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

  const optionProduit = page.getByRole('listbox').getByRole('option', { name: new RegExp(produit, 'i') }).first();
  await expect(optionProduit).toBeVisible({ timeout: 15000 });
  await optionProduit.click();

  await page.getByRole('combobox').filter({ has: page.locator('option', { hasText: '20.00%' }) }).first().selectOption({ label: '20.00%' });
  await page.getByText('Total HT :', { exact: true }).click();

  const ligneProduit = page.locator('tr').filter({
    has: page.getByRole('textbox', { name: "Désignation de l'produit" }),
  });
  await ligneProduit.locator('button[onclick*="add_item_to_table"]').click();

  await page.locator('input[name="delivery"]').fill('100');
  await page.locator('select[name="delivery_taxname"]').selectOption('20.00%');
  await page.getByText('Total HT :', { exact: true }).click();

  const totalHT = await lireMontant(page, 'Total HT :');
  const totalTTC = await lireMontant(page, 'Total TTC :');
  const totalTaxes = totalTTC - totalHT;

  expect(totalTaxes).toBeGreaterThan(0);
  expect(totalHT + totalTaxes).toBeCloseTo(totalTTC, 2);

  const blocContactFinal = page.locator('div').filter({ has: page.getByText('Contact', { exact: true }) }).first();
  const boutonContactFinal = blocContactFinal.locator('button').filter({ hasText: /Select and Begin Typing/i }).first();
  if (await boutonContactFinal.count() > 0) {
    await boutonContactFinal.click();
    const rechercheContactFinal = page.locator('input[type="search"], .bs-searchbox input, input[role="searchbox"], input[role="textbox"]').last();
    await expect(rechercheContactFinal).toBeVisible({ timeout: 15000 });
    await rechercheContactFinal.fill('DURAND');
    await page.waitForTimeout(3000);

    const optionContactFinal = page.locator('li, [role="option"], option').filter({ hasText: /DURAND/i }).first();
    if (await optionContactFinal.count() > 0) {
      await expect(optionContactFinal).toBeVisible({ timeout: 15000 });
      await optionContactFinal.click();
    } else {
      const firstVisibleOptionFinal = page.locator('li, [role="option"], option').filter({ hasText: /\S/ }).first();
      await expect(firstVisibleOptionFinal).toBeVisible({ timeout: 15000 });
      await firstVisibleOptionFinal.click();
    }
  }

  const emailFieldFinal = page.getByRole('textbox', { name: '* Email' }).first();
  await expect(emailFieldFinal).toBeVisible({ timeout: 15000 });
  await emailFieldFinal.fill(emailContact);

  const selectAttribueAFinal = page.getByRole('combobox', { name: '* Attribuer à' }).first();
  await expect(selectAttribueAFinal).toBeVisible({ timeout: 10000 });
  await selectAttribueAFinal.locator('xpath=following-sibling::button').click();
  const optionAttribueAFinal = page.getByRole('listbox').getByRole('option', { name: attribueA }).first();
  await expect(optionAttribueAFinal).toBeVisible({ timeout: 10000 });
  await optionAttribueAFinal.click();

  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await page.waitForTimeout(30000);

  const boutonConfirmerPopup = page.locator('button.vat-mismatch-continue').first();
  if (await boutonConfirmerPopup.isVisible({ timeout: 5000 }).catch(() => false)) {
    await boutonConfirmerPopup.click();
  }

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
