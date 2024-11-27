import { Categorie } from "./categorie.model";

export interface Page {
  id: number;
  id_fournisseur: number;
  username: string;
  base_url: string;
  page_suffix: string;
  nombre_page_max: number;
  Type: string;
  etat_service: string;
  date_creation?: Date | null;
  date_dernier_scraping?: Date | null;
  category: Categorie | null;
  subCategories?: Categorie[];
  categoryHierarchy?: string; // Ajoutez cette ligne
}
