package com.example.Usersmicroservice.Implementations;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import com.example.Usersmicroservice.DTO.LoginResponse;
import com.example.Usersmicroservice.Entities.User;
import com.example.Usersmicroservice.Implementations.UserServiceImpl;
import com.example.Usersmicroservice.Repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

public class LoginServiceImplTest {

    @InjectMocks
    private LoginServiceImpl loginService;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private UserServiceImpl userService;
    @Mock

    private UserRepository userRepository;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testRefreshToken() {
        // Arrange
        String oldRefreshToken = "old_refresh_token";
        String newAccessToken = "new_access_token";
        String newRefreshToken = "new_refresh_token";

        User user = new User();
        user.setRefreshToken(oldRefreshToken);

        LoginResponse loginResponse = new LoginResponse();
        loginResponse.setAccess_token(newAccessToken);
        loginResponse.setRefresh_token(newRefreshToken);

        ResponseEntity<LoginResponse> responseEntity = new ResponseEntity<>(loginResponse, HttpStatus.OK);

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(LoginResponse.class)))
                .thenReturn(responseEntity);

        when(userService.getUserByUsername(anyString())).thenReturn(Optional.of(user));

        // Act
        String result = loginService.refreshToken(user);

        // Assert
        assertEquals(newAccessToken, result);
        assertEquals(newRefreshToken, user.getRefreshToken());
        verify(userRepository).save(user);
    }
}
