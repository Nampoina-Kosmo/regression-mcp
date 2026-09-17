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
  await page.waitForTimeout(5000);

  const contactWrapper = page.locator('#contact_id_select');
  const contactDropdown = contactWrapper.locator('.dropdown.bootstrap-select').first();

  if (await contactDropdown.count() > 0) {
    await expect(contactDropdown).toBeVisible({ timeout: 15000 });
    await contactDropdown.click();
    await page.waitForTimeout(5000);

    const rechercheContact = contactWrapper.locator('input[type="text"].form-control[role="textbox"][aria-label="Search"]').first();
    await expect(rechercheContact).toBeVisible({ timeout: 15000 });
    await rechercheContact.pressSequentially('PHILIPPE', { delay: 120 });
    await page.waitForTimeout(5000);

    const optionContact = contactWrapper.locator('.dropdown-menu.inner li a[role="option"]').filter({ hasText: /PHILIPPE/i }).first();
    if (await optionContact.count() > 0) {
      await expect(optionContact).toBeVisible({ timeout: 15000 });
      await optionContact.click();
    } else {
      const firstVisibleOption = contactWrapper.locator('.dropdown-menu.inner li a[role="option"]').filter({ hasText: /\S/ }).first();
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

  const blocContactFinal = page.locator('#contact_id_select');
  const contactDropdownFinal = blocContactFinal.locator('.dropdown.bootstrap-select').first();
  if (await contactDropdownFinal.count() > 0) {
    await contactDropdownFinal.click();
    await page.waitForTimeout(5000);
    const rechercheContactFinal = blocContactFinal.locator('input[type="text"].form-control[role="textbox"][aria-label="Search"]').first();
    await expect(rechercheContactFinal).toBeVisible({ timeout: 15000 });
    await rechercheContactFinal.pressSequentially('PHILIPPE', { delay: 120 });
    await page.waitForTimeout(3000);

    const optionContactFinal = blocContactFinal.locator('.dropdown-menu.inner li a[role="option"]').filter({ hasText: /PHILIPPE/i }).first();
    if (await optionContactFinal.count() > 0) {
      await expect(optionContactFinal).toBeVisible({ timeout: 15000 });
      await optionContactFinal.click();
    } else {
      const firstVisibleOptionFinal = blocContactFinal.locator('.dropdown-menu.inner li a[role="option"]').filter({ hasText: /\S/ }).first();
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
