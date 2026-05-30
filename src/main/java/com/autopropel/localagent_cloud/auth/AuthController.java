package com.autopropel.localagent_cloud.auth;
import com.autopropel.localagent_cloud.model.*;
import com.autopropel.localagent_cloud.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final AppUserRepository userRepository;
    private final OrganisationRepository orgRepository;
    private final AgentTokenRepository agentTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(AppUserRepository userRepository,
                          OrganisationRepository orgRepository,
                          AgentTokenRepository agentTokenRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.orgRepository = orgRepository;
        this.agentTokenRepository = agentTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /** POST /api/auth/register — creates an org + user, returns JWT */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> body) {
        String email    = body.get("email");
        String password = body.get("password");
        String fullName = body.getOrDefault("fullName", "");
        String orgName  = body.getOrDefault("orgName", fullName + "'s Organisation");

        if (email == null || password == null || email.isBlank() || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already registered"));
        }

        // Create organisation
        Organisation org = new Organisation();
        org.setName(orgName);
        org.setPlan("trial");
        org = orgRepository.save(org);

        // Create user
        AppUser user = new AppUser();
        user.setOrgId(org.getId());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setRole("admin");
        user = userRepository.save(user);

        // Auto-generate first agent token
        AgentToken token = new AgentToken();
        token.setOrgId(org.getId());
        token.setToken("agt_" + UUID.randomUUID().toString().replace("-", ""));
        token.setLabel("Default Agent");
        agentTokenRepository.save(token);

        String jwt = jwtUtil.generateToken(user.getEmail(), org.getId(), user.getRole());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "token", jwt,
                "email", user.getEmail(),
                "fullName", user.getFullName() != null ? user.getFullName() : "",
                "orgId", org.getId(),
                "orgName", org.getName(),
                "plan", org.getPlan(),
                "agentToken", token.getToken()
        ));
    }

    /** POST /api/auth/login — verify credentials, return JWT */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String email    = body.get("email");
        String password = body.get("password");
        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password required"));
        }
        AppUser user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "No such user. Please create an account."));
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
        }
        Organisation org = orgRepository.findById(user.getOrgId()).orElseThrow();
        String agentToken = agentTokenRepository.findByOrgId(org.getId())
                .stream().findFirst().map(AgentToken::getToken).orElse("");

        String jwt = jwtUtil.generateToken(user.getEmail(), org.getId(), user.getRole());
        return ResponseEntity.ok(Map.of(
                "token", jwt,
                "email", user.getEmail(),
                "fullName", user.getFullName() != null ? user.getFullName() : "",
                "orgId", org.getId(),
                "orgName", org.getName(),
                "plan", org.getPlan(),
                "agentToken", agentToken
        ));
    }

    /** GET /api/auth/me — get current user info from JWT */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(jakarta.servlet.http.HttpServletRequest req) {
        Long orgId = (Long) req.getAttribute("orgId");
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Organisation org = orgRepository.findById(orgId).orElse(null);
        if (org == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        String agentToken = agentTokenRepository.findByOrgId(orgId)
                .stream().findFirst().map(AgentToken::getToken).orElse("");
        return ResponseEntity.ok(Map.of(
                "orgId", orgId,
                "orgName", org.getName(),
                "plan", org.getPlan(),
                "agentToken", agentToken
        ));
    }

    /** POST /api/auth/agent-tokens — generate a new agent token for the org */
    @PostMapping("/agent-tokens")
    public ResponseEntity<Map<String, Object>> createAgentToken(
            @RequestBody(required = false) Map<String, String> body,
            jakarta.servlet.http.HttpServletRequest req) {
        Long orgId = (Long) req.getAttribute("orgId");
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        AgentToken token = new AgentToken();
        token.setOrgId(orgId);
        token.setToken("agt_" + UUID.randomUUID().toString().replace("-", ""));
        token.setLabel(body != null ? body.getOrDefault("label", "Agent") : "Agent");
        agentTokenRepository.save(token);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "token", token.getToken(),
                "label", token.getLabel(),
                "id", token.getId()
        ));
    }
}
