package com.project.service.impl;

import com.project.dto.request.UpdateSystemConfigRequest;
import com.project.dto.response.SystemConfigResponse;
import com.project.entity.SystemConfig;
import com.project.repository.SystemConfigRepository;
import com.project.service.AuditService;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminConfigServiceImplTest {

    private final SystemConfigRepository systemConfigRepository = mock(SystemConfigRepository.class);
    private final AuditService auditService = mock(AuditService.class);
    private final AdminConfigServiceImpl service = new AdminConfigServiceImpl(systemConfigRepository, auditService);

    @Test
    void getConfig_existingConfigMapsAllExposedFields() {
        SystemConfig config = config();
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(config));

        SystemConfigResponse response = service.getConfig();

        assertEquals("English", response.getLanguage());
        assertEquals("UTC", response.getTimezone());
        assertTrue(response.isMaintenanceMode());
        assertEquals("sk_live_existing", response.getApiKey());
        assertEquals("150", response.getThresholds().getBp_sys());
        assertEquals("95", response.getThresholds().getBp_dia());
        assertEquals("110", response.getThresholds().getHr());
        assertEquals("93", response.getThresholds().getSpo2());
    }

    @Test
    void getConfig_missingConfigSeedsDefaultConfig() {
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.empty());
        when(systemConfigRepository.save(any(SystemConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SystemConfigResponse response = service.getConfig();

        assertEquals("Tiếng Việt", response.getLanguage());
        assertEquals("(GMT+07) Hanoi", response.getTimezone());
        assertFalse(response.isMaintenanceMode());
        assertEquals("140", response.getThresholds().getBp_sys());
        assertEquals("90", response.getThresholds().getBp_dia());
        assertEquals("100", response.getThresholds().getHr());
        assertEquals("94", response.getThresholds().getSpo2());
        assertEquals("sk_live_default", response.getApiKey());
        verify(systemConfigRepository).save(any(SystemConfig.class));
    }

    @Test
    void updateConfig_withThresholdsUpdatesConfigAndAudits() {
        SystemConfig config = config();
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(config));
        when(systemConfigRepository.save(config)).thenReturn(config);
        UpdateSystemConfigRequest request = UpdateSystemConfigRequest.builder()
                .language("Tiếng Việt")
                .timezone("(GMT+07) Hanoi")
                .maintenanceMode(false)
                .thresholds(SystemConfigResponse.ThresholdsDto.builder()
                        .bp_sys("135")
                        .bp_dia("85")
                        .hr("95")
                        .spo2("96")
                        .build())
                .build();

        SystemConfigResponse response = service.updateConfig(request);

        assertEquals("Tiếng Việt", response.getLanguage());
        assertEquals("(GMT+07) Hanoi", response.getTimezone());
        assertFalse(response.isMaintenanceMode());
        assertEquals("135", response.getThresholds().getBp_sys());
        assertEquals("85", response.getThresholds().getBp_dia());
        assertEquals("95", response.getThresholds().getHr());
        assertEquals("96", response.getThresholds().getSpo2());
        verify(systemConfigRepository).save(config);
        verify(auditService).recordActivity(any(), any(), any(), eq("success"));
    }

    @Test
    void updateConfig_withoutThresholdsKeepsExistingThresholds() {
        SystemConfig config = config();
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(config));
        when(systemConfigRepository.save(config)).thenReturn(config);
        UpdateSystemConfigRequest request = UpdateSystemConfigRequest.builder()
                .language("Japanese")
                .timezone("Asia/Tokyo")
                .maintenanceMode(true)
                .build();

        SystemConfigResponse response = service.updateConfig(request);

        assertEquals("Japanese", response.getLanguage());
        assertEquals("Asia/Tokyo", response.getTimezone());
        assertTrue(response.isMaintenanceMode());
        assertEquals("150", response.getThresholds().getBp_sys());
        assertEquals("95", response.getThresholds().getBp_dia());
        assertEquals("110", response.getThresholds().getHr());
        assertEquals("93", response.getThresholds().getSpo2());
    }

    @Test
    void regenerateApiKeyCreatesNewLiveKeyAndAudits() {
        SystemConfig config = config();
        when(systemConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(config));
        when(systemConfigRepository.save(config)).thenReturn(config);

        String apiKey = service.regenerateApiKey();

        assertTrue(apiKey.startsWith("sk_live_"));
        assertEquals(32, apiKey.length());
        assertNotEquals("sk_live_existing", apiKey);
        assertEquals(apiKey, config.getApiKey());
        verify(systemConfigRepository).save(config);
        verify(auditService).recordActivity(any(), any(), any(), eq("warning"));
    }

    private static SystemConfig config() {
        return SystemConfig.builder()
                .language("English")
                .timezone("UTC")
                .maintenanceMode(true)
                .bpSysThreshold("150")
                .bpDiaThreshold("95")
                .hrThreshold("110")
                .spo2Threshold("93")
                .apiKey("sk_live_existing")
                .build();
    }
}
