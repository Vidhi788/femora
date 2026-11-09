
package com.femora.backend.symptom;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;

/**
 * Calls the Python FastAPI service (ml-services/pcos-service).
 * Its only job: send answers, get back a score between 0.0 and 1.0.
 */
@Component
public class PcosMlClient {

    /**
     * The ML service is down, too slow, or replied with something unexpected.
     */
    public static class MlUnavailableException extends RuntimeException {
        public MlUnavailableException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    private final RestClient client;

    public PcosMlClient(@Value("${ml.pcos.url}") String baseUrl) {

        // HTTP/1.1 explicitly
        HttpClient http = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        JdkClientHttpRequestFactory factory =
                new JdkClientHttpRequestFactory(http);

        // Wait up to 70 seconds for ML response
        factory.setReadTimeout(Duration.ofSeconds(70));

        this.client = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    /**
     * Returns the model's PCOS score (0.0 to 1.0).
     */
    public double predict(Map<String, Object> answers) {
        try {
            Map<String, Object> body = client.post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(answers)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Object score = (body == null) ? null : body.get("pcos_probability");

            if (!(score instanceof Number)) {
                throw new MlUnavailableException(
                        "Unexpected reply from the PCOS service", null);
            }

            return ((Number) score).doubleValue();

        } catch (RestClientException e) {
            throw new MlUnavailableException(
                    "Could not reach the PCOS service", e);
        }
    }
}
