package com.campusconnect.auth.service;

import com.campusconnect.auth.dto.*;
import com.campusconnect.auth.model.PasswordResetToken;
import com.campusconnect.auth.repository.PasswordResetTokenRepository;
import com.campusconnect.notification.email.EmailProvider;
import com.campusconnect.user.model.User;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailProvider emailProvider;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.PARTICIPANT)
                .department(request.getDepartment() != null ? request.getDepartment().trim() : null)
                .authProvider("LOCAL")
                .status("APPROVED")
                .isPlatformOperator(false)
                .build();

        user = userRepository.save(user);
        String jwtToken = jwtService.generateToken(user);
        
        return AuthResponse.builder()
                .token(jwtToken)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .department(user.getDepartment())
                .authProvider(user.getAuthProvider())
                .status(user.getStatus())
                .profileImageUrl(user.getProfileImageUrl())
                .isPlatformOperator(user.getIsPlatformOperator())
                .build();
    }

    @Transactional
    public AuthResponse authenticateWithGoogle(com.campusconnect.auth.dto.GoogleAuthRequest request) {
        GoogleTokenVerifierService.GoogleUserPayload payload = googleTokenVerifierService.verifyToken(request.getIdToken());
        
        if (!payload.isEmailVerified()) {
            throw new org.springframework.security.authentication.BadCredentialsException("Google account email is not verified by Google. Authentication rejected.");
        }

        String verifiedEmail = payload.getEmail().toLowerCase().trim();
        String googleSub = payload.getSub();

        if (googleSub == null || googleSub.isBlank()) {
            throw new org.springframework.security.authentication.BadCredentialsException("Google token missing verified subject identifier.");
        }

        // 1. Primary lookup by stable external identifier (google_sub)
        User user = userRepository.findByGoogleSub(googleSub).orElse(null);

        if (user == null) {
            // 2. Secondary lookup by cryptographically verified email
            user = userRepository.findByEmail(verifiedEmail).orElse(null);

            if (user != null) {
                // SECURITY AUDIT: Prevent account takeover of administrative accounts
                if (user.getRole() == Role.EVENT_ADMIN || user.getRole() == Role.SUPER_ADMIN || Boolean.TRUE.equals(user.getIsPlatformOperator())) {
                    log.warn("Blocked attempt to link administrative account {} via Google Sign-In", verifiedEmail);
                    throw new org.springframework.security.access.AccessDeniedException(
                            "Administrative and Organizer accounts cannot be accessed or linked via Google Sign-In. Please sign in using your designated administrative credentials."
                    );
                }

                // Prevent duplicate identity associations: account already linked to a different Google sub
                if (user.getGoogleSub() != null && !user.getGoogleSub().equals(googleSub)) {
                    log.error("Identity conflict: Account {} already linked to google_sub {}, cannot link to {}", verifiedEmail, user.getGoogleSub(), googleSub);
                    throw new org.springframework.security.authentication.BadCredentialsException("Account identity conflict: This account is already associated with a different Google account.");
                }

                // Safely link regular participant account
                log.info("Linking participant account {} to Google sub {}", verifiedEmail, googleSub);
                user.setGoogleSub(googleSub);
                user.setAuthProvider("GOOGLE");
                if (request.getDepartment() != null && (user.getDepartment() == null || user.getDepartment().isBlank())) {
                    user.setDepartment(request.getDepartment().trim());
                }
            } else {
                // 3. New participant self-registration via Google
                user = User.builder()
                        .name(payload.getName() != null && !payload.getName().isBlank() ? payload.getName() : verifiedEmail.split("@")[0])
                        .email(verifiedEmail)
                        .googleSub(googleSub)
                        .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                        .role(Role.PARTICIPANT) // ALWAYS PARTICIPANT, NO ELEVATION
                        .authProvider("GOOGLE")
                        .status("APPROVED")
                        .department(request.getDepartment() != null && !request.getDepartment().isBlank() ? request.getDepartment().trim() : "General")
                        .profileImageUrl(payload.getPicture())
                        .isPlatformOperator(false)
                        .build();
            }
        }

        // Check account status
        if ("SUSPENDED".equalsIgnoreCase(user.getStatus()) || "REJECTED".equalsIgnoreCase(user.getStatus())) {
            throw new org.springframework.security.access.AccessDeniedException("Account access is restricted. Status: " + user.getStatus());
        }

        if (user.getProfileImageUrl() == null && payload.getPicture() != null) {
            user.setProfileImageUrl(payload.getPicture());
        }

        user = userRepository.save(user);

        String jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .department(user.getDepartment())
                .authProvider(user.getAuthProvider())
                .status(user.getStatus())
                .profileImageUrl(user.getProfileImageUrl())
                .isPlatformOperator(user.getIsPlatformOperator())
                .build();
    }

    public AuthResponse authenticate(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
                
        String jwtToken = jwtService.generateToken(user);
        
        return AuthResponse.builder()
                .token(jwtToken)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .department(user.getDepartment())
                .authProvider(user.getAuthProvider() != null ? user.getAuthProvider() : "LOCAL")
                .status(user.getStatus() != null ? user.getStatus() : "APPROVED")
                .profileImageUrl(user.getProfileImageUrl())
                .isPlatformOperator(user.getIsPlatformOperator() != null && user.getIsPlatformOperator())
                .build();
    }

    @Transactional
    public UserDto updateProfile(User user, UpdateProfileRequest request) {
        User existing = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            existing.setName(request.getName().trim());
        }
        if (request.getDepartment() != null) {
            existing.setDepartment(request.getDepartment().trim());
        }
        if (request.getProfileImageUrl() != null) {
            existing.setProfileImageUrl(request.getProfileImageUrl().trim());
        }
        User saved = userRepository.save(existing);
        return toDto(saved);
    }

    @Transactional
    public void changePassword(User user, ChangePasswordRequest request) {
        User existing = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        if ("GOOGLE".equalsIgnoreCase(existing.getAuthProvider())) {
            throw new IllegalStateException("Google-authenticated accounts do not use a local password.");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), existing.getPassword())) {
            throw new IllegalArgumentException("Incorrect current password.");
        }

        existing.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(existing);
    }

    @Transactional
    public String requestPasswordReset(ForgotPasswordRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return null;
        }

        String normalizedEmail = request.getEmail().toLowerCase().trim();
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);

        if (userOpt.isEmpty()) {
            // SECURITY: Do not leak whether the email is registered
            log.info("Password reset requested for non-existent email: {}", normalizedEmail);
            return null;
        }

        User user = userOpt.get();

        if ("GOOGLE".equalsIgnoreCase(user.getAuthProvider())) {
            log.info("Password reset requested for Google-authenticated user: {}. Suppressing local password reset.", normalizedEmail);
            return null;
        }

        String baseUrl = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.replaceAll("/+$", "") : "http://localhost:5173";

        // Rate limiting check: if requested within last 15 seconds, reuse existing active token
        Optional<PasswordResetToken> lastTokenOpt = passwordResetTokenRepository.findTopByUserOrderByCreatedAtDesc(user);
        if (lastTokenOpt.isPresent()) {
            LocalDateTime recentThreshold = LocalDateTime.now().minusSeconds(15);
            PasswordResetToken existing = lastTokenOpt.get();
            if (existing.getCreatedAt() != null && existing.getCreatedAt().isAfter(recentThreshold) && !existing.isUsed() && !existing.isExpired()) {
                log.info("Reusing recent password reset token for user: {}", normalizedEmail);
                return baseUrl + "/reset-password?token=" + existing.getToken();
            }
        }

        // Invalidate previous active tokens for this user
        passwordResetTokenRepository.invalidateAllActiveTokensForUser(user);

        // Generate a secure random token
        String token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        int expirationMinutes = 15;
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(expirationMinutes);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .expiresAt(expiresAt)
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);

        String resetUrl = baseUrl + "/reset-password?token=" + token;

        log.info("Generated password reset token for user: {}. Reset link: {}", normalizedEmail, resetUrl);
        emailProvider.sendPasswordResetEmail(user.getEmail(), resetUrl, expirationMinutes);

        return resetUrl;
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (request.getNewPassword() == null || request.getConfirmPassword() == null) {
            throw new IllegalArgumentException("Both new password and confirm password are required.");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match.");
        }

        if (request.getNewPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or unrecognized password reset token."));

        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("This password reset link has already been used. Please request a new one.");
        }

        if (resetToken.isExpired()) {
            throw new IllegalArgumentException("This password reset link has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // Invalidate any other active tokens
        passwordResetTokenRepository.invalidateAllActiveTokensForUser(user);

        log.info("Password successfully reset for user: {}", user.getEmail());
    }

    public UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .department(user.getDepartment())
                .authProvider(user.getAuthProvider() != null ? user.getAuthProvider() : "LOCAL")
                .status(user.getStatus() != null ? user.getStatus() : "APPROVED")
                .profileImageUrl(user.getProfileImageUrl())
                .isPlatformOperator(user.getIsPlatformOperator() != null && user.getIsPlatformOperator())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
