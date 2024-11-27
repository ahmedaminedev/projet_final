package com.example.Usersmicroservice.Controllers;

import com.example.Usersmicroservice.DTO.*;
import com.example.Usersmicroservice.Entities.User;
import com.example.Usersmicroservice.Enum.EtatConfirmation;
import com.example.Usersmicroservice.Enum.Role;
import com.example.Usersmicroservice.Implementations.LoginServiceImpl;
import com.example.Usersmicroservice.Implementations.UserServiceImpl;
import com.example.Usersmicroservice.Repositories.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")

public class AuthController {
    private final UserServiceImpl userService;
    @GetMapping("/static")
    public ResponseEntity<Map<String, String>> getStaticData() {
        Map<String, String> responseData = new HashMap<>();
        responseData.put("message", "Hello from Spring Boot!");
        return ResponseEntity.ok(responseData);
    }

    @Autowired
    public AuthController(UserServiceImpl userService) {
        this.userService = userService;
    }

    @Autowired
    LoginServiceImpl loginService;
    @Autowired
    UserRepository userRepository;

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse> refreshToken(@RequestParam String username) {
        try {
            // Récupérer l'utilisateur en fonction du nom d'utilisateur
            Optional<User> userOptional = userService.getUserByUsername(username);
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                // Rafraîchir le jeton
                String newAccessToken = loginService.refreshToken(user);

                // Créer une instance de ApiResponse pour retourner la réponse
                ApiResponse response = new ApiResponse("success", newAccessToken);
                return ResponseEntity.ok(response);
            } else {
                ApiResponse response = new ApiResponse("error", "Utilisateur non trouvé");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            ApiResponse response = new ApiResponse("error", "Erreur lors du rafraîchissement du jeton : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }


    @PostMapping("/adduser")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> addfournisseur(@RequestBody RegistrationDTO registrationDTO) {
        // Appel du service pour ajouter un utilisateur
        ApiResponse response = userService.addUser(registrationDTO).getBody();

        // Vérification du statut et renvoi de la réponse appropriée
        if ("success".equals(response.getStatus())) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }

    }


    @GetMapping("/Fournisseur/find/{iduser}/")
    public Optional<User> findUser(@PathVariable Long iduser) {
        return userRepository.findById(iduser);
    }


    @GetMapping("/users/find/{username}/")
    public Optional<User> findUserByusername(@PathVariable String username) {
        return userRepository.findByUsername(username);
    }

    @GetMapping("/users/find/id/{iduser}/")
    public Optional<User> findUserid(@PathVariable Long iduser) {
        return userRepository.findById(iduser);
    }



    @GetMapping("/Fournisseur/find/username/{username}/")
    public Optional<User> findUserbyusername(@PathVariable String username) {
        return userRepository.findByUsername(username);
    }



    @GetMapping("/{id}/etatConfirmation/")
    public EtatConfirmation getEtatConfirmationById(@PathVariable Long id) {
        return userService.getEtatConfirmationById(id);
    }



    @GetMapping("/test/{role}/{email}/")
    public ResponseEntity<String> sendTestEmail(@PathVariable String role, @PathVariable String email) {
        return userService.sendTestEmail(role, email);
    }
    @GetMapping("/Fournisseur/find/")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SCRAPPER')")
    public List<User> findByAll() {
        return userRepository.findByRole(Role.FOURNISSEUR);
    }

    @GetMapping("/Fournisseur/find/confirmed")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SCRAPPER')")
    public List<User> findConfirmedFournisseurs() {
        return userRepository.findByRoleAndEtatConfirmation(Role.FOURNISSEUR, EtatConfirmation.CONFIRMEE);
    }

    @GetMapping("/listfournisseur")
    public ResponseEntity<List<User>> getAllSuppliers() {
        List<User> suppliers = userService.getAllSuppliers_enattende();
        return ResponseEntity.ok(suppliers);
    }
    @GetMapping("/check-login")
    public ResponseEntity<User> getAuthenticatedUser() {
        return loginService.getAuthenticatedUser();
    }
    @PutMapping("/update_fournisseur/{username}/confirmation-state")
    public ResponseEntity<String> updateUserConfirmationState(@PathVariable String username) {
        return userService.updateUserConfirmationState(username);
    }

    @GetMapping("/Admins/")
    public ResponseEntity<List<User>> getAllAdmins() {
        return userService.getAllAdmins();

    }


    @GetMapping("/Scrapers/")
    public ResponseEntity<List<User>> getAllScrapers() {
        return userService.getAllscrapers();

    }
    @GetMapping("/find/Scrapers/")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllScrapers_2() {
        return userService.getAllscrapers();

    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> optionalUser = userService.getUserByUsername(username);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            user.setRefreshToken(null);
            userRepository.save(user);
        }

        SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();
        logoutHandler.logout(request, null, null);

        return ResponseEntity.ok("Logged out successfully");
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> addUser(@RequestBody RegistrationDTO registrationDTO) {
        // Appel du service pour ajouter un utilisateur
        return userService.addUser(registrationDTO);
    }



    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginDTO loginRequest) {
        return loginService.login(loginRequest);
    }

    @DeleteMapping("deleteuser/{userId}/{username}/")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteUser(@PathVariable Long userId, @PathVariable String username) {
        return userService.deleteUser(userId, username);
    }



    @PutMapping("/updateuser/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> updateUser(@PathVariable String username, @RequestBody EditProfileDTO editProfileDTO) {
        // Appeler la méthode updateUser du service

        return userService.updateUser(username, editProfileDTO);
    }




    @GetMapping("/hello")
    public String hello() {
        return "Hello from Spring boot & Keycloak";
    }

    @GetMapping("/hello-2")
    @PreAuthorize("hasRole('ADMIN')")
    public String hello2() {
        return "Hello from Spring boot & Keycloak - ADMIN";
    }
}
