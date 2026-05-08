package com.project.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @Size(max = 100, message = "Họ và tên không được quá 100 ký tự")
    private String fullName;

    @Email(message = "Email không hợp lệ")
    private String email;

    @Size(max = 20, message = "Số điện thoại không được quá 20 ký tự")
    private String phone;

    private String role;

    private Long clinicId;

    private String avatarUrl;

    private String status; // ACTIVE, INACTIVE

    private String password;
}
