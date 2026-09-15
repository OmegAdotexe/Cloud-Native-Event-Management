package com.campusconnect.common.security;

import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import com.campusconnect.user.repository.UserRepository;
import com.campusconnect.auth.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(SecurityAccessTest.TestControllerConfig.class)
public class SecurityAccessTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private String participantToken;
    private String eventAdminToken;
    private String superAdminToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        User participant = userRepository.save(User.builder()
                .name("Participant")
                .email("participant@test.com")
                .password(passwordEncoder.encode("password"))
                .role(Role.PARTICIPANT)
                .build());
        participantToken = jwtService.generateToken(participant);

        User eventAdmin = userRepository.save(User.builder()
                .name("Event Admin")
                .email("eventadmin@test.com")
                .password(passwordEncoder.encode("password"))
                .role(Role.EVENT_ADMIN)
                .build());
        eventAdminToken = jwtService.generateToken(eventAdmin);

        User superAdmin = userRepository.save(User.builder()
                .name("Super Admin")
                .email("superadmin@test.com")
                .password(passwordEncoder.encode("password"))
                .role(Role.SUPER_ADMIN)
                .build());
        superAdminToken = jwtService.generateToken(superAdmin);
    }

    @Test
    void unauthenticatedUser_AccessingProtectedEndpoint_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/test/any"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void participant_AccessingAdminEndpoint_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/test/admin")
                        .header("Authorization", "Bearer " + participantToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void eventAdmin_AccessingAdminEndpoint_ShouldReturn200() throws Exception {
        mockMvc.perform(get("/api/test/admin")
                        .header("Authorization", "Bearer " + eventAdminToken))
                .andExpect(status().isOk());
    }

    @Test
    void superAdmin_AccessingAdminEndpoint_ShouldReturn200() throws Exception {
        mockMvc.perform(get("/api/test/admin")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk());
    }

    @Test
    void participant_AccessingSuperAdminEndpoint_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/test/super")
                        .header("Authorization", "Bearer " + participantToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void eventAdmin_AccessingSuperAdminEndpoint_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/test/super")
                        .header("Authorization", "Bearer " + eventAdminToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void superAdmin_AccessingSuperAdminEndpoint_ShouldReturn200() throws Exception {
        mockMvc.perform(get("/api/test/super")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk());
    }

    @TestConfiguration
    static class TestControllerConfig {
        @Bean
        public TestController testController() {
            return new TestController();
        }
    }

    @RestController
    @RequestMapping("/api/test")
    static class TestController {

        @GetMapping("/any")
        public String anyUser() {
            return "OK";
        }

        @PreAuthorize("hasAnyRole('EVENT_ADMIN', 'SUPER_ADMIN')")
        @GetMapping("/admin")
        public String adminEndpoint() {
            return "OK";
        }

        @PreAuthorize("hasRole('SUPER_ADMIN')")
        @GetMapping("/super")
        public String superAdminEndpoint() {
            return "OK";
        }
    }
}
