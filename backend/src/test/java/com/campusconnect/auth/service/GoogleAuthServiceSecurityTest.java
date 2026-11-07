package com.campusconnect.auth.service;

import com.campusconnect.auth.dto.AuthResponse;
import com.campusconnect.auth.dto.GoogleAuthRequest;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.model.User;
import com.campusconnect.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

public class GoogleAuthServiceSecurityTest {

    private InMemoryUserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private TestableGoogleTokenVerifierService verifierService;
    private AuthService authService;

    // Lightweight in-memory stub avoiding Java 25 Mockito class instrumentation issues
    static class InMemoryUserRepository implements UserRepository {
        final Map<Long, User> usersById = new HashMap<>();
        final Map<String, User> usersByEmail = new HashMap<>();
        final Map<String, User> usersBySub = new HashMap<>();
        long idSeq = 100L;

        @Override
        public Optional<User> findByEmail(String email) {
            return Optional.ofNullable(usersByEmail.get(email.toLowerCase()));
        }

        @Override
        public Optional<User> findByGoogleSub(String googleSub) {
            return Optional.ofNullable(usersBySub.get(googleSub));
        }

        @Override
        public boolean existsByEmail(String email) {
            return usersByEmail.containsKey(email.toLowerCase());
        }

        @Override
        public <S extends User> S save(S user) {
            if (user.getId() == null) {
                user.setId(++idSeq);
            }
            usersById.put(user.getId(), user);
            usersByEmail.put(user.getEmail().toLowerCase(), user);
            if (user.getGoogleSub() != null) {
                usersBySub.put(user.getGoogleSub(), user);
            }
            return user;
        }

        @Override public Optional<User> findById(Long id) { return Optional.ofNullable(usersById.get(id)); }
        @Override public boolean existsById(Long id) { return usersById.containsKey(id); }
        @Override public long count() { return usersById.size(); }
        @Override public void deleteById(Long id) { usersById.remove(id); }
        @Override public void delete(User entity) { usersById.remove(entity.getId()); }
        @Override public void deleteAllById(Iterable<? extends Long> ids) {}
        @Override public void deleteAll(Iterable<? extends User> entities) {}
        @Override public void deleteAll() {}
        @Override public java.util.List<User> findAll() { return new java.util.ArrayList<>(usersById.values()); }
        @Override public java.util.List<User> findAllById(Iterable<Long> ids) { return java.util.Collections.emptyList(); }
        @Override public <S extends User> java.util.List<S> saveAll(Iterable<S> entities) { return java.util.Collections.emptyList(); }
        @Override public void flush() {}
        @Override public <S extends User> S saveAndFlush(S entity) { return save(entity); }
        @Override public <S extends User> java.util.List<S> saveAllAndFlush(Iterable<S> entities) { return java.util.Collections.emptyList(); }
        @Override public void deleteAllInBatch(Iterable<User> entities) {}
        @Override public void deleteAllByIdInBatch(Iterable<Long> ids) {}
        @Override public void deleteAllInBatch() {}
        @Override public User getOne(Long id) { return usersById.get(id); }
        @Override public User getById(Long id) { return usersById.get(id); }
        @Override public User getReferenceById(Long id) { return usersById.get(id); }
        @Override public <S extends User> Optional<S> findOne(org.springframework.data.domain.Example<S> example) { return Optional.empty(); }
        @Override public <S extends User> java.util.List<S> findAll(org.springframework.data.domain.Example<S> example) { return java.util.Collections.emptyList(); }
        @Override public <S extends User> java.util.List<S> findAll(org.springframework.data.domain.Example<S> example, org.springframework.data.domain.Sort sort) { return java.util.Collections.emptyList(); }
        @Override public <S extends User> org.springframework.data.domain.Page<S> findAll(org.springframework.data.domain.Example<S> example, org.springframework.data.domain.Pageable pageable) { return null; }
        @Override public <S extends User> long count(org.springframework.data.domain.Example<S> example) { return 0; }
        @Override public <S extends User> boolean exists(org.springframework.data.domain.Example<S> example) { return false; }
        @Override public <S extends User, R> R findBy(org.springframework.data.domain.Example<S> example, java.util.function.Function<org.springframework.data.repository.query.FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
        @Override public java.util.List<User> findAll(org.springframework.data.domain.Sort sort) { return findAll(); }
        @Override public org.springframework.data.domain.Page<User> findAll(org.springframework.data.domain.Pageable pageable) { return null; }
        @Override public long countByRole(Role role) { return 0; }
        @Override public java.util.List<User> findByRole(Role role) { return usersById.values().stream().filter(u -> u.getRole() == role).toList(); }
    }

    static class TestableGoogleTokenVerifierService extends GoogleTokenVerifierService {
        GoogleUserPayload stubPayload;

        @Override
        public GoogleUserPayload verifyToken(String idToken) {
            if (stubPayload != null) {
                return stubPayload;
            }
            return super.verifyToken(idToken);
        }
    }

    @BeforeEach
    void setUp() {
        userRepository = new InMemoryUserRepository();
        passwordEncoder = new BCryptPasswordEncoder();

        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", "RYuPADGXp6U3uf5t4rr_qzZlIY1-yETCfAW0VQb___4=");
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 86400000L);

