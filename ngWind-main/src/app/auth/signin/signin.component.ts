import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent {
  username: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}
  ngOnInit(): void {
    // Récupérer les détails de connexion du service
    const loginDetails = this.authService.getLoginDetails();
    if (loginDetails) {
      this.username = loginDetails.username;
      this.password = loginDetails.password;
      // Optionnel : Effacer les détails après récupération pour éviter les utilisations futures accidentelles
      this.authService.clearLoginDetails();
    }
  }

  onLogin() {
    this.authService.login(this.username, this.password).subscribe(
      response => {
        console.log('Full response object:', response);

        // Assurez-vous que la réponse contient un objet utilisateur
        const user = response.user;
        if (!user) {
          throw new Error('No user data found in response');
        }

        console.log('User object:', user);

        Swal.fire({
          title: 'Connexion réussie',
          text: 'Vous êtes maintenant connecté.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          console.log('User role:', user);
          // Redirigez après la confirmation de l'alerte
          this.redirectBasedOnRole(user.role);
        });
      },
      error => {
        console.log("loooooog",error)
        // Gérez les erreurs en fonction du message d'erreur
        const errorMessage = error || 'Nom d’utilisateur ou mot de passe incorrect.';

        Swal.fire({
          title: 'Erreur de connexion',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK'
        });

        console.error('Login failed', error);
      }
    );
  }


   redirectBasedOnRole(role: string): void {
    if (role === 'SCRAPPER' || role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'CLIENT' || role === 'FOURNISSEUR') {
      this.router.navigate(['/']);
    } else {
      // Gestion des cas d'erreur ou de rôle non défini
      this.router.navigate(['/login']);
    }
  }


}
