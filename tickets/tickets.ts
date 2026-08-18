import { expect, type Page } from '@playwright/test';

export type Ticket = {
  titre: string;
  description?: string;
};

export class Tickets {
  constructor(private readonly page: Page) {}

  async ouvrir(): Promise<void> {
    await this.page.goto('/admin/tickets');
    await expect(this.page).toHaveURL(/\/admin\/tickets/);
  }

  async creer(ticket: Ticket): Promise<void> {
    await this.page.getByRole('button', { name: /nouveau ticket|créer un ticket|ajouter/i }).click();
    await this.page.getByRole('textbox', { name: /titre|sujet/i }).fill(ticket.titre);

    if (ticket.description) {
      await this.page.getByRole('textbox', { name: /description|message/i }).fill(ticket.description);
    }

    await this.page.getByRole('button', { name: /enregistrer|créer|ajouter/i }).click();
  }

  async rechercher(titre: string): Promise<void> {
    const recherche = this.page.getByRole('searchbox').or(
      this.page.getByRole('textbox', { name: /rechercher|chercher/i }),
    );
    await recherche.fill(titre);
  }

  async ouvrirTicket(titre: string): Promise<void> {
    await this.page.getByRole('link', { name: titre }).click();
  }

  async modifierDescription(description: string): Promise<void> {
    await this.page.getByRole('textbox', { name: /description|message/i }).fill(description);
    await this.page.getByRole('button', { name: /enregistrer|sauvegarder|modifier/i }).click();
  }

  async supprimer(): Promise<void> {
    await this.page.getByRole('button', { name: /supprimer|delete/i }).click();
    await this.page.getByRole('button', { name: /confirmer|oui|supprimer/i }).click();
  }
}