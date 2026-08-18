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