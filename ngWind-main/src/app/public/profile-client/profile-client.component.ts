import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ProfileClientService } from './profile-client.service';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-profile-client',
  templateUrl: './profile-client.component.html',
  styleUrls: ['./profile-client.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class ProfileClientComponent implements OnInit {
  currentUser = this.authService.currentUserValue.user;
  userRole: string | null = null;
  user = {
    nom: '',
    prenom: '',
    email: '',
    password: '',
    localisation: '',
    numTel: '',
    siteWeb: '' // Add site web property if needed
  };

  confirmPassword: string = ''; // Add confirmPassword property
  isEditing = false;

  constructor(private authService: AuthService, private profileClientService: ProfileClientService) { }

  ngOnInit(): void {
    this.userRole = this.currentUser?.role || null; // Set user role from current user

    // Fetch user data when component initializes
    this.fetchUserData();
  }

  fetchUserData(): void {
    const userId = this.currentUser?.id; // Assume currentUser has an 'id' property
    console.log(this.currentUser)
    if (userId) {
      this.profileClientService.getuser(userId).subscribe(
        (userData) => {
          // Populate the user object with the retrieved data
          this.user = {
            ...this.user,
            nom: userData.nom,
            prenom: userData.prenom,
            email: userData.email,
            localisation: userData.localisation,
            numTel: userData.numTel,
            siteWeb: userData.siteweb || '' // Only set siteWeb if available
          };
        },
        (error) => {
          console.error('Error fetching user data:', error);
          Swal.fire('Error', 'An error occurred while fetching user data', 'error');
        }
      );
    }
  }

  editProfile() {
    this.isEditing = true;
  }

  isRole(role: string): boolean {
    return this.userRole === role;
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return this.userRole !== null;
  }

  saveProfile() {
    // Check if passwords match
    if (this.user.password !== this.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Passwords do not match',
        text: 'Please make sure both password fields match.',
      });
      return;
    }

    // Call the service to update the user profile
    this.profileClientService.updateUser(this.currentUser.username, this.user) // Use the current username
      .subscribe(
        response => {
          console.log('Profile updated successfully:', response);
          this.isEditing = false;
          Swal.fire('Success', 'Profile updated successfully', 'success');
        },
        error => {
          console.error('Error updating profile:', error);
          Swal.fire('Error', error.message || 'An error occurred while updating the profile', 'error');
        }
      );
  }

  cancelEdit() {
    this.isEditing = false;
  }
}
