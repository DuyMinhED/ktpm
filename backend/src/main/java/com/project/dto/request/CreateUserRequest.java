package com.project.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateUserRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 100, message = "Họ và tên không được quá 100 ký tự")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String password;

    @Size(max = 20, message = "Số điện thoại không được quá 20 ký tự")
    private String phone;

    @NotBlank(message = "Vai trò không được để trống")
    private String role; // ADMIN, DOCTOR, CLINIC_MANAGER, PATIENT

    private Long clinicId;

    private String avatarUrl;

    private String licenseNumber;
    private String degree;
    private String bio;
    private String licenseImageUrl;
    private String specialization;
    private String experience;
}
