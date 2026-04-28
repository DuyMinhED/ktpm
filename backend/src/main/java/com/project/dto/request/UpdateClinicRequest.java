package com.project.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateClinicRequest {

    @Size(max = 200, message = "Tên phòng khám không được quá 200 ký tự")
    private String name;

    private String address;

    @Size(max = 20, message = "Số điện thoại không được quá 20 ký tự")
    private String phone;

    private String email;

    private String description;

    private String imageUrl;

    private Long managerId;

    private String adminFullName;

    private String adminEmail;

    private String status; // ACTIVE, INACTIVE
}
