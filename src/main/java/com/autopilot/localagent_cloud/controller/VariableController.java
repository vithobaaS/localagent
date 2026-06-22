package com.autopilot.localagent_cloud.controller;

import com.autopilot.localagent_cloud.model.Variable;
import com.autopilot.localagent_cloud.repository.VariableRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/variables")
public class VariableController {

    // Industry-standard sentinel — used to detect "user did not change the secret value"
    private static final String SECRET_MASK = "••••••••";

    private final VariableRepository variableRepository;

    public VariableController(VariableRepository variableRepository) {
        this.variableRepository = variableRepository;
    }

    private Long getOrgId(HttpServletRequest request) {
        // Use the orgId already extracted and validated by JwtAuthFilter
        Object o = request.getAttribute("orgId");
        return o != null ? ((Number) o).longValue() : null;
    }

    @GetMapping
    public ResponseEntity<List<Variable>> getAll(
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) Long scopeId,
            HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<Variable> vars;
        if (scope != null && scopeId != null) {
            vars = variableRepository.findByOrgIdAndScopeAndScopeId(orgId, scope.toUpperCase(), scopeId);
        } else if (scope != null) {
            vars = variableRepository.findByOrgIdAndScope(orgId, scope.toUpperCase());
        } else {
            vars = variableRepository.findByOrgId(orgId);
        }
        // Bug fix: mask secret values using the clean constant (was a corrupted UTF-8 literal before)
        vars.forEach(v -> { if (Boolean.TRUE.equals(v.getIsSecret())) v.setValue(SECRET_MASK); });
        return ResponseEntity.ok(vars);
    }

    @PostMapping
    public ResponseEntity<Variable> create(@RequestBody Variable variable, HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        variable.setOrgId(orgId);
        if (variable.getScope() == null) variable.setScope("GLOBAL");
        return ResponseEntity.ok(variableRepository.save(variable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Variable> update(@PathVariable Long id,
                                            @RequestBody Variable body,
                                            HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return variableRepository.findById(id)
                .filter(v -> orgId.equals(v.getOrgId()))  // Tenant isolation check
                .map(v -> {
                    v.setKeyName(body.getKeyName());
                    // Bug fix: only update value if it's not the sentinel mask string
                    // (was broken before because the corrupted UTF-8 literal never matched)
                    if (body.getValue() != null && !SECRET_MASK.equals(body.getValue())) {
                        v.setValue(body.getValue());
                    }
                    v.setScope(body.getScope() != null ? body.getScope() : v.getScope());
                    v.setScopeId(body.getScopeId());
                    v.setIsSecret(body.getIsSecret());
                    return ResponseEntity.ok(variableRepository.save(v));
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return variableRepository.findById(id)
                .filter(v -> orgId.equals(v.getOrgId()))  // Tenant isolation check
                .map(v -> { variableRepository.delete(v); return ResponseEntity.ok().<Void>build(); })
                .orElse(ResponseEntity.notFound().build());
    }
}
