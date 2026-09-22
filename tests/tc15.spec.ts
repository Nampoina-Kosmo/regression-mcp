import { expect, test } from '@playwright/test';
import { authentifierAdmin } from '../globales/authentification';
import { clearFiltresDevis } from '../globales/clear_filtres_devis';
import { convertirCommandeEnFacture } from '../globales/conversion_commande_facture';
import { accepterDevis } from '../globales/conversion_devis_commande';
import { creerDevisTvaMixteTc15 } from '../globales/creation_devis_variante_tc15';
import {
  definirTauxTvaLivraison,
  lireMontantLivraisonHT,
  lireTotauxFacture,
} from '../globales/verification_tva_livraison_tc15';

test('TC15 - Vérifier le calcul HT/TVA/TTC de la ligne Livraison pour chaque taux', async ({
  page,
}) => {
  test.setTimeout(600000);
  await authentifierAdmin(page);

  await clearFiltresDevis(page);
  const titre = `TEST-TC15-${Date.now()}`;
  await creerDevisTvaMixteTc15(page, titre);

  await clearFiltresDevis(page);
  await accepterDevis(page, { titre });
  const urlFacture = await convertirCommandeEnFacture(page, { titreDevis: titre });

  const idFacture = urlFacture.match(/\/admin\/invoices\/list_invoices\/(\d+)/)?.[1];
  if (!idFacture) {
    throw new Error(`Identifiant de facture introuvable après conversion: ${urlFacture}`);
  }

  await page.goto(`/admin/invoices/invoice/${idFacture}`);
  const montantLivraisonHT = await lireMontantLivraisonHT(page);
  const totauxInitiaux = await lireTotauxFacture(page);

  // Contribution des lignes produits (hors Livraison), déduite du taux initial de la
  // Livraison (20 %, fixé par creerDevisTvaMixteTc15 et préservé tel quel par la conversion
  // devis -> commande -> facture). La boucle ci-dessous modifie ensuite volontairement ce taux
  // pour tester le calcul HT/TVA/TTC à 1.5 %, 10 % et 20 %.
  const contributionsProduits = new Map(totauxInitiaux.tva);
  contributionsProduits.set(20, (contributionsProduits.get(20) ?? 0) - montantLivraisonHT * 0.2);

  for (const tauxCible of [1.5, 10, 20]) {
    await definirTauxTvaLivraison(page, idFacture, tauxCible);

    await page.goto(`/admin/invoices/invoice/${idFacture}`);
    const totaux = await lireTotauxFacture(page);

    // Le HT total ne dépend pas du taux de TVA choisi pour la Livraison.
    expect(totaux.totalHT).toBeCloseTo(totauxInitiaux.totalHT, 2);

    const contributionProduit = contributionsProduits.get(tauxCible) ?? 0;
    const contributionLivraison = montantLivraisonHT * (tauxCible / 100);
    const tvaAttendue = contributionProduit + contributionLivraison;

    expect(totaux.tva.get(tauxCible) ?? 0).toBeCloseTo(tvaAttendue, 2);

    const ttcAttendu =
      totaux.totalHT + [...totaux.tva.values()].reduce((somme, montant) => somme + montant, 0);
    expect(totaux.totalTTC).toBeCloseTo(ttcAttendu, 2);
  }
});
