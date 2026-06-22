package com.autopilot.localagent_cloud.auth;
import com.autopilot.localagent_cloud.model.*;
import com.autopilot.localagent_cloud.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
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

    /** POST /api/auth/register â€” creates an org + user, returns JWT */
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
        
        // Generate subdomain
        String baseSlug = orgName.toLowerCase().replaceAll("[^a-z0-9]+", "-");
        if (baseSlug.startsWith("-")) baseSlug = baseSlug.substring(1);
        if (baseSlug.endsWith("-")) baseSlug = baseSlug.substring(0, baseSlug.length() - 1);
        if (baseSlug.isBlank()) baseSlug = "org";
        
        String slug = baseSlug;
        int counter = 1;
        while (orgRepository.findBySubdomain(slug) != null) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        org.setSubdomain(slug);
        
        // Generate unique public ID like VIT-49281
        String namePrefix = orgName.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        namePrefix = namePrefix.length() >= 3 ? namePrefix.substring(0, 3) : namePrefix;
        String publicId;
        do {
            publicId = namePrefix + "-" + String.format("%05d", (int)(Math.random() * 99999));
        } while (orgRepository.findByPublicId(publicId) != null);
        org.setPublicId(publicId);
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
        Map<String, Object> registerResp = new HashMap<>();
        registerResp.put("token", jwt);
        registerResp.put("email", user.getEmail());
        registerResp.put("fullName", user.getFullName() != null ? user.getFullName() : "");
        registerResp.put("orgId", org.getId());
        registerResp.put("orgPublicId", org.getPublicId() != null ? org.getPublicId() : "");
        registerResp.put("orgName", org.getName());
        registerResp.put("subdomain", org.getSubdomain());
        registerResp.put("plan", org.getPlan());
        registerResp.put("role", user.getRole());
        registerResp.put("agentToken", token.getToken());
        registerResp.put("requiresPasswordChange", user.isRequiresPasswordChange());
        return ResponseEntity.status(HttpStatus.CREATED).body(registerResp);
    }

    /** POST /api/auth/login â€” verify credentials, return JWT */
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
        Map<String, Object> loginResp = new HashMap<>();
        loginResp.put("token", jwt);
        loginResp.put("email", user.getEmail());
        loginResp.put("fullName", user.getFullName() != null ? user.getFullName() : "");
        loginResp.put("orgId", org.getId());
        loginResp.put("orgPublicId", org.getPublicId() != null ? org.getPublicId() : "");
        loginResp.put("orgName", org.getName());
        loginResp.put("subdomain", org.getSubdomain());
        loginResp.put("plan", org.getPlan());
        loginResp.put("role", user.getRole());
        loginResp.put("agentToken", agentToken);
        loginResp.put("requiresPasswordChange", user.isRequiresPasswordChange());
        return ResponseEntity.ok(loginResp);
    }

    /** GET /api/auth/me â€” get current user info from JWT */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(jakarta.servlet.http.HttpServletRequest req) {
        Long orgId = (Long) req.getAttribute("orgId");
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Organisation org = orgRepository.findById(orgId).orElse(null);
        if (org == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        String agentToken = agentTokenRepository.findByOrgId(orgId)
                .stream().findFirst().map(AgentToken::getToken).orElse("");
        AppUser currentUser = userRepository.findByEmail((String) req.getAttribute("email")).orElse(null);
        return ResponseEntity.ok(Map.of(
                "orgId", orgId,
                "orgPublicId", org.getPublicId() != null ? org.getPublicId() : "",
                "orgName", org.getName(),
                "subdomain", org.getSubdomain(),
                "plan", org.getPlan(),
                "role", currentUser != null ? currentUser.getRole() : "user",
                "agentToken", agentToken,
                "requiresPasswordChange", currentUser != null && currentUser.isRequiresPasswordChange()
        ));
    }

    /** POST /api/auth/agent-tokens â€” generate a new agent token for the org */
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
    /** GET /api/auth/users â€” list all users in the organization */
    @GetMapping("/users")
    public ResponseEntity<java.util.List<AppUser>> getOrgUsers(jakarta.servlet.http.HttpServletRequest req) {
        Long orgId = (Long) req.getAttribute("orgId");
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(userRepository.findByOrgId(orgId));
    }

    /** POST /api/auth/users/invite â€” invite/create a user in the org */
    @PostMapping("/users/invite")
    public ResponseEntity<Map<String, Object>> inviteUser(
            @RequestBody Map<String, String> body,
            jakarta.servlet.http.HttpServletRequest req) {
        Long orgId = (Long) req.getAttribute("orgId");
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        
        // Only admins can invite users
        String callerEmail = (String) req.getAttribute("email");
        AppUser caller = callerEmail != null ? userRepository.findByEmail(callerEmail).orElse(null) : null;
        if (caller == null || !"admin".equals(caller.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only administrators can invite users"));
        }
        
        String email = body.get("email");
        String role = body.getOrDefault("role", "user");
        String fullName = body.getOrDefault("fullName", "");
        
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already registered"));
        }
        
        AppUser user = new AppUser();
        user.setOrgId(orgId);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setRole(role);
        
        // SECURITY FIX: Generate a stronger temporary password (16-char alphanumeric)
        // Industry standard: NEVER return plaintext passwords in API responses.
        // The password must be shared out-of-band (e.g., email, secure channel).
        // We return it ONCE here as it cannot be recovered later — the admin must copy it immediately.
        String randomPassword = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        user.setPasswordHash(passwordEncoder.encode(randomPassword));
        user.setRequiresPasswordChange(true);
        user = userRepository.save(user);

        // NOTE: In production with email configured, send this to the user's email instead.
        // The field is named 'initialPassword' not 'temporaryPassword' to make it clear this
        // is a one-time display — it will not appear again after this response.
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", user.getId(),
            "email", user.getEmail(),
            "role", user.getRole(),
            "fullName", user.getFullName() != null ? user.getFullName() : "",
            "initialPassword", randomPassword,
            "notice", "Share this password with the user via a secure channel. It will not be shown again."
        ));
    }

    /** GET /api/auth/agent-tokens â€” list all agent tokens in the org */
    @GetMapping("/agent-tokens")
    public ResponseEntity<java.util.List<AgentToken>> getOrgAgentTokens(jakarta.servlet.http.HttpServletRequest req) {
        Long orgId = (Long) req.getAttribute("orgId");
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(agentTokenRepository.findByOrgId(orgId));
    }

    @DeleteMapping("/agent-tokens/{id}")
    public ResponseEntity<Void> deleteAgentToken(
            @PathVariable Long id,
            jakarta.servlet.http.HttpServletRequest req) {
        Long orgId = (Long) req.getAttribute("orgId");
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        
        return agentTokenRepository.findById(id).map(token -> {
            if (token.getOrgId().equals(orgId)) {
                agentTokenRepository.delete(token);
                return ResponseEntity.ok().<Void>build();
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).<Void>build();
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @RequestBody Map<String, String> body,
            jakarta.servlet.http.HttpServletRequest req) {
        String email = (String) req.getAttribute("email");
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 8 characters"));
        }
        
        AppUser user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setRequiresPasswordChange(false);
        userRepository.save(user);
        
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
}
