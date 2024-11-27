package com.example.microservice_relamations.DTO;

import com.example.microservice_relamations.Enum.Etat;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class ReclamationDTO {
    private Long id;
    private String titre;
    private String capture;
    @Temporal(TemporalType.TIMESTAMP)
    private Date date = new Date(); // Set default value to current date

    private String description;
    @Enumerated(EnumType.STRING)
    private Etat etat=Etat.EN_COURS;
    private Long idUser;
    private String username;
    private Long scraperId;
    private String usernamescraper;

    private UserDTO user;
    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
    }
}
