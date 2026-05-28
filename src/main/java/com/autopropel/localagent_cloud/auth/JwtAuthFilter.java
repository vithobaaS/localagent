package com.autopropel.localagent_cloud.auth;
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

import com.autopropel.localagent_cloud.persistence.AppUserRepository;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final AppUserRepository userRepository;
    
    public JwtAuthFilter(JwtUtil jwtUtil, AppUserRepository userRepository) { 
        this.jwtUtil = jwtUtil; 
        this.userRepository = userRepository;
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
            }
        }
        chain.doFilter(req, res);
    }
}
