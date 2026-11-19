package com.campusconnect.common.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.credentials-path:}")
    private String credentialsPath;

    @Value("${firebase.project-id:}")
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

            if (credentialsPath != null && !credentialsPath.isBlank()) {
                try (InputStream serviceAccount = new FileInputStream(credentialsPath.trim())) {
                    credentials = GoogleCredentials.fromStream(serviceAccount);
                    log.info("Initialized Firebase using credentials file from configured path: {}", credentialsPath);
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
}
