package com.example.Usersmicroservice.Config;


import jakarta.servlet.DispatcherType;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthConverter jwtAuthConverter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }


    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        return httpSecurity
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests((authorize) -> authorize
                        .dispatcherTypeMatchers(DispatcherType.FORWARD, DispatcherType.ERROR).permitAll()
                        .requestMatchers("/api/auth/test/{role}/{email}/").permitAll()
                        .requestMatchers("/api/auth/register").permitAll()
                        .requestMatchers("/api/auth/validate").permitAll()

                        .requestMatchers("/api/auth/refresh-token").permitAll()
                        .requestMatchers("/api/auth/check-login").permitAll()
                        .requestMatchers("/scraping/token").permitAll()
                        .requestMatchers("/scraping/creer_page/{user_id}/").permitAll()
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/Fournisseur/find/{iduser}/").permitAll()
                        .requestMatchers("/api/auth/users/find/id/{iduser}/").permitAll()
                        .requestMatchers("/api/auth/users/find/{username}/").permitAll()

                        .requestMatchers("/api/auth/Fournisseur/find/username/{username}/").permitAll()
                        .requestMatchers("/api/auth/listfournisseur").permitAll()
                        .requestMatchers("/api/auth/produits_fournisseur/{id_fournisseur}/").permitAll() //cette methode dans django
                        .requestMatchers("/api/auth/{id}/etatConfirmation/").permitAll()
                        .requestMatchers("/api/auth/Admins/").permitAll()
                        .requestMatchers("/api/auth/Scrapers/").permitAll()

                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter)))

                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .build();
    }
}