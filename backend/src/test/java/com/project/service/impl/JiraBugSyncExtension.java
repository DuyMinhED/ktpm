package com.project.service.impl;

import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestWatcher;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class JiraBugSyncExtension implements TestWatcher {

    private static final HttpClient httpClient = HttpClient.newHttpClient();

    @Override
    public void testFailed(ExtensionContext context, Throwable cause) {
        String testClassName = context.getRequiredTestClass().getSimpleName();
        String testMethodName = context.getRequiredTestMethod().getName();
        String errorMessage = cause.getMessage() != null ? cause.getMessage() : cause.toString();

        System.out.println(">>> JUnit BVA Failure Detected in " + testClassName + "." + testMethodName + "!");
        System.out.println(">>> Failure Reason: " + errorMessage);
        System.out.println(">>> Syncing bug ticket to Jira...");

        String jiraBaseUrl = System.getenv("JIRA_BASE_URL");
        String jiraEmail = System.getenv("JIRA_USER_EMAIL");
        String jiraToken = System.getenv("JIRA_API_TOKEN");
        String projectKey = "KCPM"; // Project key for Jira

        if (jiraBaseUrl == null || jiraEmail == null || jiraToken == null) {
            System.out.println(">>> [WARN] Jira credentials not set in environment (JIRA_BASE_URL, JIRA_USER_EMAIL, JIRA_API_TOKEN). Skipping Jira sync.");
            return;
        }

        try {
            String baseUrl = jiraBaseUrl.replaceAll("/$", "");
            String auth = Base64.getEncoder().encodeToString((jiraEmail + ":" + jiraToken).getBytes(StandardCharsets.UTF_8));

            String summary = "[BVA-FAIL] Threshold Mismatch: " + testMethodName + " (" + testClassName + ")";
            String description = "Java BVA test failed because the codebase does not match the SRS requirements.\n\n"
                    + "* Test Class: " + context.getRequiredTestClass().getName() + "\n"
                    + "* Test Method: " + testMethodName + "\n"
                    + "* Error Details: " + errorMessage;

            // Prepare Atlassian Document Format (ADF) description for Jira v3 REST API
            String payload = "{\n" +
                    "  \"fields\": {\n" +
                    "    \"project\": {\n" +
                    "      \"key\": \"" + projectKey + "\"\n" +
                    "    },\n" +
                    "    \"summary\": \"" + summary.replace("\"", "\\\"") + "\",\n" +
                    "    \"issuetype\": {\n" +
                    "      \"name\": \"Bug\"\n" +
                    "    },\n" +
                    "    \"priority\": {\n" +
                    "      \"name\": \"High\"\n" +
                    "    },\n" +
                    "    \"labels\": [\"bva-fail\", \"bug\", \"auto-created\"],\n" +
                    "    \"description\": {\n" +
                    "      \"type\": \"doc\",\n" +
                    "      \"version\": 1,\n" +
                    "      \"content\": [\n" +
                    "        {\n" +
                    "          \"type\": \"paragraph\",\n" +
                    "          \"content\": [\n" +
                    "            {\n" +
                    "              \"type\": \"text\",\n" +
                    "              \"text\": \"" + description.replace("\n", "\\n").replace("\"", "\\\"") + "\"\n" +
                    "            }\n" +
                    "          ]\n" +
                    "        }\n" +
                    "      ]\n" +
                    "    }\n" +
                    "  }\n" +
                    "}";

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/rest/api/3/issue"))
                    .header("Authorization", "Basic " + auth)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 201) {
                System.out.println(">>> [SUCCESS] Jira bug ticket created successfully: " + response.body());
            } else {
                System.err.println(">>> [ERROR] Failed to create Jira ticket. HTTP status: " + response.statusCode() + ", response: " + response.body());
            }
        } catch (Exception e) {
            System.err.println(">>> [ERROR] Unexpected exception when calling Jira API: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
