import { expect, type Browser, type Page } from '@playwright/test';

export type IdentifiantsAdmin = {
  email: string;
  motDePasse: string;
};

export function identifiantsAdminDepuisEnvironnement(): IdentifiantsAdmin {
  const email = process.env.KOSMO_ADMIN_EMAIL;
  const motDePasse = process.env.KOSMO_ADMIN_PASSWORD;

  if (!email || !motDePasse) {
    throw new Error(
      'KOSMO_ADMIN_EMAIL et KOSMO_ADMIN_PASSWORD doivent être définis pour se connecter.',
    );
  }

  return { email, motDePasse };
}

export async function authentifierAdmin(
  page: Page,
  identifiants: IdentifiantsAdmin = identifiantsAdminDepuisEnvironnement(),
): Promise<void> {
  await page.goto('/admin/authentication');
  await page.getByRole('textbox', { name: 'Email' }).fill(identifiants.email);
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill(identifiants.motDePasse);
  await page.getByRole('button', { name: 'Connexion' }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

export async function creerEtatAuthentification(
  browser: Browser,
  cheminEtat = 'playwright/.auth/admin.json',
  identifiants: IdentifiantsAdmin = identifiantsAdminDepuisEnvironnement(),
): Promise<void> {
  const context = await browser.newContext();
  const page = await context.newPage();

  await authentifierAdmin(page, identifiants);
  await context.storageState({ path: cheminEtat });
  await context.close();
}