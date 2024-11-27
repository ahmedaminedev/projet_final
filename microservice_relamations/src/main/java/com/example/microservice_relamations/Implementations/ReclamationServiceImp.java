package com.example.microservice_relamations.Implementations;

import com.example.microservice_relamations.DTO.ReclamationDTO;
import com.example.microservice_relamations.DTO.UserDTO;
import com.example.microservice_relamations.Entities.Reclamation;
import com.example.microservice_relamations.Enum.Etat;
import com.example.microservice_relamations.Relations.UserClient;
import com.example.microservice_relamations.Repository.ReclamationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;


import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
@Service
public class ReclamationServiceImp {

    @Autowired
    private ReclamationRepository reclamationRepository;

    @Autowired
    private UserClient userClient;

    public List<ReclamationDTO> getAllReclamations() {
        return reclamationRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ReclamationDTO getReclamationById(Long id) {
        return reclamationRepository.findById(id)
                .map(this::convertToDTO)
                .orElse(null);
    }

    public ReclamationDTO createReclamation(ReclamationDTO reclamationDTO, @AuthenticationPrincipal Jwt jwt) {
        Reclamation reclamation = convertToEntity(reclamationDTO);
        String username = jwt.getClaim("preferred_username");
        UserDTO user = userClient.getUserByUsername(username);
        reclamation.setUsername(user.getUsername());
        reclamation.setIdUser(user.getId());
        Reclamation savedReclamation = reclamationRepository.save(reclamation);
        return convertToDTO(savedReclamation);
    }

    public ReclamationDTO updateReclamation(Long id, ReclamationDTO reclamationDTO) {
        Reclamation existingReclamation = reclamationRepository.findById(id).orElse(null);
        if (existingReclamation != null) {
            existingReclamation.setTitre(reclamationDTO.getTitre());
            existingReclamation.setCapture(reclamationDTO.getCapture());
            existingReclamation.setDate(reclamationDTO.getDate());
            existingReclamation.setDescription(reclamationDTO.getDescription());
            existingReclamation.setEtat(reclamationDTO.getEtat());
            existingReclamation.setIdUser(reclamationDTO.getIdUser());
            existingReclamation.setScraperId(reclamationDTO.getScraperId());
            existingReclamation.setUsernamescraper(reclamationDTO.getUsernamescraper());

            Reclamation updatedReclamation = reclamationRepository.save(existingReclamation);
            return convertToDTO(updatedReclamation);
        }
        return null;
    }





    public ReclamationDTO confimerreclamation(Long id) {
        Reclamation existingReclamation = reclamationRepository.findById(id).orElse(null);
        if (existingReclamation != null) {
            existingReclamation.setEtat(Etat.TRAITEE);
            Reclamation updatedReclamation = reclamationRepository.save(existingReclamation);
            return convertToDTO(updatedReclamation);
        }
        return null;
    }




    public ReclamationDTO anuulerreclamation(Long id) {
        Reclamation existingReclamation = reclamationRepository.findById(id).orElse(null);
        if (existingReclamation != null) {
            existingReclamation.setEtat(Etat.ANNULEE);
            Reclamation updatedReclamation = reclamationRepository.save(existingReclamation);
            return convertToDTO(updatedReclamation);
        }
        return null;
    }
    public void deleteReclamation(Long id) {
        reclamationRepository.deleteById(id);
    }

    public ReclamationDTO assignScraper(Long reclamationId, Long scraperId) {
        // Trouver la réclamation existante
        Reclamation existingReclamation = reclamationRepository.findById(reclamationId).orElse(null);

        if (existingReclamation != null) {
            // Mettre à jour le scraperId
            existingReclamation.setScraperId(scraperId);

            // Récupérer le UserDTO du scraper
            UserDTO scraperUser = userClient.getUserById(scraperId);
            System.out.println(userClient);
            // Vérifier si le UserDTO est non null
            if (scraperUser != null) {
                // Mettre à jour usernamescraper avec le username du scraper
                existingReclamation.setUsernamescraper(scraperUser.getUsername());
            } else {
                // Gérer le cas où l'utilisateur n'est pas trouvé, si nécessaire
                existingReclamation.setUsernamescraper(null);
            }

            // Sauvegarder les modifications
            Reclamation updatedReclamation = reclamationRepository.save(existingReclamation);
            return convertToDTO(updatedReclamation);
        }
        return null;
    }

    private ReclamationDTO convertToDTO(Reclamation reclamation) {
        ReclamationDTO dto = new ReclamationDTO();
        dto.setId(reclamation.getId());
        dto.setTitre(reclamation.getTitre());
        dto.setCapture(reclamation.getCapture());
        dto.setDate(reclamation.getDate());
        dto.setDescription(reclamation.getDescription());
        dto.setEtat(reclamation.getEtat());
        dto.setIdUser(reclamation.getIdUser());
        dto.setScraperId(reclamation.getScraperId());
        dto.setUsername(reclamation.getUsername());
        dto.setUsernamescraper(reclamation.getUsernamescraper());

        // Fetch and set user details from UserClient
        UserDTO userDTO = userClient.getUserById(reclamation.getIdUser());
        dto.setUser(userDTO);
        return dto;
    }

    private Reclamation convertToEntity(ReclamationDTO dto) {
        Reclamation reclamation = new Reclamation();
        reclamation.setId(dto.getId());
        reclamation.setTitre(dto.getTitre());
        reclamation.setCapture(dto.getCapture());
        reclamation.setDate(dto.getDate());
        reclamation.setDescription(dto.getDescription());
        reclamation.setEtat(dto.getEtat());
        reclamation.setIdUser(dto.getIdUser());
        reclamation.setScraperId(dto.getScraperId());
        reclamation.setUsername(dto.getUsername());
        reclamation.setUsernamescraper(dto.getUsernamescraper());

        return reclamation;
    }


    public List<ReclamationDTO> getReclamationsAffectees() {
        return reclamationRepository.findByScraperIdNotNull().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ReclamationDTO> getReclamationsNonAffectees() {
        return reclamationRepository.findByScraperIdIsNull().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Dans ReclamationService
    public List<ReclamationDTO> getReclamationsByScraperId(Long scraperId) {
        return reclamationRepository.findByScraperId(scraperId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

}
