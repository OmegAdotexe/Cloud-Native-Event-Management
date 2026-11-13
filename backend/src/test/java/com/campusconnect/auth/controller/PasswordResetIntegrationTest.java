package com.campusconnect.auth.controller;

import com.campusconnect.auth.dto.ForgotPasswordRequest;
import com.campusconnect.auth.dto.LoginRequest;
import com.campusconnect.auth.dto.ResetPasswordRequest;
import com.campusconnect.auth.model.PasswordResetToken;
import com.campusconnect.auth.repository.PasswordResetTokenRepository;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import com.campusconnect.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PasswordResetIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;

    @BeforeEach
    void setUp() {
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(User.builder()
                .name("Alex River")
                .email("alex@campus.edu")
                .password(passwordEncoder.encode("oldPassword123"))
                .role(Role.PARTICIPANT)
                .authProvider("LOCAL")
                .status("APPROVED")
                .build());
    }

    @Test
    void forgotPassword_ValidEmail_GeneratesTokenAndReturnsGenericSuccess() throws Exception {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("alex@campus.edu")
                .build();

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("If that email address is registered with us")));

        assertThat(passwordResetTokenRepository.count()).isEqualTo(1);
        PasswordResetToken token = passwordResetTokenRepository.findAll().get(0);
        assertThat(token.getUser().getId()).isEqualTo(testUser.getId());
        assertThat(token.isUsed()).isFalse();
        assertThat(token.getExpiresAt()).isAfter(LocalDateTime.now());
    }

    @Test
    void forgotPassword_NonExistentEmail_ReturnsSameGenericSuccessWithoutGeneratingToken() throws Exception {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("unknown@campus.edu")
                .build();

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("If that email address is registered with us")));

        assertThat(passwordResetTokenRepository.count()).isZero();
    }

    @Test
    void forgotPassword_InvalidEmailFormat_ReturnsBadRequest() throws Exception {
        String invalidPayload = "{\"email\":\"not-a-valid-email\"}";

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resetPassword_ValidToken_UpdatesPasswordAndAllowsSubsequentLogin() throws Exception {
        PasswordResetToken resetToken = passwordResetTokenRepository.save(PasswordResetToken.builder()
                .user(testUser)
                .token("valid-test-token-12345")
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build());

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .token("valid-test-token-12345")
                .newPassword("brandNewPassword456")
                .confirmPassword("brandNewPassword456")
                .build();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("successfully reset")));

        // Verify token marked as used
        PasswordResetToken updatedToken = passwordResetTokenRepository.findById(resetToken.getId()).orElseThrow();
        assertThat(updatedToken.isUsed()).isTrue();

        // Verify password in DB updated
        User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertThat(passwordEncoder.matches("brandNewPassword456", updatedUser.getPassword())).isTrue();

        // Verify login with new password succeeds
        LoginRequest loginRequest = LoginRequest.builder()
                .email("alex@campus.edu")
                .password("brandNewPassword456")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

        // Verify login with old password now fails
        LoginRequest oldLoginRequest = LoginRequest.builder()
                .email("alex@campus.edu")
                .password("oldPassword123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oldLoginRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resetPassword_PasswordMismatch_ReturnsBadRequest() throws Exception {
        passwordResetTokenRepository.save(PasswordResetToken.builder()
                .user(testUser)
                .token("mismatch-test-token")
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build());

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .token("mismatch-test-token")
                .newPassword("brandNewPassword456")
                .confirmPassword("differentPassword789")
                .build();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Passwords do not match")));
    }

    @Test
    void resetPassword_ExpiredToken_ReturnsBadRequest() throws Exception {
        passwordResetTokenRepository.save(PasswordResetToken.builder()
                .user(testUser)
                .token("expired-test-token")
                .expiresAt(LocalDateTime.now().minusMinutes(10))
                .used(false)
                .build());

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .token("expired-test-token")
                .newPassword("brandNewPassword456")
                .confirmPassword("brandNewPassword456")
                .build();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("expired")));
    }

    @Test
    void resetPassword_AlreadyUsedToken_ReturnsBadRequest() throws Exception {
        passwordResetTokenRepository.save(PasswordResetToken.builder()
                .user(testUser)
                .token("already-used-test-token")
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .used(true)
                .build());

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .token("already-used-test-token")
                .newPassword("brandNewPassword456")
                .confirmPassword("brandNewPassword456")
                .build();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("already been used")));
    }
}
