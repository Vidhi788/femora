package com.femora.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/** Creates the token the login endpoint returns. The token's subject is the user's id. */
@Service
public class JwtService {

    private final JwtEncoder encoder;
    private final long hours;

    public JwtService(JwtEncoder encoder, @Value("${femora.jwt.hours:12}") long hours) {
        this.encoder = encoder;
        this.hours = hours;
    }

    public String issue(Long userId) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("femora")
                .subject(String.valueOf(userId))
                .issuedAt(now)
                .expiresAt(now.plus(hours, ChronoUnit.HOURS))
                .build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
    }
}