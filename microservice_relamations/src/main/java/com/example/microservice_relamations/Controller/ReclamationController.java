package com.example.microservice_relamations.Controller;

;
import com.example.microservice_relamations.DTO.ReclamationDTO;
import com.example.microservice_relamations.DTO.UserDTO;
import com.example.microservice_relamations.Implementations.ReclamationServiceImp;
import com.example.microservice_relamations.Relations.UserClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ReclamationController {
    private final UserClient userClient;

    private final ReclamationServiceImp reclamationService;

    @Autowired
    public ReclamationController(UserClient userClient, ReclamationServiceImp reclamationService) {
        this.userClient = userClient;
        this.reclamationService = reclamationService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SCRAPPER')")
    public List<ReclamationDTO> getAllReclamations() {
        return reclamationService.getAllReclamations();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SCRAPPER')")
    public ReclamationDTO getReclamationById(@PathVariable Long id) {
        return reclamationService.getReclamationById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT') or hasRole('FOURNISSEUR')")
    public ReclamationDTO createReclamation(@RequestBody ReclamationDTO reclamationDTO, @AuthenticationPrincipal Jwt jwt) {
        return reclamationService.createReclamation(reclamationDTO, jwt);
    }



    private static final String UPLOAD_DIR = "src/main/resources/static/assets/images/upload/";

    @PostMapping("/upload")
    @PreAuthorize("hasRole('CLIENT') or hasRole('FOURNISSEUR') or hasRole('CLIENT') or hasRole('FOURNISSEUR')")
    public String uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return "No file selected";
        }

        // Create directory if it doesn't exist
        File uploadDir = new File(UPLOAD_DIR);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }

        // Save the file
        String filePath = UPLOAD_DIR + file.getOriginalFilename();
        Files.write(Paths.get(filePath), file.getBytes());

        // Return the relative URL for accessing the image
        return  file.getOriginalFilename();
    }

    @GetMapping("/assets/images/upload/{filename:.+}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('FOURNISSEUR') or hasRole('ADMIN') or hasRole('SCRAPPER')")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) {
        try {
            // Charger le fichier en tant que ressource
            Resource resource = new UrlResource(Paths.get(UPLOAD_DIR).resolve(filename).toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(Paths.get(UPLOAD_DIR).resolve(filename));
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, contentType != null ? contentType : "application/octet-stream")
                        .body(resource);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }
        } catch (Exception e) {
            e.printStackTrace(); // Ajoutez cette ligne pour obtenir des détails sur l'erreur
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SCRAPPER')")
    public ReclamationDTO updateReclamation(@PathVariable Long id, @RequestBody ReclamationDTO reclamationDTO) {
        return reclamationService.updateReclamation(id, reclamationDTO);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SCRAPPER')")
    public void deleteReclamation(@PathVariable Long id) {
        reclamationService.deleteReclamation(id);
    }

    @GetMapping("/users/{username}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable String username) {
        UserDTO user = userClient.getUserByUsername(username);
        return ResponseEntity.ok(user);
    }


    @PutMapping("/{reclamationId}/assign-scraper/{scraperId}")
    @PreAuthorize("hasRole('SCRAPPER') or hasRole('ADMIN')")
    public ReclamationDTO assignScraper(@PathVariable Long reclamationId, @PathVariable Long scraperId) {
        return reclamationService.assignScraper(reclamationId, scraperId);
    }




    @GetMapping("/affectees")
    @PreAuthorize("hasRole('SCRAPPER')")
    public List<ReclamationDTO> getReclamationsAffectees() {
        return reclamationService.getReclamationsAffectees();
    }

    @GetMapping("/non-affectees")
    @PreAuthorize("hasRole('SCRAPPER')")
    public List<ReclamationDTO> getReclamationsNonAffectees() {
        return reclamationService.getReclamationsNonAffectees();
    }

    @GetMapping("/scrapper/{userId}")
    @PreAuthorize("hasRole('SCRAPPER')")
    public List<ReclamationDTO> getReclamationsByUserId(@PathVariable Long userId) {
        return reclamationService.getReclamationsByScraperId(userId);
    }


}
