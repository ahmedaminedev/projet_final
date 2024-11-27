package com.example.microservice_relamations.Entities;

import com.example.microservice_relamations.Enum.Etat;
import jakarta.persistence.Entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;
@Entity
@Table(name = "reclamations")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Reclamation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    private String capture;
    private Date date;
    private String description;
    private Long idUser;
    @Enumerated(EnumType.STRING)
    private Etat etat;
    private String username;
    private String usernamescraper;
    private Long scraperId;
}
