package com.example.Usersmicroservice.DTO;

import com.example.Usersmicroservice.Enum.EtatConfirmation;
import com.example.Usersmicroservice.Enum.Role;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;

@Getter
public class EditProfileDTO {

    private String nom;
    private String prenom;
    private String email;
    private String password;
    @Enumerated(EnumType.STRING)

    private Role role=Role.CLIENT;
    private String numTel;
    private String localisation;
    private String siteweb = null;


    @Enumerated(EnumType.STRING)
    private com.example.Usersmicroservice.Enum.EtatConfirmation EtatConfirmation;

    public EtatConfirmation getEtatConfirmation() {
        return EtatConfirmation;
    }

    public void setEtatConfirmation(com.example.Usersmicroservice.Enum.EtatConfirmation etatConfirmation) {
        EtatConfirmation = etatConfirmation;
    }


    public void setNom(String nom) {
        this.nom = nom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public void setNumTel(String numTel) {
        this.numTel = numTel;
    }

    public void setLocalisation(String localisation) {
        this.localisation = localisation;
    }

    public void setSiteweb(String siteweb) {
        this.siteweb = siteweb;
    }
}
