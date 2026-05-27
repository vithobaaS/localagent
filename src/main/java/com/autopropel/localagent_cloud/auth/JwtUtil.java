package com.autopropel.localagent_cloud.auth;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {
    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(@Value("${autopropel.jwt.secret}") String secret,
                   @Value("${autopropel.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expirationMs = expirationMs;
    }

    public String generateToken(String email, Long orgId, String role) {
        return Jwts.builder()
                .subject(email)
                .claim("orgId", orgId)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key)
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    public String extractEmail(String token) { return extractClaims(token).getSubject(); }
    public Long extractOrgId(String token) { return extractClaims(token).get("orgId", Long.class); }

    public boolean isValid(String token) {
        try { extractClaims(token); return true; } catch (JwtException | IllegalArgumentException e) { return false; }
    }
}
