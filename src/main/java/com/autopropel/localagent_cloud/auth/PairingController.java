package com.autopropel.localagent_cloud.auth;

import com.autopropel.localagent_cloud.persistence.AgentToken;
import com.autopropel.localagent_cloud.persistence.AgentTokenRepository;
import com.autopropel.localagent_cloud.persistence.AppUser;
import com.autopropel.localagent_cloud.persistence.AppUserRepository;
import com.autopropel.localagent_cloud.persistence.DevicePairing;
import com.autopropel.localagent_cloud.persistence.DevicePairingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class PairingController {

    private final DevicePairingRepository pairingRepository;
    private final AgentTokenRepository tokenRepository;
    private final AppUserRepository userRepository;

    public PairingController(DevicePairingRepository pairingRepository, AgentTokenRepository tokenRepository, AppUserRepository userRepository) {
        this.pairingRepository = pairingRepository;
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
    }

    /**
     * Agent calls this to start pairing.
     */
    @PostMapping("/agents/pairing/start")
    public ResponseEntity<Map<String, Object>> startPairing() {
        String code = String.format("%06d", new Random().nextInt(999999));
        
        // Ensure uniqueness
        while (pairingRepository.findByPairingCode(code).isPresent()) {
            code = String.format("%06d", new Random().nextInt(999999));
        }

        DevicePairing pairing = new DevicePairing();
        pairing.setPairingCode(code);
        pairing = pairingRepository.save(pairing);

        Map<String, Object> response = new HashMap<>();
        response.put("pairingId", pairing.getId());
        response.put("code", pairing.getPairingCode());
        response.put("expiresAt", pairing.getExpiresAt());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Agent polls this to see if user has verified the code.
     */
    @GetMapping("/agents/pairing/{id}/status")
    public ResponseEntity<Map<String, Object>> checkStatus(@PathVariable Long id) {
        Optional<DevicePairing> opt = pairingRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        DevicePairing pairing = opt.get();
        Map<String, Object> response = new HashMap<>();
        
        if (LocalDateTime.now().isAfter(pairing.getExpiresAt()) && "PENDING".equals(pairing.getStatus())) {
            pairing.setStatus("EXPIRED");
            pairingRepository.save(pairing);
        }
        
        response.put("status", pairing.getStatus());
        if ("PAIRED".equals(pairing.getStatus())) {
            response.put("token", pairing.getAgentToken());
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * User (via Web Dashboard) verifies the 6 digit code.
     */
    @PostMapping("/pairing/verify")
    public ResponseEntity<Map<String, String>> verifyCode(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Code is required"));
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        Optional<AppUser> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).build();
        }
        
        Long orgId = userOpt.get().getOrgId();

        Optional<DevicePairing> pairingOpt = pairingRepository.findByPairingCode(code);
        if (pairingOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid pairing code"));
        }
        
        DevicePairing pairing = pairingOpt.get();
        
        if (!"PENDING".equals(pairing.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Code is already paired or expired"));
        }
        
        if (LocalDateTime.now().isAfter(pairing.getExpiresAt())) {
            pairing.setStatus("EXPIRED");
            pairingRepository.save(pairing);
            return ResponseEntity.badRequest().body(Map.of("error", "Code has expired"));
        }
        
        // Generate a new Agent Token for the organization
        AgentToken newToken = new AgentToken();
        newToken.setOrgId(orgId);
        newToken.setToken("agt_" + UUID.randomUUID().toString().replace("-", ""));
        newToken.setLabel("Agent paired via device code");
        tokenRepository.save(newToken);
        
        // Mark pairing as complete
        pairing.setStatus("PAIRED");
        pairing.setOrgId(orgId);
        pairing.setAgentToken(newToken.getToken());
        pairingRepository.save(pairing);
        
        return ResponseEntity.ok(Map.of("message", "Agent successfully paired"));
    }
}
