package com.example.microservice_relamations.Relations;

import com.example.microservice_relamations.DTO.UserDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "users-microservice", url = "http://localhost:8070/auth-s/api/auth")
public interface UserClient {

    @GetMapping("/users/find/id/{iduser}/")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SCRAPPER') or hasRole('FOURNISSEUR') or hasRole('CLIENT') ")
    UserDTO getUserById(@PathVariable("iduser") Long id);


    @GetMapping("/users/find/{username}/")
    UserDTO getUserByUsername(@PathVariable("username") String username);
}
