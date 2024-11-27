package com.example.Usersmicroservice.Implementations;

import com.example.Usersmicroservice.DTO.LoginDTO;
import com.example.Usersmicroservice.DTO.LoginResponse;
import com.example.Usersmicroservice.Entities.User;
import com.example.Usersmicroservice.Enum.EtatConfirmation;
import com.example.Usersmicroservice.Enum.Role;
import com.example.Usersmicroservice.Repositories.UserRepository;
import com.example.Usersmicroservice.Services.UserService;
import org.keycloak.KeycloakPrincipal;
import org.keycloak.adapters.springsecurity.token.KeycloakAuthenticationToken;
import org.keycloak.representations.AccessToken;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import com.example.Usersmicroservice.Config.RestTemplateConfig;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

@Service
public class LoginServiceImpl {
    @Autowired
    RestTemplate restTemplate;
    @Autowired
    UserServiceImpl userService;
    @Autowired
    private UserRepository userRepository;
    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
    private String issueUrl;

    @Value("Front-end")
    private String clientId;

    @Value("P7j3WHkoVCsBrNKcQcfnwqTX72CuKZkM")
    private String clientSecret;

    @Value("password")
    private String grantType;

    @Value("http://localhost:8100/realms/comparator-web-app/protocol/openid-connect/token")
    private String token;
    public ResponseEntity<LoginResponse> login(LoginDTO loginRequest) {
        User user1 = userService.getUserByUsername(loginRequest.getUsername()).orElse(null);


        if (user1 != null && user1.getRole() == Role.FOURNISSEUR && user1.getEtatConfirmation() != EtatConfirmation.CONFIRMEE) {
            // Return a 401 Unauthorized with a custom error message
            LoginResponse errorResponse = new LoginResponse();
            errorResponse.setErrorMessage("Merci de patienter en attendant que vos données soient prêtes sur notre site ,veuillez consulter votre mail cotidiainement on vas vous envoyer l'autorisation de connection le plutot possible");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }


        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("client_id", clientId);
        map.add("client_secret", clientSecret);
        map.add("grant_type", grantType);
        map.add("username", loginRequest.getUsername());
        map.add("password", loginRequest.getPassword());

        HttpEntity<MultiValueMap<String, String>> httpEntity = new HttpEntity<>(map, headers);

        try {
            ResponseEntity<LoginResponse> response = restTemplate.postForEntity(token, httpEntity, LoginResponse.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                LoginResponse loginResponse = response.getBody();

                // Save the refresh_token in the database if the user exists
                User user = userService.getUserByUsername(loginRequest.getUsername()).orElse(null);

                if (user != null) {
                    user.setRefreshToken(loginResponse.getRefresh_token());
                    userRepository.save(user);
                    loginResponse.setUser(user);
                }

                return new ResponseEntity<>(loginResponse, HttpStatus.OK);
            } else {
                LoginResponse errorResponse = new LoginResponse("Échec de l'authentification");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
        } catch (Exception e) {
            LoginResponse errorResponse = new LoginResponse("Une erreur s'est produite lors de la connexion : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    public String refreshToken(User user) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("client_id", clientId);
        map.add("client_secret", clientSecret);
        map.add("grant_type", "refresh_token");
        map.add("refresh_token", user.getRefreshToken());

        HttpEntity<MultiValueMap<String, String>> httpEntity = new HttpEntity<>(map, headers);

        try {
            // Log the request for debugging
            System.out.println("Sending refresh token request: " + httpEntity.toString());

            ResponseEntity<LoginResponse> response = restTemplate.postForEntity(token, httpEntity, LoginResponse.class);

            // Log the response for debugging
            System.out.println("Received response: " + response.getStatusCode() + " - " + response.getBody());

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String newAccessToken = response.getBody().getAccess_token();
                String newRefreshToken = response.getBody().getRefresh_token();

                // Log tokens for debugging
                System.out.println("New Access Token: " + newAccessToken);
                System.out.println("New Refresh Token: " + newRefreshToken);

                // Mettre à jour le refresh_token dans la base de données
                user.setRefreshToken(newRefreshToken);
                userRepository.save(user);

                return newAccessToken;
            } else {
                throw new RuntimeException("Impossible de rafraîchir le token - Response: " + response.getStatusCode());
            }
        } catch (Exception e) {
            // Log the exception for debugging
            System.err.println("Exception during token refresh: " + e.getMessage());
            throw new RuntimeException("Erreur lors du rafraîchissement du token : " + e.getMessage());
        }
    }

    public ResponseEntity<User> getAuthenticatedUser() {
        System.out.println("authentication");
        // Obtenez l'objet Authentication de Spring Security
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        // Vérifiez si l'authentification est réussie et l'utilisateur est extrait du jeton d'accès
        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            System.out.println(jwt);
            // Extrayez les informations de l'utilisateur à partir du jeton d'accès
            String username = jwt.getClaim("preferred_username");

            // Utilisez les informations pour récupérer l'utilisateur à partir de votre service utilisateur
            Optional<User> optionalUser = userService.getUserByUsername(username);
            if (optionalUser.isPresent()) {
                return new ResponseEntity<>(optionalUser.get(), HttpStatus.OK);
            } else {
                // Gérez le cas où l'utilisateur n'est pas trouvé dans la base de données
                // ou tout autre cas d'erreur
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } else {
            // Gérez le cas où l'authentification a échoué ou les informations de l'utilisateur ne sont pas disponibles
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
    }



}
