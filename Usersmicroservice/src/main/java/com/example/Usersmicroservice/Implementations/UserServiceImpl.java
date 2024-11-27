package com.example.Usersmicroservice.Implementations;
import com.example.Usersmicroservice.DTO.ApiResponse;
import com.example.Usersmicroservice.DTO.EditProfileDTO;
import org.springframework.http.*;
import com.example.Usersmicroservice.Entities.User;
import com.example.Usersmicroservice.Enum.EtatConfirmation;
import com.example.Usersmicroservice.Repositories.UserRepository;
import com.example.Usersmicroservice.Services.UserService;
import jakarta.mail.MessagingException;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.Usersmicroservice.DTO.RegistrationDTO;
import com.example.Usersmicroservice.Config.KeycloakConfiguration;
import com.example.Usersmicroservice.Entities.Credentials;
import com.example.Usersmicroservice.Enum.Role;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import javax.ws.rs.core.Response;
import java.io.IOException;
import java.util.*;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private KeycloakConfiguration keycloakConfiguration;
    @Autowired
    private UserRepository userRepository;


    private MailSenderImpl emailService;

    // Méthode pour vérifier si le nom d'utilisateur est déjà pris
    private boolean isUsernameTaken(String username) {
        try {
            UsersResource usersResource = keycloakConfiguration.getUserResource();
            List<UserRepresentation> existingUsers = usersResource.search(username);
            return existingUsers != null && !existingUsers.isEmpty();
        } catch (Exception e) {
            // Gérer les exceptions ici
            String errorMessage = "Erreur lors de la vérification du nom d'utilisateur : " + e.getMessage();
            throw new RuntimeException(errorMessage, e);
        }
    }

    // Méthode pour vérifier si l'e-mail est déjà utilisé
    private boolean isEmailTaken(String email) {
        try {
            UsersResource usersResource = keycloakConfiguration.getUserResource();
            List<UserRepresentation> existingUsers = usersResource.search(null, null, null, email, null, null);
            return existingUsers != null && !existingUsers.isEmpty();
        } catch (Exception e) {
            // Gérer les exceptions ici
            String errorMessage = "Erreur lors de la vérification de l'e-mail : " + e.getMessage();
            throw new RuntimeException(errorMessage, e);
        }
    }




    @Override
    public ResponseEntity<ApiResponse> addUser(RegistrationDTO registrationDTO) {
        try {

            // Validation des champs communs pour tous les rôles
            if (registrationDTO.getUsername() == null || registrationDTO.getUsername().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "Le nom d'utilisateur est obligatoire."));
            }
            if (registrationDTO.getNom() == null || registrationDTO.getNom().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "Le nom est obligatoire."));
            }
            if (registrationDTO.getPrenom() == null || registrationDTO.getPrenom().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "Le prénom est obligatoire."));
            }
            if (registrationDTO.getEmail() == null || registrationDTO.getEmail().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "L'e-mail est obligatoire."));
            }
            if (!isValidEmail(registrationDTO.getEmail())) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "L'e-mail est invalide."));
            }
            if (registrationDTO.getNumTel() == null || registrationDTO.getNumTel().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "Le numéro de téléphone est obligatoire."));
            }
            if (registrationDTO.getLocalisation() == null || registrationDTO.getLocalisation().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "La localisation est obligatoire."));
            }
            if (registrationDTO.getPassword() == null || registrationDTO.getPassword().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "Le mot de passe est obligatoire."));
            }
            if (!isValidPassword(registrationDTO.getPassword())) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "Le mot de passe doit comporter au moins 8 caractères, lettres et des chiffres."));
            }

            // Vérifier si le nom d'utilisateur est déjà pris
            if (isUsernameTaken(registrationDTO.getUsername())) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "Le nom d'utilisateur est déjà pris."));
            }

            // Vérifier si l'e-mail est déjà utilisé
            if (isEmailTaken(registrationDTO.getEmail())) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "L'e-mail est déjà utilisé."));
            }

            // Validation spécifique pour le rôle FOURNISSEUR
            if (registrationDTO.getRole() == Role.FOURNISSEUR) {
                if (registrationDTO.getSiteweb() == null || registrationDTO.getSiteweb().isEmpty()) {
                    return ResponseEntity.badRequest().body(new ApiResponse("error", "Le site web est obligatoire pour le rôle de fournisseur."));
                }
                if (!isValidWebsite(registrationDTO.getSiteweb())) {
                    return ResponseEntity.badRequest().body(new ApiResponse("error", "Le site web est invalide."));
                }
            }

            // Création des informations de l'utilisateur dans Keycloak
            CredentialRepresentation credential = Credentials.createPasswordCredentials(registrationDTO.getPassword());
            UserRepresentation userKey = new UserRepresentation();
            userKey.setUsername(registrationDTO.getUsername());
            userKey.setFirstName(registrationDTO.getNom());
            userKey.setLastName(registrationDTO.getPrenom());
            userKey.setEmail(registrationDTO.getEmail());
            userKey.setCredentials(Collections.singletonList(credential));
            userKey.setEnabled(true);
            userKey.setAttributes(new HashMap<>());
            userKey.getAttributes().put("role", Arrays.asList(registrationDTO.getRole().toString()));

            if (registrationDTO.getRole() == Role.FOURNISSEUR) {
                userKey.getAttributes().put("etat_fournisseur", Arrays.asList(EtatConfirmation.EN_ATTENTE.toString()));
                userKey.getAttributes().put("siteweb", Arrays.asList(registrationDTO.getSiteweb()));
            }

            userKey.getAttributes().put("numTel", Arrays.asList(registrationDTO.getNumTel()));
            userKey.getAttributes().put("localisation", Arrays.asList(registrationDTO.getLocalisation()));

            UsersResource usersResource = keycloakConfiguration.getUserResource();
            Response response = usersResource.create(userKey);

            if (response.getStatus() != HttpStatus.CREATED.value()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse("error", "Erreur lors de la création de l'utilisateur dans Keycloak."));
            }

            String userId = response.getLocation().getPath().replaceAll(".*/([^/]+)$", "$1");
            RealmResource realmResource = keycloakConfiguration.getRealmResource();
            RoleRepresentation userRole = realmResource.roles().get(registrationDTO.getRole().toString()).toRepresentation();
            realmResource.users().get(userId).roles().realmLevel().add(List.of(userRole));

            // Créer l'utilisateur pour MySQL
            User user = new User();
            user.setUsername(registrationDTO.getUsername());
            user.setEmail(registrationDTO.getEmail());
            user.setNom(registrationDTO.getNom());
            user.setPrenom(registrationDTO.getPrenom());
            user.setLocalisation(registrationDTO.getLocalisation());
            user.setNumTel(registrationDTO.getNumTel());
            user.setRole(registrationDTO.getRole());
            user.setPassword("https://bootdey.com/img/Content/avatar/avatar7.png");

            if (registrationDTO.getRole() == Role.FOURNISSEUR) {
                user.setEtatConfirmation(EtatConfirmation.EN_ATTENTE);
                user.setSiteweb(registrationDTO.getSiteweb());
            }

            try {
                // Enregistrement dans MySQL
                userRepository.save(user);
            } catch (Exception mysqlException) {
                // Si l'enregistrement MySQL échoue, supprimer l'utilisateur dans Keycloak
                usersResource.get(userId).remove();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse("error", "Erreur lors de l'enregistrement dans la base de données MySQL : " + mysqlException.getMessage()));
            }

            // Envoi d'un e-mail en fonction du rôle de l'utilisateur
            sendRoleBasedEmail(registrationDTO);

            return ResponseEntity.ok(new ApiResponse("success", "Utilisateur créé avec succès.",user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse("error", "Une erreur s'est produite lors de la création de l'utilisateur : " + e.getMessage()));
        }
    }

    // Méthode de validation pour l'e-mail
    private boolean isValidEmail(String email) {
        String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$";
        return email.matches(emailRegex);
    }

    // Méthode de validation pour le site web
    private boolean isValidWebsite(String siteweb) {
        String websiteRegex = "^(https?:\\/\\/)?([\\w\\d\\-]+\\.)+[\\w\\d]{2,}(\\/.*)?$";
        return siteweb.matches(websiteRegex);
    }

    // Méthode de validation pour le mot de passe
    private boolean isValidPassword(String password) {
        String passwordRegex = "^(?=.*[a-zA-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$";
        return password.matches(passwordRegex);
    }

    private void sendRoleBasedEmail(RegistrationDTO registrationDTO) {
        String subject = "Bienvenue sur notre site";
        String templatePath = "templates/template.html";
        Map<String, String> placeholders = new HashMap<>();

        switch (registrationDTO.getRole()) {
            case FOURNISSEUR:
                placeholders.put("name", registrationDTO.getNom());
                placeholders.put("customMessage", "Bienvenue, cher fournisseur " + registrationDTO.getNom() + ". Vous êtes le bienvenu. Votre situation est en attente. Dès que nous préparons vos données pour que vous soyez présent sur notre site, nous vous donnerons l'information. Veuillez patienter.");
                break;
            case SCRAPPER:
                placeholders.put("name", registrationDTO.getNom());
                placeholders.put("customMessage", "Bienvenue, cher scraper " + registrationDTO.getNom() + ". L'admin vous a ajouté. Voici votre username: " + registrationDTO.getUsername() + " et votre mot de passe: " + registrationDTO.getPassword() + ".");
                break;
            case CLIENT:
                placeholders.put("name", registrationDTO.getNom());
                placeholders.put("customMessage", "Bonjour " + registrationDTO.getNom() + ", bienvenue dans notre site Le Bon Plan. Notre site vous fournit les meilleurs produits avec les meilleurs prix.");
                break;
            default:
                placeholders.put("name", registrationDTO.getNom());
                placeholders.put("customMessage", "Bienvenue sur notre site.");
                break;
        }

        try {
            mailSender.sendHtmlMessage(registrationDTO.getEmail(), subject, templatePath, placeholders);
        } catch (MessagingException | IOException e) {
            e.printStackTrace();
            // Gérer l'exception si nécessaire
        }
    }



    public EtatConfirmation getEtatConfirmationById(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        return user.getEtatConfirmation();
    }

    public ResponseEntity<String> deleteUser(Long userId, String username) {
        try {
            // Vérifier si l'utilisateur existe dans la base de données
            Optional<User> optionalUser = userRepository.findById(userId);
            System.out.println("Utilisateur trouvé : " + optionalUser);

            if (optionalUser.isPresent()) {
                User user = optionalUser.get();
                System.out.println("Rôle de l'utilisateur : " + user.getRole());

                // Vérifier le rôle de l'utilisateur
                if (user.getRole() == Role.FOURNISSEUR) {
                    System.out.println("Le rôle de l'utilisateur est FOURNISSEUR");

                    // Construire l'URL pour appeler l'API de suppression de pages et produits
                    String url = UriComponentsBuilder.fromUriString("http://localhost:8070/scraping/update_page_products_username/" + username + "/")
                            .toUriString();
                    System.out.println("URL construite : " + url);

                    // Appeler l'API de suppression de pages et produits
                    RestTemplate restTemplate = new RestTemplate();
                    ResponseEntity<String> deleteResponse;

                    try {
                        deleteResponse = restTemplate.exchange(url, HttpMethod.DELETE, HttpEntity.EMPTY, String.class);
                        System.out.println("Réponse de l'API : " + deleteResponse);
                    } catch (HttpClientErrorException e) {
                        if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                            System.out.println("Aucune page trouvée pour l'utilisateur, suppression de l'utilisateur.");
                        } else {
                            System.out.println("HttpClientErrorException capturée : " + e.getStatusCode());
                            System.out.println("Corps de la réponse : " + e.getResponseBodyAsString());
                            return ResponseEntity.status(e.getStatusCode()).body("Erreur lors de l'appel à l'API : " + e.getResponseBodyAsString());
                        }
                    } catch (HttpServerErrorException e) {
                        System.out.println("HttpServerErrorException capturée : " + e.getStatusCode());
                        return ResponseEntity.status(e.getStatusCode()).body("Erreur serveur lors de l'appel à l'API : " + e.getMessage());
                    } catch (Exception e) {
                        System.out.println("Exception capturée : " + e.getMessage());
                        e.printStackTrace();
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Une erreur s'est produite : " + e.getMessage());
                    }

                    // Supprimer l'utilisateur de Keycloak et de la base de données, que la réponse soit OK ou NOT_FOUND
                    UsersResource usersResource = keycloakConfiguration.getUserResource();
                    List<UserRepresentation> users = usersResource.search(username);
                    if (!users.isEmpty()) {
                        UserRepresentation userKey = users.get(0);
                        usersResource.get(userKey.getId()).remove();
                    }
                    userRepository.deleteById(userId);

                    return ResponseEntity.status(HttpStatus.OK).body("Le fournisseur et ses pages et produits ont été supprimés avec succès.");
                } else {
                    // Si l'utilisateur n'est pas un fournisseur, le supprimer sans vérification
                    UsersResource usersResource = keycloakConfiguration.getUserResource();
                    List<UserRepresentation> users = usersResource.search(username);
                    if (!users.isEmpty()) {
                        UserRepresentation userKey = users.get(0);
                        usersResource.get(userKey.getId()).remove();
                    }
                    userRepository.deleteById(userId);
                    return ResponseEntity.status(HttpStatus.NO_CONTENT).body("L'utilisateur a été supprimé de Keycloak et de la base de données.");
                }
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("L'utilisateur n'existe pas dans la base de données.");
            }
        } catch (Exception e) {
            System.out.println("Exception dans deleteUser : " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Une erreur s'est produite lors de la suppression de l'utilisateur : " + e.getMessage());
        }
    }


    @Override
    public ResponseEntity<ApiResponse> updateUser(String username, EditProfileDTO editProfileDTO) {
        try {
            // Validation des champs de l'utilisateur
            if (editProfileDTO.getNom() == null || editProfileDTO.getNom().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "Le nom est obligatoire."));
            }
            if (editProfileDTO.getPrenom() == null || editProfileDTO.getPrenom().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "Le prénom est obligatoire."));
            }
            if (editProfileDTO.getPassword() != null && !editProfileDTO.getPassword().isEmpty()) {
                if (!isValidPassword(editProfileDTO.getPassword())) {
                    return ResponseEntity.badRequest().body(new ApiResponse("error", "Le mot de passe est invalide."));
                }
            }
            if (editProfileDTO.getEmail() == null || editProfileDTO.getEmail().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "L'e-mail est obligatoire."));
            }
            if (!isValidEmail(editProfileDTO.getEmail())) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "L'e-mail est invalide."));
            }
            if (editProfileDTO.getNumTel() == null || editProfileDTO.getNumTel().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "Le numéro de téléphone est obligatoire."));
            }
            if (editProfileDTO.getLocalisation() == null || editProfileDTO.getLocalisation().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse("error", "La localisation est obligatoire."));
            }

            if (editProfileDTO.getRole() == Role.FOURNISSEUR) {
                if (editProfileDTO.getSiteweb() == null || editProfileDTO.getSiteweb().isEmpty()) {
                    return ResponseEntity.badRequest().body(new ApiResponse("error", "Le site web est obligatoire pour le rôle de fournisseur."));
                }
                if (!isValidWebsite(editProfileDTO.getSiteweb())) {
                    return ResponseEntity.badRequest().body(new ApiResponse("error", "Le site web est invalide."));
                }
            }

            // Vérifier si l'utilisateur existe dans la base de données
            Optional<User> optionalUser = userRepository.findByUsername(username);

            if (!optionalUser.isPresent()) {
                // L'utilisateur n'existe pas dans la base de données
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse("error", "L'utilisateur n'existe pas dans votre base."));
            }

            User user = optionalUser.get();

            // Vérifier si l'utilisateur existe dans Keycloak
            UsersResource usersResource = keycloakConfiguration.getUserResource();
            List<UserRepresentation> users = usersResource.search(username);
            if (users.isEmpty()) {
                // L'utilisateur n'existe pas dans Keycloak
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse("error", "L'utilisateur n'existe pas dans Keycloak."));
            }

            UserRepresentation userKey = users.get(0);

            // Mettre à jour les informations de l'utilisateur dans Keycloak
            userKey.setFirstName(editProfileDTO.getNom());
            userKey.setLastName(editProfileDTO.getPrenom());
            userKey.setEmail(editProfileDTO.getEmail());

            if (editProfileDTO.getPassword() != null && !editProfileDTO.getPassword().isEmpty()) {
                // Mettre à jour le mot de passe dans Keycloak
                CredentialRepresentation credential = Credentials.createPasswordCredentials(editProfileDTO.getPassword());
                userKey.setCredentials(Collections.singletonList(credential));
            }

            try {
                // Tenter de mettre à jour l'utilisateur dans Keycloak
                usersResource.get(userKey.getId()).update(userKey);

                // Mettre à jour l'utilisateur dans la base de données
                user.setNom(editProfileDTO.getNom());
                user.setPrenom(editProfileDTO.getPrenom());
                user.setEmail(editProfileDTO.getEmail());
                user.setLocalisation(editProfileDTO.getLocalisation());
                user.setNumTel(editProfileDTO.getNumTel());
                user.setSiteweb(editProfileDTO.getSiteweb());

                userRepository.save(user);

                // Retourner une réponse OK
                return ResponseEntity.ok().body(new ApiResponse("success", "Utilisateur mis à jour avec succès.", user));

            } catch (Exception e) {
                // Gérer les erreurs lors de la mise à jour dans Keycloak
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse("error", "Échec de la mise à jour dans Keycloak : " + e.getMessage()));
            }

        } catch (Exception e) {
            // Gérer les erreurs générales
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse("error", "Une erreur s'est produite lors de la mise à jour de l'utilisateur : " + e.getMessage()));
        }
    }




    public ResponseEntity<String> updateUserConfirmationState(String username) {
        try {
            // Vérifier si l'utilisateur existe dans la base de données
            Optional<User> optionalUser = userRepository.findByUsername(username);
            if (optionalUser.isPresent()) {
                User user = optionalUser.get();

                // Vérifier si l'utilisateur a le rôle FOURNISSEUR
                if (user.getRole() == Role.FOURNISSEUR) {
                    // Mettre à jour l'état de confirmation de l'utilisateur dans Keycloak
                    UsersResource usersResource = keycloakConfiguration.getUserResource();
                    List<UserRepresentation> users = usersResource.search(user.getUsername());
                    if (!users.isEmpty()) {
                        UserRepresentation userKey = users.get(0);
                        userKey.getAttributes().put("etat_fournisseur", Arrays.asList(EtatConfirmation.CONFIRMEE.toString()));
                        usersResource.get(userKey.getId()).update(userKey);
                    } else {
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("L'utilisateur n'existe pas dans Keycloak.");
                    }

                    // Mettre à jour l'état de confirmation de l'utilisateur dans la base de données
                    user.setEtatConfirmation(EtatConfirmation.CONFIRMEE);
                    userRepository.save(user);

                    // Envoyer un e-mail au fournisseur pour l'informer que son état est confirmé
                    sendConfirmationEmail(user);

                    // Retourner une réponse OK
                    return ResponseEntity.ok().body("État de confirmation de l'utilisateur mis à jour avec succès.");
                } else {
                    // Retourner une réponse Bad Request si l'utilisateur n'a pas le rôle FOURNISSEUR
                    return ResponseEntity.badRequest().body("L'utilisateur n'a pas le rôle FOURNISSEUR.");
                }
            } else {
                // Retourner une réponse Not Found si l'utilisateur n'existe pas dans la base de données
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("L'utilisateur n'existe pas dans votre base.");
            }
        } catch (Exception e) {
            // Gérer les exceptions et retourner une réponse d'erreur
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Une erreur s'est produite lors de la mise à jour de l'état de confirmation de l'utilisateur : " + e.getMessage());
        }
    }


    private void sendConfirmationEmail(User user) {
        String subject = "Confirmation de votre état de fournisseur";
        String templatePath = "templates/template.html";
        Map<String, String> placeholders = new HashMap<>();
        placeholders.put("name", user.getNom());
        placeholders.put("customMessage", "Votre état a été confirmé. Vous pouvez maintenant accéder à notre site. on attendant la mise a jour et le traitement de vos donner  ");

        try {
            mailSender.sendHtmlMessage(user.getEmail(), subject, templatePath, placeholders);
        } catch (MessagingException | IOException e) {
            e.printStackTrace();
            // Vous pouvez gérer l'exception en conséquence, par exemple en journalisant l'erreur ou en envoyant une alerte à l'administrateur.
        }
    }



    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    public Optional<User> getUserByID(String username) {
        return userRepository.findByUsername(username);
    }


    @Override
    public List<User> getAllSuppliers_enattende() {
        return userRepository.findByRoleAndEtatConfirmation(Role.FOURNISSEUR,EtatConfirmation.EN_ATTENTE);
    }


    @Autowired
    private MailSenderImpl mailSender;


    public ResponseEntity<String> sendTestEmail(String role, String email) {
        try {
            String subject = "Test d'e-mail pour le rôle " + role;
            String templatePath = "";
            Map<String, String> placeholders = new HashMap<>();

            switch (role) {
                case "FOURNISSEUR":
                    templatePath = "templates/template.html";
                    placeholders.put("name", "Fournisseur");
                    placeholders.put("customMessage", "Vous êtes le bienvenu. Votre situation est en attente. Dès que nous préparons vos données pour que vous soyez présent sur notre site, nous vous donnerons l'information. Veuillez patienter..");
                    break;
                case "SCRAPPER":
                    templatePath = "templates/template.html";
                    placeholders.put("name", "Scrapper");
                    placeholders.put("customMessage", "Vous êtes maintenant membre de notre équipe. Vous pouvez accéder à votre compte et faire le nécessaire pour maintenir le site et effectuer les tâches nécessaires.");
                    break;
                case "CLIENT":
                    templatePath = "templates/template.html";
                    placeholders.put("name", "Client");
                    placeholders.put("customMessage", "Bienvenue sur notre site. Notre site vous fournit les meilleurs produits avec les meilleurs prix..");
                    break;
                default:
                    templatePath = "templates/default_template.html";
                    placeholders.put("name", "Utilisateur");
                    placeholders.put("customMessage", "Test d'e-mail pour un rôle inconnu.");
            }

            mailSender.sendHtmlMessage(email, subject, templatePath, placeholders);

            return ResponseEntity.ok().body("Test d'e-mail envoyé avec succès.");
        } catch (MessagingException | IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Une erreur s'est produite : " + e.getMessage());
        }
    }

    public ResponseEntity<List<User>> getAllAdmins() {
        try {
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            return ResponseEntity.ok(admins);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }


    public ResponseEntity<List<User>> getAllscrapers() {
        try {
            List<User> admins = userRepository.findByRole(Role.SCRAPPER);
            return ResponseEntity.ok(admins);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }





}
