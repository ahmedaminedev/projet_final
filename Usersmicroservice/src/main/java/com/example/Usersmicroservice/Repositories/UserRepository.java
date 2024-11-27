package com.example.Usersmicroservice.Repositories;

import com.example.Usersmicroservice.Entities.User;
import com.example.Usersmicroservice.Enum.EtatConfirmation;
import com.example.Usersmicroservice.Enum.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Boolean existsByUsername(String username);
    List<User> findByRoleAndEtatConfirmation(Role role, EtatConfirmation etatConfirmation);
    List<User> findByRole(Role role);


}
