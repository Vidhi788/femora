package com.femora.backend.security;

import org.springframework.core.MethodParameter;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;

import java.lang.reflect.Method;
import java.lang.reflect.Type;
import java.util.Map;

/**
 * The same check for JSON bodies: if a request body has a userId, it must be the logged-in user's id.
 * Works with records (userId()), classes (getUserId()) and maps.
 */
@ControllerAdvice
public class UserIdBodyGuard extends RequestBodyAdviceAdapter {

    @Override
    public boolean supports(MethodParameter methodParameter, Type targetType,
                            Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }

    @Override
    public Object afterBodyRead(Object body, HttpInputMessage inputMessage, MethodParameter parameter,
                                Type targetType, Class<? extends HttpMessageConverter<?>> converterType) {
        Long me = UserIdGuard.currentUserId();
        if (me == null || body == null) {
            return body;
        }
        Object claimed = readUserId(body);
        if (claimed != null && !String.valueOf(claimed).equals(String.valueOf(me))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only use your own account.");
        }
        return body;
    }

    private static Object readUserId(Object body) {
        if (body instanceof Map<?, ?> map) {
            return map.get("userId");
        }
        for (String name : new String[]{"userId", "getUserId"}) {
            try {
                Method m = body.getClass().getMethod(name);
                m.setAccessible(true);
                return m.invoke(body);
            } catch (ReflectiveOperationException | RuntimeException ignored) {
                // try the next name
            }
        }
        return null;
    }
}