package com.example.microservice_relamations.Repository;

import com.example.microservice_relamations.Entities.Reclamation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReclamationRepository extends JpaRepository<Reclamation, Long> {
    List<Reclamation> findByScraperId(Long scraperId);

    // Trouver les réclamations affectées (avec scraperId non nul)
    List<Reclamation> findByScraperIdNotNull();

    // Trouver les réclamations non affectées (scraperId nul)
    List<Reclamation> findByScraperIdIsNull();

    // Trouver les réclamations par userId (fournisseur)
    List<Reclamation> findByIdUser(Long idUser);
}