package com.project.service;

import com.project.dto.request.UpdateSystemConfigRequest;
import com.project.dto.response.SystemConfigResponse;

public interface AdminConfigService {
    SystemConfigResponse getConfig();
    SystemConfigResponse updateConfig(UpdateSystemConfigRequest request);
    String regenerateApiKey();
}
