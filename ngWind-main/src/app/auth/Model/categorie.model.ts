export interface Categorie {
  id: number;
  name: string;
  parent_category: number | null;
  // Ajoutez une propriété pour les sous-catégories si nécessaire
  subCategories?: Categorie[];
}
