# Commande pour lancer test test
npx playwright test

# Commande pour lister les tests
npx playwright test --list


# Tests Playwright KosmoPOS
npx playwright test tests/tc01.spec.ts --headed
npx playwright test tests/tc02.spec.ts --headed
npx playwright test tests/tc03.spec.ts --headed
## Configuration

Copier `.env.example` dans `.env` et renseigner les variables suivantes:

```text
KOSMO_BASE_URL=https://frhq.kosmopos.com
KOSMO_ADMIN_EMAIL=...
KOSMO_ADMIN_PASSWORD=...
```

Les secrets ne doivent pas être commités.

## Authentification dans un test

```ts
import { test } from '@playwright/test';
import { authentifierAdmin } from '../globales/authentification';
import { creerDevis } from '../globales/creation_devis';
import { Tickets } from '../tickets/tickets';

test('créer un ticket', async ({ page }) => {
  await authentifierAdmin(page);

  const tickets = new Tickets(page);
  await tickets.ouvrir();
  await tickets.creer({
    titre: 'Ticket de test',
    description: 'Créé par un test Playwright',
  });
});
```

L’authentification peut aussi être sauvegardée avec `creerEtatAuthentification` pour réutiliser la session dans plusieurs tests.

## Création d’un devis

```ts
test('créer un devis', async ({ page }) => {
  await authentifierAdmin(page);

  await creerDevis(page, { titre: 'TC01' });
});
```

La fonction sélectionne l’entreprise, l’attribution, l’origine, le produit et les frais configurés, vérifie la cohérence entre le Total HT et le Total TTC, puis enregistre le devis.

## Conversion d’un devis en commande

```ts
import { convertirDevisEnCommande } from '../globales/conversion_devis_commande';

test('convertir le devis en commande', async ({ page }) => {
  await authentifierAdmin(page);

  const devisUrl = await creerDevis(page, { titre: 'TEST-commande' });
  await convertirDevisEnCommande(page, {
    devisUrl,
    titre: 'TEST-commande',
  });
});
```

L’application ne propose pas de bouton direct de conversion sur la fiche du devis. Le helper ouvre le formulaire de commande, reprend le client, le titre, l’origine et le produit du devis accepté, puis enregistre la commande.