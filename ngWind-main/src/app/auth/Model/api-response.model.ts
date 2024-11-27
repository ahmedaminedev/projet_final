export interface ApiResponse {
  status: string;
  message: string;
  data?: any;  // Ajoutez 'data' si la réponse contient une propriété 'data'
}
