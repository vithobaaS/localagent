package com.autopilot.localagent_cloud.controller;

import com.autopilot.localagent_cloud.model.ApiKey;
import com.autopilot.localagent_cloud.model.AuditLog;
import com.autopilot.localagent_cloud.repository.ApiKeyRepository;
import com.autopilot.localagent_cloud.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/apikeys")
public class ApiKeyController {

    private final ApiKeyRepository apiKeyRepository;
    private final AuditLogRepository auditLogRepository;

    public ApiKeyController(ApiKeyRepository apiKeyRepository, AuditLogRepository auditLogRepository) {
        this.apiKeyRepository = apiKeyRepository;
        this.auditLogRepository = auditLogRepository;
    }

    private String getUserEmail(HttpServletRequest req) {
        Object e = req.getAttribute("email");
        return e != null ? e.toString() : "API_KEY";
    }

    private Long orgId(HttpServletRequest req) {
        Object o = req.getAttribute("orgId");
        return o != null ? ((Number) o).longValue() : null;
    }

    @GetMapping
    public ResponseEntity<List<ApiKey>> getKeys(HttpServletRequest req) {
        Long orgId = orgId(req);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(apiKeyRepository.findByOrgId(orgId));
    }

    @PostMapping
    public ResponseEntity<?> createKey(@RequestBody Map<String, String> body, HttpServletRequest req) {
        Long orgId = orgId(req);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Key name cannot be blank."));
        }

        ApiKey key = new ApiKey();
        key.setOrgId(orgId);
        key.setName(name);
        key.setToken("ap_live_" + UUID.randomUUID().toString().replace("-", ""));

        ApiKey saved = apiKeyRepository.save(key);
        auditLogRepository.save(new AuditLog(orgId, getUserEmail(req), "CREATE", "API_KEY", saved.getId().toString(), "Generated API Key: " + saved.getName()));
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteKey(@PathVariable Long id, HttpServletRequest req) {
        Long orgId = orgId(req);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return apiKeyRepository.findById(id).map(key -> {
            if (!key.getOrgId().equals(orgId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).<Void>build();
            }
            apiKeyRepository.delete(key);
            auditLogRepository.save(new AuditLog(orgId, getUserEmail(req), "DELETE", "API_KEY", key.getId().toString(), "Revoked API Key: " + key.getName()));
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Called internally (e.g., by future API middleware) to record when an API key was last used.
     * Fix: api_keys.last_used_at was never being updated anywhere.
     */
    public void recordKeyUsage(String token) {
        apiKeyRepository.findByToken(token).ifPresent(key -> {
            key.setLastUsedAt(LocalDateTime.now());
            apiKeyRepository.save(key);
        });
    }
}
