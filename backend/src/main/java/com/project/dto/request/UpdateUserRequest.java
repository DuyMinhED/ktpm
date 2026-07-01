package com.project.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @Size(max = 100, message = "Họ và tên không được quá 100 ký tự")
    private String fullName;

    @Email(message = "Email không hợp lệ")
    @Size(max = 100, message = "Email không được quá 100 ký tự")
    private String email;

    @Size(max = 20, message = "Số điện thoại không được quá 20 ký tự")
    private String phone;

    private String role;

    private Long clinicId;

    private String avatarUrl;

    @Pattern(regexp = "^(ACTIVE|INACTIVE)$", message = "Trạng thái không hợp lệ")
    @Size(max = 30, message = "Trạng thái không được quá 30 ký tự")
    private String status; // ACTIVE, INACTIVE

    private String password;

    private String licenseNumber;
    private String degree;
    private String bio;
    private String licenseImageUrl;
    private String specialization;
    private String experience;
}
