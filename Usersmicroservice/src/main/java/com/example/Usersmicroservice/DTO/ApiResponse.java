package com.example.Usersmicroservice.DTO;

import com.example.Usersmicroservice.Entities.User;

public class ApiResponse {
    private String status;
    private String message;
    private User data; // Attribut pour stocker l'utilisateur

    // Constructeur avec status, message et data
    public ApiResponse(String status, String message, User data) {
        this.status = status;
        this.message = message;
        this.data = data;
    }

    // Constructeur avec status et message
    public ApiResponse(String status, String message) {
        this.status = status;
        this.message = message;
    }

    // Getters et Setters
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public User getData() {
        return data;
    }

    public void setData(User data) {
        this.data = data;
    }
}
