package com.autopilot.localagent_cloud.auth;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

import com.autopilot.localagent_cloud.repository.AppUserRepository;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final AppUserRepository userRepository;
    private final com.autopilot.localagent_cloud.repository.ApiKeyRepository apiKeyRepository;
    
    public JwtAuthFilter(JwtUtil jwtUtil, AppUserRepository userRepository, com.autopilot.localagent_cloud.repository.ApiKeyRepository apiKeyRepository) { 
        this.jwtUtil = jwtUtil; 
        this.userRepository = userRepository;
        this.apiKeyRepository = apiKeyRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtUtil.isValid(token)) {
                String email = jwtUtil.extractEmail(token);
                // Verify user actually exists in DB! (so if DB is wiped, token is invalid)
                if (userRepository.existsByEmail(email)) {
                    Long orgId  = jwtUtil.extractOrgId(token);
                    var claims  = jwtUtil.extractClaims(token);
                    String role = claims.get("role", String.class);
                    // Store orgId in request attribute for controllers to read
                    req.setAttribute("orgId", orgId);
                    var auth = new UsernamePasswordAuthenticationToken(
                            email, null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + (role != null ? role.toUpperCase() : "USER")))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } else if (token.startsWith("ap_live_")) {
                // It's an API Key
                apiKeyRepository.findByToken(token).ifPresent(key -> {
                    // Update last used at? We'll do it async or just set it
                    req.setAttribute("orgId", key.getOrgId());
                    var auth = new UsernamePasswordAuthenticationToken(
                            "api-key-" + key.getId(), null,
                            List.of(new SimpleGrantedAuthority("ROLE_API"))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            }
        }
        chain.doFilter(req, res);
    }
}
