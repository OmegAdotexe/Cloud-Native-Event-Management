package com.campusconnect.common.config;

import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import com.campusconnect.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DatabaseSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    @Profile("!test") // Do not run in test environments to avoid side effects
    public CommandLineRunner seedDatabase() {
        return args -> {
            if (!userRepository.existsByEmail("superadmin@example.com")) {
                userRepository.save(User.builder()
                        .name("Super Admin")
                        .email("superadmin@example.com")
                        .password(passwordEncoder.encode("password"))
                        .role(Role.SUPER_ADMIN)
                        .build());
            }

            if (!userRepository.existsByEmail("admin@example.com")) {
                userRepository.save(User.builder()
                        .name("Event Admin")
                        .email("admin@example.com")
                        .password(passwordEncoder.encode("password"))
                        .role(Role.EVENT_ADMIN)
                        .build());
            }

            if (!userRepository.existsByEmail("participant@example.com")) {
                userRepository.save(User.builder()
                        .name("Participant")
                        .email("participant@example.com")
                        .password(passwordEncoder.encode("password"))
                        .role(Role.PARTICIPANT)
                        .build());
            }
        };
    }
}
