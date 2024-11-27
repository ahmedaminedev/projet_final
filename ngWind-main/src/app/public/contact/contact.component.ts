import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GestionReclamationsService } from 'src/app/admin/views/settings/gestion-reclamations/gestion-reclamations.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
  standalone:true,
  imports : [ReactiveFormsModule,CommonModule]
})
export class ContactComponent {
  claimForm: FormGroup;
  selectedImage: File | null = null;
  imageUrl: string | null = null;

  constructor(private fb: FormBuilder, private reclamationService: GestionReclamationsService) {
    this.claimForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.selectedImage = event.target.files[0];
      if (this.selectedImage) {
        this.imageUrl = URL.createObjectURL(this.selectedImage);
      }
    }
  }

  submitClaim() {
    if (this.claimForm.valid && this.selectedImage) {
      this.reclamationService.uploadImage(this.selectedImage).subscribe(
        (imageUrl: string) => {
          // Préparer les données de la réclamation avec l'URL de l'image
          const claimData = {
            titre: this.claimForm.get('title')?.value,
            description: this.claimForm.get('description')?.value,
            capture: imageUrl // Utiliser l'URL renvoyée par le backend
          };

          this.reclamationService.createReclamation(claimData).subscribe(
            response => {
              console.log('Réclamation soumise avec succès', response);
            },
            error => {
              console.error('Erreur lors de la soumission de la réclamation', error);
            }
          );
        },
        error => {
          console.error('Erreur lors du téléchargement de l\'image', error);
        }
      );
    } else {
      console.error('Formulaire invalide ou image non sélectionnée');
    }
  }
}
