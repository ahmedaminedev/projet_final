package com.example.Usersmicroservice.DTO;

import com.example.Usersmicroservice.Enum.EtatConfirmation;
import com.example.Usersmicroservice.Enum.Role;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;

@Getter
public class LoginDTO {
    private String username;

    @Enumerated(EnumType.STRING)

    private Role role=Role.CLIENT;
    @Enumerated(EnumType.STRING)
    private com.example.Usersmicroservice.Enum.EtatConfirmation EtatConfirmation;

    public void setEtatConfirmation(com.example.Usersmicroservice.Enum.EtatConfirmation etatConfirmation) {
        EtatConfirmation = etatConfirmation;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    private String password;
}
