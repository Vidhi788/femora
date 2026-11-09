
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
import java.util.List;
import java.util.Map;

/**
 * Calls the Python FastAPI service in ml-services/general-service.
 */
@Component
public class GeneralMlClient {

    public static class MlUnavailableException extends RuntimeException {
        public MlUnavailableException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public record Condition(String name, double probability) {
    }

    /**
     * distinct = how many different model columns the symptoms mapped to.
     */
    public record Prediction(int distinct, List<String> unknown, List<Condition> top) {
    }

    private final RestClient client;

    public GeneralMlClient(@Value("${ml.general.url}") String baseUrl) {

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
     * The symptom list for the picker: [{name, label}, ...]
     */
    public List<Map<String, Object>> symptoms() {
        try {
            return client.get()
                    .uri("/symptoms")
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    });
        } catch (RestClientException e) {
            throw new MlUnavailableException(
                    "Could not reach the General service", e);
        }
    }

    public Prediction predict(List<String> symptoms) {
        try {
            Map<String, Object> body = client.post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("symptoms", symptoms))
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            int distinct = ((Number) body.get("distinct_symptoms")).intValue();

            List<String> unknown = ((List<?>) body.get("unknown"))
                    .stream()
                    .map(String::valueOf)
                    .toList();

            List<Condition> top = ((List<?>) body.get("top"))
                    .stream()
                    .map(o -> (Map<?, ?>) o)
                    .map(m -> new Condition(
                            String.valueOf(m.get("condition")),
                            ((Number) m.get("probability")).doubleValue()))
                    .toList();

            return new Prediction(distinct, unknown, top);

        } catch (RestClientException | ClassCastException | NullPointerException e) {
            throw new MlUnavailableException(
                    "Unexpected reply from the General service", e);
        }
    }
}
