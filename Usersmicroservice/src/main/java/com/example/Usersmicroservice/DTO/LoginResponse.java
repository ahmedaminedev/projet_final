package com.example.Usersmicroservice.DTO;

import com.example.Usersmicroservice.Entities.User;

public class LoginResponse {
    private String access_token;
    private User user;

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    private String errorMessage; // Nouveau champ pour le message d'erreur
    private String refresh_token;

    public LoginResponse() {
    }
    public String getRefresh_token() { // Ajoutez ce getter
        return refresh_token;
    }

    public void setRefresh_token(String refresh_token) { // Ajoutez ce setter
        this.refresh_token = refresh_token;
    }
    // Constructeur prenant un message d'erreur
    public LoginResponse(String errorMessage) {
        this.errorMessage = errorMessage;
    }
    public String getAccess_token() {
        return access_token;
    }

    public void setAccess_token(String access_token) {
        this.access_token = access_token;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}