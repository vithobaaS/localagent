package com.autopropel.localagent_cloud.auth;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private final JwtAuthFilter jwtAuthFilter;
    public SecurityConfig(JwtAuthFilter jwtAuthFilter) { this.jwtAuthFilter = jwtAuthFilter; }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                // Agent polling uses token-based auth (not JWT), so permit it
                .requestMatchers("/api/agents/*/jobs/next").permitAll()
                .requestMatchers("/api/agents/register").permitAll()
                .requestMatchers("/api/agents/*/heartbeat").permitAll()
                .requestMatchers("/api/executions/*/results").permitAll()
                // Legacy agent endpoints
                .requestMatchers("/agents/**").permitAll()
                .requestMatchers("/executions/**").permitAll()
                // Static frontend and assets
                .requestMatchers("/autopropel/**", "/", "/index.html").permitAll()
                .requestMatchers("/assets/**", "/*.js", "/*.css", "/*.json", "/*.png", "/*.svg", "/*.ico").permitAll()
                .requestMatchers("/*.ps1", "/*.sh", "/agent/**").permitAll()
                // Everything else requires JWT
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
