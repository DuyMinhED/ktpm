package com.project.dto.request;

import com.project.dto.response.SystemConfigResponse;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UpdateSystemConfigRequestTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void requiredFieldsAndNestedSettings_passValidation() {
        UpdateSystemConfigRequest request = UpdateSystemConfigRequest.builder()
                .language("vi")
                .timezone("Asia/Ho_Chi_Minh")
                .maintenanceMode(true)
                .security(SystemConfigResponse.SecuritySettingsDto.builder()
                        .specialChar(true)
                        .upperNumber(true)
                        .build())
                .thresholds(SystemConfigResponse.ThresholdsDto.builder()
                        .bp_sys("140")
                        .bp_dia("90")
                        .hr("100")
                        .spo2("94")
                        .build())
                .notifications(SystemConfigResponse.NotificationsDto.builder()
                        .vital(true)
                        .support(false)
                        .revenue(true)
                        .build())
                .build();

        assertTrue(validator.validate(request).isEmpty());
        assertEquals("vi", request.getLanguage());
        assertTrue(request.isMaintenanceMode());
    }

    @Test
    void nullRequiredFields_failValidation() {
        UpdateSystemConfigRequest request = UpdateSystemConfigRequest.builder()
                .language(null)
                .timezone(null)
                .build();

        Set<ConstraintViolation<UpdateSystemConfigRequest>> violations = validator.validate(request);

        assertTrue(hasViolationOn(violations, "language"));
        assertTrue(hasViolationOn(violations, "timezone"));
    }

    private boolean hasViolationOn(Set<? extends ConstraintViolation<?>> violations, String propertyName) {
        return violations.stream().anyMatch(v -> propertyName.equals(v.getPropertyPath().toString()));
    }
}
