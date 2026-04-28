package com.project.service.impl;

import com.project.dto.request.UpdateSystemConfigRequest;
import com.project.dto.response.SystemConfigResponse;
import com.project.entity.SystemConfig;
import com.project.repository.SystemConfigRepository;
import com.project.service.AdminConfigService;
import com.project.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AdminConfigServiceImpl implements AdminConfigService {

    private final SystemConfigRepository systemConfigRepository;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public SystemConfigResponse getConfig() {
        SystemConfig config = systemConfigRepository.findFirstByOrderByIdAsc().orElseGet(this::seedDefaultConfig);
        return mapToConfigResponse(config);
    }

    @Override
    @Transactional
    public SystemConfigResponse updateConfig(UpdateSystemConfigRequest request) {
        SystemConfig config = systemConfigRepository.findFirstByOrderByIdAsc().orElseGet(this::seedDefaultConfig);
        config.setLanguage(request.getLanguage());
        config.setTimezone(request.getTimezone());
        config.setMaintenanceMode(request.isMaintenanceMode());
        
        if (request.getThresholds() != null) {
            config.setBpSysThreshold(request.getThresholds().getBp_sys());
            config.setBpDiaThreshold(request.getThresholds().getBp_dia());
            config.setHrThreshold(request.getThresholds().getHr());
            config.setSpo2Threshold(request.getThresholds().getSpo2());
        }

        systemConfigRepository.save(config);
        auditService.recordActivity("Cập nhật", "Hệ thống", "Cập nhật cấu hình hệ thống", "success");
        return mapToConfigResponse(config);
    }

    @Override
    @Transactional
    public String regenerateApiKey() {
        SystemConfig config = systemConfigRepository.findFirstByOrderByIdAsc().orElseGet(this::seedDefaultConfig);
        String newKey = "sk_live_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        config.setApiKey(newKey);
        systemConfigRepository.save(config);
        auditService.recordActivity("Làm mới", "Bảo mật", "Làm mới API Key", "warning");
        return newKey;
    }

    private SystemConfig seedDefaultConfig() {
        SystemConfig config = SystemConfig.builder().language("Tiếng Việt").timezone("(GMT+07) Hanoi").maintenanceMode(false)
                .bpSysThreshold("140").bpDiaThreshold("90").hrThreshold("100").spo2Threshold("94").apiKey("sk_live_default").build();
        return java.util.Objects.requireNonNull(systemConfigRepository.save(config));
    }

    private SystemConfigResponse mapToConfigResponse(SystemConfig config) {
        return SystemConfigResponse.builder().language(config.getLanguage()).timezone(config.getTimezone()).maintenanceMode(config.isMaintenanceMode())
                .thresholds(SystemConfigResponse.ThresholdsDto.builder().bp_sys(config.getBpSysThreshold()).bp_dia(config.getBpDiaThreshold()).hr(config.getHrThreshold()).spo2(config.getSpo2Threshold()).build())
                .apiKey(config.getApiKey()).build();
    }
}
