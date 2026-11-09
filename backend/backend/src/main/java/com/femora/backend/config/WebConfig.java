
package com.femora.backend.config;

import com.femora.backend.security.UserIdGuard;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final UserIdGuard userIdGuard;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    public WebConfig(UserIdGuard userIdGuard) {
        this.userIdGuard = userIdGuard;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {

        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins.split(","))
                .allowedMethods(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
                .allowedHeaders("*");
    }

    // One user can never use another user's ID
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(userIdGuard)
                .addPathPatterns("/api/**");
    }
}
