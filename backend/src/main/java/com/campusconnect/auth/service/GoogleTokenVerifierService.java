package com.campusconnect.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Service
@Slf4j
public class GoogleTokenVerifierService {

    @Value("${google.client-id:YOUR_GOOGLE_CLIENT_ID}")
    private String googleClientId;

    @Value("${google.enabled:false}")
    private boolean googleAuthEnabled;

    @Value("${google.allow-mock:true}")
    private boolean allowMockTokens;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    private GoogleIdTokenVerifier verifier;

    @Data
    public static class GoogleUserPayload {
        private String email;
        private boolean emailVerified;
        private String name;
        private String picture;
        private String sub;
    }

    @PostConstruct
    public void init() {
        if (!"YOUR_GOOGLE_CLIENT_ID".equals(googleClientId) && googleClientId != null && !googleClientId.isBlank()) {
            this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
            log.info("Initialized GoogleIdTokenVerifier with Client ID audience verification");
        } else {
            this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .build();
            log.info("Initialized GoogleIdTokenVerifier without audience restriction (awaiting production Client ID)");
        }
    }

    public GoogleUserPayload verifyToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new BadCredentialsException("Google ID token cannot be empty");
        }

        // 1. Mock token handling: strictly restricted to local development / test environments
        if (idToken.startsWith("mock-google-token-")) {
            boolean isDevOrTest = "dev".equalsIgnoreCase(activeProfile) || "test".equalsIgnoreCase(activeProfile);
            if (!isDevOrTest || !allowMockTokens) {
                log.error("SECURITY REJECTION: Attempt to use mock token in unauthorized profile: {} (allowMock: {})", activeProfile, allowMockTokens);
                throw new BadCredentialsException("Mock authentication tokens are strictly prohibited in production.");
            }

            String email = idToken.replace("mock-google-token-", "").trim();
            if (!email.contains("@")) {
                email = email + "@thapar.edu";
            }

            GoogleUserPayload mockPayload = new GoogleUserPayload();
            mockPayload.setEmail(email.toLowerCase());
            mockPayload.setEmailVerified(true);
            mockPayload.setName("Developer User (" + email.split("@")[0] + ")");
            mockPayload.setPicture("https://ui-avatars.com/api/?name=" + email);
            mockPayload.setSub("mock-sub-" + Math.abs(email.hashCode()));
            log.info("Mock token accepted for development testing: sub={}, email={}", mockPayload.getSub(), mockPayload.getEmail());
            return mockPayload;
        }

        // 2. Production gate: If genuine OAuth is disabled until HTTPS domain setup, reject gracefully
        if (!googleAuthEnabled && "prod".equalsIgnoreCase(activeProfile)) {
            log.warn("Production Google OAuth is currently disabled pending verified HTTPS domain configuration.");
            throw new BadCredentialsException("Google Sign-In is disabled on HTTP public IP until a verified HTTPS domain is attached.");
        }

        // 3. Genuine Google ID Token Cryptographic Verification via Google's Public JWK Certs
        try {
            GoogleIdToken googleIdToken = verifier.verify(idToken);
            if (googleIdToken == null) {
                log.warn("Cryptographic signature, audience, or timestamp verification failed for provided Google ID token");
                throw new BadCredentialsException("Invalid or forged Google ID token signature");
            }

            GoogleIdToken.Payload payload = googleIdToken.getPayload();

            // Validate issuer (accounts.google.com or https://accounts.google.com)
            String issuer = payload.getIssuer();
            if (!"accounts.google.com".equals(issuer) && !"https://accounts.google.com".equals(issuer)) {
                throw new BadCredentialsException("Google token has invalid issuer: " + issuer);
            }

            // Validate email verified claim
            Boolean emailVerified = payload.getEmailVerified();
            if (emailVerified == null || !emailVerified) {
                throw new BadCredentialsException("Google account email is not verified by Google");
            }

            // Extract claims
            String email = payload.getEmail();
            if (email == null || email.isBlank()) {
                throw new BadCredentialsException("Google token missing verified email claim");
            }

            String sub = payload.getSubject();
            if (sub == null || sub.isBlank()) {
                throw new BadCredentialsException("Google token missing subject (sub) claim");
            }

            GoogleUserPayload result = new GoogleUserPayload();
            result.setEmail(email.toLowerCase().trim());
            result.setEmailVerified(true);
            result.setName((String) payload.getOrDefault("name", email.split("@")[0]));
            result.setPicture((String) payload.get("picture"));
            result.setSub(sub);

            return result;
        } catch (BadCredentialsException bce) {
            throw bce;
        } catch (IllegalArgumentException iae) {
            log.warn("Malformed Base64 structure in Google ID token: {}", iae.getMessage());
            throw new BadCredentialsException("Malformed Google ID token format: " + iae.getMessage());
        } catch (GeneralSecurityException | IOException ex) {
            log.error("Cryptographic verification error during Google token parsing: {}", ex.getMessage());
            throw new BadCredentialsException("Cryptographic verification of Google ID token failed: " + ex.getMessage());
        }
    }
}
