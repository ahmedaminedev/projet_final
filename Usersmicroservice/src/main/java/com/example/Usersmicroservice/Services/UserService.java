package com.example.Usersmicroservice.Services;

import com.example.Usersmicroservice.DTO.ApiResponse;
import com.example.Usersmicroservice.DTO.EditProfileDTO;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.http.HttpInputMessage;
import com.example.Usersmicroservice.DTO.RegistrationDTO;
import com.example.Usersmicroservice.Entities.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;

public interface UserService {
    public ResponseEntity<ApiResponse> addUser(RegistrationDTO registrationDTO) ;
        public ResponseEntity<String> deleteUser(Long userId, String username) ;

    public ResponseEntity<ApiResponse> updateUser(String username, EditProfileDTO editProfileDTO) ;


    public List<User> getAllSuppliers_enattende() ;

    }
