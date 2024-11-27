package com.example.Usersmicroservice.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.example.Usersmicroservice.Enum.EtatConfirmation;
import com.example.Usersmicroservice.Enum.Role;

@Entity
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Lob
    @Column(name = "refresh_token",columnDefinition = "TEXT")
    private String refreshToken;
    private String nom;
    private String prenom;
    private String username;
    private String email;
    private String password;
    private String numTel;
    private String localisation;
    private String siteweb = "null";
    @Enumerated(EnumType.STRING)
    private Role role=Role.CLIENT;
    @Enumerated(EnumType.STRING)
    private EtatConfirmation etatConfirmation;


}
