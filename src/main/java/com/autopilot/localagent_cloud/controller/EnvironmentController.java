package com.autopilot.localagent_cloud.controller;

import com.autopilot.localagent_cloud.model.Environment;
import com.autopilot.localagent_cloud.model.Variable;
import com.autopilot.localagent_cloud.repository.EnvironmentRepository;
import com.autopilot.localagent_cloud.repository.VariableRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Secret masking sentinel — a clean ASCII constant, never a corrupted UTF-8 literal */
@RestController
@RequestMapping("/api/environments")
public class EnvironmentController {

    // Industry-standard sentinel string for masked secrets (never stored in DB)
    private static final String SECRET_MASK = "••••••••";

    private final EnvironmentRepository environmentRepository;
    private final VariableRepository variableRepository;

    public EnvironmentController(EnvironmentRepository environmentRepository,
                                  VariableRepository variableRepository) {
        this.environmentRepository = environmentRepository;
        this.variableRepository = variableRepository;
    }

    private Long getOrgId(HttpServletRequest request) {
        // Use the orgId already extracted and validated by JwtAuthFilter — consistent with all other controllers
        Object o = request.getAttribute("orgId");
        return o != null ? ((Number) o).longValue() : null;
    }

    @GetMapping
    public ResponseEntity<List<Environment>> getAll(HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(environmentRepository.findByOrgId(orgId));
    }

    @PostMapping
    public ResponseEntity<Environment> create(@RequestBody Environment env, HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        env.setOrgId(orgId);
        return ResponseEntity.ok(environmentRepository.save(env));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Environment> update(@PathVariable Long id,
                                               @RequestBody Environment body,
                                               HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return environmentRepository.findById(id)
                .filter(e -> orgId.equals(e.getOrgId()))  // Tenant isolation check
                .map(e -> {
                    e.setName(body.getName());
                    e.setDescription(body.getDescription());
                    return ResponseEntity.ok(environmentRepository.save(e));
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        // Bug fix: verify this environment belongs to the calling org before deleting
        Environment env = environmentRepository.findById(id).orElse(null);
        if (env == null) return ResponseEntity.notFound().build();
        if (!orgId.equals(env.getOrgId())) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        // Bug fix: pass correct orgId (was passing null — could delete other org's variables!)
        List<Variable> envVars = variableRepository.findByOrgIdAndScopeAndScopeId(orgId, "ENVIRONMENT", id);
        variableRepository.deleteAll(envVars);
        environmentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/variables")
    public ResponseEntity<List<Variable>> getVariables(@PathVariable Long id, HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        List<Variable> vars = variableRepository.findByOrgIdAndScopeAndScopeId(orgId, "ENVIRONMENT", id);
        // Mask secret values before returning to client
        vars.forEach(v -> { if (Boolean.TRUE.equals(v.getIsSecret())) v.setValue(SECRET_MASK); });
        return ResponseEntity.ok(vars);
    }

    @PostMapping("/{id}/variables")
    public ResponseEntity<Variable> addVariable(@PathVariable Long id,
                                                 @RequestBody Variable variable,
                                                 HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        variable.setOrgId(orgId);
        variable.setScope("ENVIRONMENT");
        variable.setScopeId(id);
        return ResponseEntity.ok(variableRepository.save(variable));
    }

    @DeleteMapping("/{envId}/variables/{varId}")
    public ResponseEntity<Void> deleteVariable(@PathVariable Long envId,
                                                @PathVariable Long varId,
                                                HttpServletRequest request) {
        Long orgId = getOrgId(request);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        // Verify the variable belongs to this org before deleting
        return variableRepository.findById(varId)
                .filter(v -> orgId.equals(v.getOrgId()))
                .map(v -> { variableRepository.delete(v); return ResponseEntity.ok().<Void>build(); })
                .orElse(ResponseEntity.notFound().build());
    }
}
