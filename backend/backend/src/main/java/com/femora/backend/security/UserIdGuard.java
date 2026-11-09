package com.femora.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;

/**
 * Stops one logged-in user from reading or changing another user's data.
 * Your endpoints take ?userId=... . This checks it matches the id inside the signed token,
 * so no controller needs to change. (The body version is in UserIdBodyGuard.)
 */
@Component
public class UserIdGuard implements HandlerInterceptor {

    /** The id of the logged-in user, or null if the request has no valid token. */
    public static Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken token) {
            try {
                return Long.valueOf(token.getToken().getSubject());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String claimed = request.getParameter("userId");
        Long me = currentUserId();

        if (claimed != null && me != null && !claimed.equals(String.valueOf(me))) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write("{\"message\":\"You can only use your own account.\"}");
            return false;
        }
        return true;
    }
}