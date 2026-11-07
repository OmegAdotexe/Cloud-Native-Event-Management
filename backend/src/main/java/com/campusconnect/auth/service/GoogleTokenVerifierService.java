package com.campusconnect.auth.service;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;

@Service
@Slf4j
public class GoogleTokenVerifierService {

    @Value("${google.client-id:YOUR_GOOGLE_CLIENT_ID}")
    private String googleClientId;

    @Value("${google.enabled:false}")
    private boolean googleAuthEnabled;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    @Data
    public static class GoogleUserPayload {
        private String email;
        private boolean emailVerified;
        private String name;
        private String picture;
        private String sub;
    }

    public GoogleUserPayload verifyToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new BadCredentialsException("Google ID token cannot be empty");
        }

        // Support local mock/dev testing tokens when Google OAuth is in development
        if (idToken.startsWith("mock-google-token-") || "YOUR_GOOGLE_CLIENT_ID".equals(googleClientId)) {
            if (idToken.startsWith("mock-google-token-")) {
                String email = idToken.replace("mock-google-token-", "").trim();
                if (!email.contains("@")) {
                    email = email + "@thapar.edu";
                }
                GoogleUserPayload mockPayload = new GoogleUserPayload();
                mockPayload.setEmail(email.toLowerCase());
                mockPayload.setEmailVerified(true);
                mockPayload.setName("Google User (" + email.split("@")[0] + ")");
                mockPayload.setPicture("https://ui-avatars.com/api/?name=" + email);
                mockPayload.setSub("mock-sub-" + email.hashCode());
                return mockPayload;
            }
        }

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(GOOGLE_TOKENINFO_URL + idToken, Map.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new BadCredentialsException("Invalid or rejected Google ID token");
            }

            Map<String, Object> body = response.getBody();

            // 1. Verify issuer
            String iss = (String) body.get("iss");
            if (!"accounts.google.com".equals(iss) && !"https://accounts.google.com".equals(iss)) {
                throw new BadCredentialsException("Google token has invalid issuer: " + iss);
            }

            // 2. Verify audience (if client id is configured)
            String aud = (String) body.get("aud");
            if (!"YOUR_GOOGLE_CLIENT_ID".equals(googleClientId) && !googleClientId.equals(aud)) {
                throw new BadCredentialsException("Google token audience mismatch");
            }

            // 3. Verify expiration
            String expStr = String.valueOf(body.get("exp"));
            long expSeconds = Long.parseLong(expStr);
            if (Instant.now().getEpochSecond() > expSeconds) {
                throw new BadCredentialsException("Google ID token is expired");
            }

            // 4. Verify email verification
            Object emailVerifiedObj = body.get("email_verified");
            boolean emailVerified = "true".equalsIgnoreCase(String.valueOf(emailVerifiedObj));
            if (!emailVerified) {
                throw new BadCredentialsException("Google account email is not verified");
            }

            String email = (String) body.get("email");
            if (email == null || email.isBlank()) {
                throw new BadCredentialsException("Google token missing email claim");
            }

            GoogleUserPayload payload = new GoogleUserPayload();
            payload.setEmail(email.toLowerCase().trim());
            payload.setEmailVerified(true);
            payload.setName((String) body.getOrDefault("name", email.split("@")[0]));
            payload.setPicture((String) body.get("picture"));
            payload.setSub((String) body.get("sub"));

            return payload;
        } catch (BadCredentialsException bce) {
            throw bce;
        } catch (Exception ex) {
            log.error("Google token verification failed: {}", ex.getMessage());
            throw new BadCredentialsException("Failed to verify Google token with identity provider: " + ex.getMessage());
        }
    }
}

