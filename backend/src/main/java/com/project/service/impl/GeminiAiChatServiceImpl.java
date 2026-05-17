package com.project.service.impl;

import com.project.dto.request.AiChatRequest;
import com.project.dto.response.AiChatResponse;
import com.project.service.AiChatService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GeminiAiChatServiceImpl implements AiChatService {

    private final WebClient webClient;

    @Value("${ai.gemini.api-key:}")
    private String apiKey;

    @Value("${ai.gemini.model:gemini-2.0-flash}")
    private String model;

    private static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";

    private static final String SYSTEM_PROMPT = """
            Bạn là DamDiep AI — trợ lý sức khỏe thông minh của hệ thống Quản lý Bệnh mãn tính DamDiep Healthcare.

            NGUYÊN TẮC BẮT BUỘC:
            1. Bạn KHÔNG PHẢI bác sĩ. KHÔNG BAO GIỜ chẩn đoán bệnh hoặc kê đơn thuốc.
            2. Luôn khuyên bệnh nhân tham khảo ý kiến bác sĩ chuyên khoa cho các vấn đề nghiêm trọng.
            3. Chỉ tư vấn chung về: chế độ ăn uống, lối sống lành mạnh, kiến thức y khoa phổ thông, giải thích thuật ngữ y tế, hướng dẫn theo dõi chỉ số sức khỏe.
            4. Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu, thân thiện.
            5. Nếu người dùng hỏi ngoài phạm vi y tế, hãy lịch sự từ chối và hướng dẫn họ đặt câu hỏi về sức khỏe.
            6. Sử dụng emoji phù hợp để tăng tính thân thiện (🩺💊🏥❤️).
            7. Khi đề cập đến các bệnh mãn tính (tiểu đường, huyết áp cao, tim mạch, ...), hãy nhấn mạnh tầm quan trọng của việc theo dõi thường xuyên.
            8. Tối đa 200 từ cho mỗi câu trả lời.
            """;

    public GeminiAiChatServiceImpl() {
        this.webClient = WebClient.builder()
                .baseUrl(GEMINI_BASE_URL)
                .build();
    }

    @Override
    public AiChatResponse chat(AiChatRequest request) {
        if (apiKey == null || apiKey.isBlank()) {
            return AiChatResponse.fail("AI chưa được cấu hình. Vui lòng liên hệ quản trị viên.");
        }

        try {
            // Build conversation contents
            List<Map<String, Object>> contents = new ArrayList<>();

            // Add system instruction as first user turn
            contents.add(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", SYSTEM_PROMPT))
            ));
            contents.add(Map.of(
                    "role", "model",
                    "parts", List.of(Map.of("text", "Xin chào! Tôi là DamDiep AI 🩺, trợ lý sức khỏe của bạn. Tôi sẵn sàng hỗ trợ bạn!"))
            ));

            // Add conversation history
            if (request.getHistory() != null) {
                for (AiChatRequest.ChatMessage msg : request.getHistory()) {
                    String role = "user".equals(msg.getRole()) ? "user" : "model";
                    contents.add(Map.of(
                            "role", role,
                            "parts", List.of(Map.of("text", msg.getContent()))
                    ));
                }
            }

            // Add current user message
            contents.add(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", request.getMessage()))
            ));

            // Build request body
            Map<String, Object> requestBody = Map.of(
                    "contents", contents,
                    "generationConfig", Map.of(
                            "temperature", 0.7,
                            "maxOutputTokens", 500,
                            "topP", 0.9
                    )
            );

            String url = "/v1beta/models/" + model + ":generateContent?key=" + apiKey;

            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                return AiChatResponse.fail("Không nhận được phản hồi từ AI.");
            }

            // Extract reply from Gemini response
            String reply = extractReply(response);
            return AiChatResponse.ok(reply);

        } catch (Exception e) {
            log.error("AI Chat error: {}", e.getMessage(), e);
            return AiChatResponse.fail("Lỗi khi kết nối AI: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private String extractReply(Map<String, Object> response) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                return "Xin lỗi, tôi không thể trả lời câu hỏi này.";
            }

            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");

            if (parts == null || parts.isEmpty()) {
                return "Xin lỗi, tôi không thể tạo phản hồi.";
            }

            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", e.getMessage());
            return "Xin lỗi, đã có lỗi khi xử lý phản hồi AI.";
        }
    }
}
