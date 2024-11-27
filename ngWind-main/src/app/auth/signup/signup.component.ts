import { Component } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../auth.service';
import { ApiResponse } from '../Model/api-response.model';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  user = {
    nom: '',
    prenom: '',
    username: '',
    email: '',
    password: '',
    numTel: '',
    localisation: '',
    siteweb: '' as string | null,
    role: 'CLIENT' // Default role
  };

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    this.authService.register(this.user).subscribe(
      (response: ApiResponse) => {
        console.log("ccccc",response.status)
        if (response.status === 'success') {
          this.authService.setLoginDetails(this.user.username, this.user.password);
          Swal.fire({
            icon: 'success',
            title: 'Registration Successful',
            text: response.message,
            confirmButtonText: 'OK'
          }).then(() => {
            this.router.navigate(['/login']);
          });
        } else {
          console.log("eeeeee",response.message)
          Swal.fire({
            icon: 'error',
            title: 'Registration Failed',
            text: response.message,
            confirmButtonText: 'OK'
          });
        }
      },
      error => {
        console.log("gggg",error)
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: error.message,
          confirmButtonText: 'OK'
        });
      }
    );
  }

  toggleSiteWeb() {
    if (this.user.role === 'FOURNISSEUR') {
      // Show the siteweb field
    } else {
      this.user.siteweb = null; // Hide siteweb field
    }
  }
}
