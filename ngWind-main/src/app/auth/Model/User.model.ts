import { Page } from "./Page.model";

export interface User {
  id?: number;
  refreshToken?: string;
  nom?: string;
  prenom?: string;
  username?: string;
  email?: string;
  password?: string;
  numTel?: string;
  localisation?: string;
  siteweb?: string;
  role?: string; // Assuming role is a string; replace it with the actual type if different.
  etatConfirmation?: string; // Replace with the actual enum type if it's an enum.
  pages?: Page[]; // Remplacez `Page` par le type réel des pages si nécessaire

}
