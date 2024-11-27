package com.example.Usersmicroservice.DTO;


import com.example.Usersmicroservice.Enum.EtatConfirmation;
import com.example.Usersmicroservice.Enum.Role;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;


public class RegistrationDTO {

    private String nom;
    private String prenom;
    private String username;
    private String email;
    private String password;
    @Enumerated(EnumType.STRING)

    private Role role=Role.CLIENT;
    private String numTel;
    private String localisation;
    private String siteweb = null;


    @Enumerated(EnumType.STRING)
    private EtatConfirmation EtatConfirmation;

    public EtatConfirmation getEtatConfirmation() {
        return EtatConfirmation;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setEtatConfirmation(com.example.Usersmicroservice.Enum.EtatConfirmation etatConfirmation) {
        EtatConfirmation = etatConfirmation;
    }


    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getNumTel() {
        return numTel;
    }

    public void setNumTel(String numTel) {
        this.numTel = numTel;
    }

    public String getLocalisation() {
        return localisation;
    }

    public void setLocalisation(String localisation) {
        this.localisation = localisation;
    }

    public String getSiteweb() {
        return siteweb;
    }

    public void setSiteweb(String siteweb) {
        this.siteweb = siteweb;
    }
}
