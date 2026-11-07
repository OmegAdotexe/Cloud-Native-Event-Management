package com.campusconnect.auth.service;

import com.campusconnect.auth.dto.*;
import com.campusconnect.user.model.User;
import com.campusconnect.user.model.Role;
import com.campusconnect.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final GoogleTokenVerifierService googleTokenVerifierService;

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
        String email = payload.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // New participant signup via Google Identity Services
            user = User.builder()
                    .name(payload.getName())
                    .email(email)
                    .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                    .role(Role.PARTICIPANT)
                    .authProvider("GOOGLE")
                    .status("APPROVED")
                    .department(request.getDepartment() != null ? request.getDepartment().trim() : "General")
                    .profileImageUrl(payload.getPicture())
                    .isPlatformOperator(false)
                    .build();
            user = userRepository.save(user);
        } else {
            // Secure account association
            if ("SUSPENDED".equalsIgnoreCase(user.getStatus()) || "REJECTED".equalsIgnoreCase(user.getStatus())) {
                throw new org.springframework.security.access.AccessDeniedException("Account access is restricted. Status: " + user.getStatus());
            }
            if (user.getProfileImageUrl() == null && payload.getPicture() != null) {
                user.setProfileImageUrl(payload.getPicture());
            }
            if (user.getAuthProvider() == null || "LOCAL".equals(user.getAuthProvider())) {
                user.setAuthProvider("GOOGLE");
            }
            if (request.getDepartment() != null && user.getDepartment() == null) {
                user.setDepartment(request.getDepartment().trim());
            }
            user = userRepository.save(user);
        }

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
