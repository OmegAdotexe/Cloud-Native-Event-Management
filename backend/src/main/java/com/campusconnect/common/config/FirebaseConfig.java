package com.campusconnect.common.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.credentials-path:}")
    private String credentialsPath;

    @Value("${firebase.project-id:campusconnect-bced1}")
    private String projectId;

    @PostConstruct
    public void init() {
        if (!FirebaseApp.getApps().isEmpty()) {
            log.info("FirebaseApp already initialized.");
            return;
        }

        try {
            FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder();
            GoogleCredentials credentials = null;

            InputStream serviceAccountStream = resolveCredentialsStream();
            if (serviceAccountStream != null) {
                try (serviceAccountStream) {
                    credentials = GoogleCredentials.fromStream(serviceAccountStream);
                    log.info("Loaded Firebase credentials successfully from service account stream.");
                } catch (IOException e) {
                    log.error("Failed to parse Firebase credentials from stream: {}", e.getMessage(), e);
                }
            } else {
                try {
                    credentials = GoogleCredentials.getApplicationDefault();
                    log.info("Initialized Firebase using Google Application Default Credentials (ADC).");
                } catch (IOException e) {
                    log.warn("Application Default Credentials not found for Firebase: {}. Firebase initialization deferred until credentials are configured.", e.getMessage());
                }
            }

            if (credentials != null) {
                optionsBuilder.setCredentials(credentials);
                if (projectId != null && !projectId.isBlank()) {
                    optionsBuilder.setProjectId(projectId.trim());
                }
                FirebaseApp.initializeApp(optionsBuilder.build());
                log.info("FirebaseApp successfully initialized for project: {}", projectId != null && !projectId.isBlank() ? projectId : "default");
            } else {
                log.warn("FirebaseApp was not initialized because neither credentials-path nor GOOGLE_APPLICATION_CREDENTIALS were provided.");
            }
        } catch (Exception e) {
            log.error("Failed to initialize FirebaseApp: {}", e.getMessage(), e);
        }
    }

    private InputStream resolveCredentialsStream() {
        // 1. Explicitly configured credentials path (property / env)
        if (credentialsPath != null && !credentialsPath.isBlank()) {
            File f = new File(credentialsPath.trim());
            if (f.exists() && f.isFile()) {
                try {
                    log.info("Using Firebase credentials from configured path: {}", f.getAbsolutePath());
                    return new FileInputStream(f);
                } catch (IOException e) {
                    log.warn("Could not read credentials at configured path: {}", credentialsPath);
                }
            }
        }

        // 2. Check FIREBASE_CREDENTIALS_PATH environment variable
        String envPath = System.getenv("FIREBASE_CREDENTIALS_PATH");
        if (envPath != null && !envPath.isBlank()) {
            File f = new File(envPath.trim());
            if (f.exists() && f.isFile()) {
                try {
                    log.info("Using Firebase credentials from FIREBASE_CREDENTIALS_PATH env: {}", f.getAbsolutePath());
                    return new FileInputStream(f);
                } catch (IOException e) {
                    log.warn("Could not read credentials from FIREBASE_CREDENTIALS_PATH: {}", envPath);
                }
            }
        }

        // 3. Known project locations
        String[] localCandidates = {
            "firebase-admin.json",
            "backend/firebase-admin.json",
            "../backend/firebase-admin.json",
            "../firebase-admin.json"
        };
        for (String path : localCandidates) {
            File f = new File(path);
            if (f.exists() && f.isFile()) {
                try {
                    log.info("Found Firebase credentials at local project path: {}", f.getAbsolutePath());
                    return new FileInputStream(f);
                } catch (IOException e) {
                    log.warn("Could not read credentials at candidate path {}: {}", path, e.getMessage());
                }
            }
        }

        // 4. Developer Downloads directory discovery (local development fallback)
        try {
            String userHome = System.getProperty("user.home");
            if (userHome != null) {
                File downloadsDir = new File(userHome, "Downloads");
                if (downloadsDir.exists() && downloadsDir.isDirectory()) {
                    File[] matches = downloadsDir.listFiles((dir, name) ->
                            name.toLowerCase().contains("firebase-adminsdk") && name.toLowerCase().endsWith(".json"));
                    if (matches != null && matches.length > 0) {
                        log.info("Discovered Firebase credentials in Downloads folder: {}", matches[0].getAbsolutePath());
                        return new FileInputStream(matches[0]);
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Auto-discovery in Downloads directory skipped: {}", e.getMessage());
        }

        return null;
    }
}
