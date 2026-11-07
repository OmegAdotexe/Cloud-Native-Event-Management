package com.campusconnect.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminApplicationRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    private String email;

    private String password;

    @NotBlank(message = "Department or organization name is required")
    private String department;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    private String organizationRole;

    private String statement;
}