        verifierService = new TestableGoogleTokenVerifierService();
        ReflectionTestUtils.setField(verifierService, "googleClientId", "test-client-id.apps.googleusercontent.com");
        ReflectionTestUtils.setField(verifierService, "googleAuthEnabled", true);
        ReflectionTestUtils.setField(verifierService, "allowMockTokens", true);
        ReflectionTestUtils.setField(verifierService, "activeProfile", "dev");
        verifierService.init();

        authService = new AuthService(
                userRepository,
                passwordEncoder,
                jwtService,
                null,
                verifierService
        );
    }

    @Test
    @DisplayName("Cryptographic Verifier: Forged or malformed Google ID token must be rejected")
    void testGenuineTokenVerifierRejectsForgedToken() {
        String forgedToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwic3ViIjoiMTIzNDU2In0.invalid_signature";

        BadCredentialsException exception = assertThrows(BadCredentialsException.class, () -> {
            verifierService.verifyToken(forgedToken);
        });

        assertNotNull(exception.getMessage());
        assertTrue(exception.getMessage().contains("signature") || exception.getMessage().contains("failed") || exception.getMessage().contains("Invalid"),
                "Expected cryptographic verification error, got: " + exception.getMessage());
    }

    @Test
    @DisplayName("Production Security: Mock tokens must be strictly rejected in production profile")
    void testMockTokenRejectedInProductionProfile() {
        ReflectionTestUtils.setField(verifierService, "activeProfile", "prod");
        ReflectionTestUtils.setField(verifierService, "allowMockTokens", false);

        BadCredentialsException exception = assertThrows(BadCredentialsException.class, () -> {
            verifierService.verifyToken("mock-google-token-user@thapar.edu");
        });

        assertTrue(exception.getMessage().contains("strictly prohibited in production"),
                "Expected production rejection message, got: " + exception.getMessage());
    }

    @Test
    @DisplayName("Account Takeover Prevention: Cannot take over an Event Admin or Super Admin account via Google OAuth")
    void testPreventAdminAccountTakeover() {
        // Pre-create an EVENT_ADMIN in database
        User targetAdmin = User.builder()
                .id(2L)
                .email("admin@campusconnect.com")
                .name("Real Admin")
                .role(Role.EVENT_ADMIN)
                .authProvider("LOCAL")
                .status("APPROVED")
                .build();
        userRepository.save(targetAdmin);

        GoogleTokenVerifierService.GoogleUserPayload payload = new GoogleTokenVerifierService.GoogleUserPayload();
        payload.setEmail("admin@campusconnect.com");
        payload.setEmailVerified(true);
        payload.setName("Admin Impersonator");
        payload.setSub("google-sub-attacker-123");
        verifierService.stubPayload = payload;

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setIdToken("token-test");

        AccessDeniedException exception = assertThrows(AccessDeniedException.class, () -> {
            authService.authenticateWithGoogle(request);
        });

        assertTrue(exception.getMessage().contains("Administrative and Organizer accounts cannot be accessed or linked via Google Sign-In"),
                "Expected admin protection message, got: " + exception.getMessage());
    }

    @Test
    @DisplayName("Identity Protection: Reject account linking if account is already tied to a different Google Sub")
    void testPreventDuplicateIdentityCollision() {
        // Pre-create user bound to original-sub-111
        User existingUser = User.builder()
                .id(10L)
                .email("student@thapar.edu")
                .googleSub("original-google-sub-111")
                .role(Role.PARTICIPANT)
                .authProvider("GOOGLE")
                .status("APPROVED")
                .build();
        userRepository.save(existingUser);

        GoogleTokenVerifierService.GoogleUserPayload payload = new GoogleTokenVerifierService.GoogleUserPayload();
        payload.setEmail("student@thapar.edu");
        payload.setEmailVerified(true);
        payload.setName("Student");
        payload.setSub("different-google-sub-999");
        verifierService.stubPayload = payload;

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setIdToken("token-test");

        BadCredentialsException exception = assertThrows(BadCredentialsException.class, () -> {
            authService.authenticateWithGoogle(request);
        });

        assertTrue(exception.getMessage().contains("already associated with a different Google account"),
                "Expected collision rejection, got: " + exception.getMessage());
    }

    @Test
    @DisplayName("Participant Self-Registration: Creates participant with stable google_sub and forces Role.PARTICIPANT")
    void testParticipantSelfRegistrationWithSub() {
        GoogleTokenVerifierService.GoogleUserPayload payload = new GoogleTokenVerifierService.GoogleUserPayload();
        payload.setEmail("newstudent@thapar.edu");
        payload.setEmailVerified(true);
        payload.setName("New Student");
        payload.setSub("google-sub-555");
        payload.setPicture("https://avatar.url/img.png");
        verifierService.stubPayload = payload;

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setIdToken("token-555");
        request.setDepartment("Computer Engineering");

        AuthResponse response = authService.authenticateWithGoogle(request);

        assertNotNull(response);
        assertEquals("newstudent@thapar.edu", response.getEmail());
        assertEquals(Role.PARTICIPANT, response.getRole());
        assertNotNull(response.getToken());

        User savedUser = userRepository.findByEmail("newstudent@thapar.edu").orElseThrow();
        assertEquals("google-sub-555", savedUser.getGoogleSub());
        assertEquals(Role.PARTICIPANT, savedUser.getRole());
        assertEquals("GOOGLE", savedUser.getAuthProvider());
    }
}
