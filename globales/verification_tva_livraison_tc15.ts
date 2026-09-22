import { expect, type Page } from '@playwright/test';

export type TotauxFacture = {
  totalHT: number;
  totalTTC: number;
  /** Montant de TVA cumulé, par taux (%), tel qu'affiché dans le tableau des totaux de la facture. */
  tva: Map<number, number>;
};

function parseMontant(texte: string): number {
  const montant = Number(texte.replace('€', '').replace(/\s/g, '').replace(',', '.').trim());

  if (Number.isNaN(montant)) {
    throw new Error(`Montant illisible: ${texte}`);
  }

  return montant;
}

/**
 * Sélectionne le taux de TVA de la ligne Livraison (dernière ligne de la facture) sur la page
 * d'édition et enregistre. Le taux est retrouvé via l'attribut data-taxrate des options plutôt
 * que la valeur brute, car son format diffère selon les libellés de taxe ("OMRI 10%|10.00", etc.).
 */
export async function definirTauxTvaLivraison(
  page: Page,
  idFacture: string,
  tauxCible: number,
): Promise<void> {
  await page.goto(`/admin/invoices/invoice/${idFacture}`);

  const selectLivraison = page.locator('select[name="delivery_taxname"]');
  await expect(selectLivraison).toBeVisible({ timeout: 15000 });

  const valeurOption = await selectLivraison.evaluate((element, taux) => {
    const select = element as HTMLSelectElement;
    const option = Array.from(select.options).find(
      (o) => o.dataset.taxrate === taux.toFixed(2),
    );
    return option?.value ?? null;
  }, tauxCible);

  if (!valeurOption) {
    throw new Error(`Taux de TVA ${tauxCible}% introuvable dans la liste de la Livraison.`);
  }

  await selectLivraison.selectOption(valeurOption);
  await expect(selectLivraison).toHaveValue(valeurOption);
  await page.waitForTimeout(5000);

  await page.locator('button.invoice-form-submit.transaction-submit').click();
  await page.waitForTimeout(5000);

  // Ce document a en permanence des lignes dont la TVA diffère de celle du client (c'est le but
  // de TC15), donc ce popup peut se régénérer dynamiquement après l'enregistrement. Un clic
  // Playwright classique (qui attend une cible stable) n'est pas fiable sur un élément qui se
  // recrée en continu : on le ferme en best-effort via un clic DOM natif, sans bloquer le flux.
  // "Confirmer" garde les taux tels quels (contrairement à "Corriger la TVA" qui les aligne sur
  // le client) ; la vraie vérification du succès se fait juste après, sur la donnée elle-même.
  await page.evaluate(() => {
    document
      .querySelectorAll<HTMLButtonElement>('#vat-mismatch-modal .vat-mismatch-continue')
      .forEach((bouton) => bouton.click());
  });
  await page.waitForTimeout(2000);

  // La sauvegarde d'une facture existante recharge le même formulaire d'édition (l'URL ne change
  // pas), donc on vérifie le succès via la donnée elle-même plutôt que via l'URL : on recharge la
  // page et on s'assure que le taux choisi a bien persisté côté serveur.
  await page.goto(`/admin/invoices/invoice/${idFacture}`);
  await expect(page.locator('select[name="delivery_taxname"]')).toHaveValue(valeurOption, {
    timeout: 15000,
  });
}

/** Lit le montant HT saisi sur la ligne Livraison (champ `input[name="delivery"]`). */
export async function lireMontantLivraisonHT(page: Page): Promise<number> {
  const champLivraison = page.locator('input[name="delivery"]');
  await expect(champLivraison).toBeVisible({ timeout: 15000 });

  return parseMontant(await champLivraison.inputValue());
}

/**
 * Lit le tableau des totaux de la facture (Total HT, montants de TVA par taux, Total TTC).
 * Ce tableau agrège par taux, pas par ligne : pour isoler la contribution de la Livraison à un
 * taux donné, il faut soustraire/additionner la contribution connue des autres lignes.
 */
export async function lireTotauxFacture(page: Page): Promise<TotauxFacture> {
  const tableau = page.locator('div.panel-body.mtop10 table.table.text-right');
  await expect(tableau).toBeVisible({ timeout: 15000 });

  const lignes = await tableau
    .locator('tr')
    .evaluateAll((trs) =>
      trs.map((tr) => Array.from(tr.children).map((td) => (td.textContent ?? '').trim())),
    );

  let totalHT: number | undefined;
  let totalTTC: number | undefined;
  const tva = new Map<number, number>();

  for (const [libelle, montant] of lignes) {
    if (!libelle || !montant) continue;

    if (libelle.startsWith('Total HT')) {
      totalHT = parseMontant(montant);
      continue;
    }

    if (libelle.startsWith('Total TTC')) {
      totalTTC = parseMontant(montant);
      continue;
    }

    const correspondanceTaux = libelle.match(/\(([\d.,]+)\s*%\)/);
    if (correspondanceTaux) {
      const taux = Number(correspondanceTaux[1].replace(',', '.'));
      tva.set(taux, (tva.get(taux) ?? 0) + parseMontant(montant));
    }
  }

  if (totalHT === undefined || totalTTC === undefined) {
    throw new Error('Total HT ou Total TTC introuvable dans le tableau des totaux de la facture.');
  }

  return { totalHT, totalTTC, tva };
}
