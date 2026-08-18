# Tests Playwright KosmoPOS

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