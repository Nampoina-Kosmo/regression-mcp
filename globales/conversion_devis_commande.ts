import { expect, type Page } from '@playwright/test';

export type DonneesAcceptationDevis = {
  titre: string;
  prenom?: string;
  nom?: string;
  email?: string;
};

export async function accepterDevis(
  page: Page,
  donnees: DonneesAcceptationDevis,
): Promise<string> {
  const prenom = donnees.prenom ?? 'Nampoina';
  const nom = donnees.nom ?? 'RAKOTONDRASOA';
  const email = donnees.email ?? 'nampoina.kosmo@signarama.fr';

  await page.goto('/admin/proposals');
  const recherche = page.getByPlaceholder('Rechercher :');
  await recherche.fill(donnees.titre);

  const ligneDevis = page.getByRole('row').filter({ hasText: donnees.titre }).first();
  await expect(ligneDevis).toBeVisible({ timeout: 15000 });
  await ligneDevis.hover();

  const fichePromise = page.waitForEvent('popup');
  await ligneDevis.getByRole('link', { name: 'Voir' }).click();
  const ficheDevis = await fichePromise;
  await ficheDevis.waitForLoadState('domcontentloaded');

  await ficheDevis.getByRole('button', { name: /Accepter/i }).click({ force: true });
  const popup = ficheDevis.getByRole('dialog');
  await popup.getByRole('textbox', { name: 'Prénom' }).fill(prenom);
  await popup.getByRole('textbox', { name: 'Nom', exact: true }).fill(nom);
  await popup.getByRole('textbox', { name: 'Email' }).fill(email);

  const zoneSignature = popup.locator('canvas').last();
  const cadreSignature = await zoneSignature.boundingBox();
  if (!cadreSignature) {
    throw new Error('Zone de signature introuvable dans le popup.');
  }

  const centreX = cadreSignature.x + cadreSignature.width / 2;
  const centreY = cadreSignature.y + cadreSignature.height / 2;
  await ficheDevis.mouse.move(centreX - 30, centreY - 30);
  await ficheDevis.mouse.down();
  await ficheDevis.mouse.move(centreX + 30, centreY + 30, { steps: 10 });
  await ficheDevis.mouse.up();
  await ficheDevis.mouse.move(centreX + 30, centreY - 30);
  await ficheDevis.mouse.down();
  await ficheDevis.mouse.move(centreX - 30, centreY + 30, { steps: 10 });
  await ficheDevis.mouse.up();

  await popup.getByRole('button', { name: 'signer' }).click();
  await expect(
    ficheDevis.locator('#summary').getByText('Acceptée', { exact: true }),
  ).toBeVisible({ timeout: 15000 });

  return ficheDevis.url();
}

export const convertirDevisEnCommande = accepterDevis;
