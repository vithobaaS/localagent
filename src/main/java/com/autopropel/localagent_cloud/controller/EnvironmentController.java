package com.autopropel.localagent_cloud.controller;

import com.autopropel.localagent_cloud.auth.JwtUtil;
import com.autopropel.localagent_cloud.model.Environment;
import com.autopropel.localagent_cloud.model.Variable;
import com.autopropel.localagent_cloud.repository.EnvironmentRepository;
import com.autopropel.localagent_cloud.repository.VariableRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/environments")
public class EnvironmentController {

    private final EnvironmentRepository environmentRepository;
    private final VariableRepository variableRepository;
    private final JwtUtil jwtUtil;

    public EnvironmentController(EnvironmentRepository environmentRepository,
                                  VariableRepository variableRepository,
                                  JwtUtil jwtUtil) {
        this.environmentRepository = environmentRepository;
        this.variableRepository = variableRepository;
        this.jwtUtil = jwtUtil;
    }

    private Long getOrgId(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try { return jwtUtil.extractOrgId(header.substring(7)); } catch (Exception ignored) {}
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<List<Environment>> getAll(HttpServletRequest request) {
        Long orgId = getOrgId(request);
        return ResponseEntity.ok(environmentRepository.findByOrgId(orgId));
    }

    @PostMapping
    public ResponseEntity<Environment> create(@RequestBody Environment env, HttpServletRequest request) {
        env.setOrgId(getOrgId(request));
        return ResponseEntity.ok(environmentRepository.save(env));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Environment> update(@PathVariable Long id, @RequestBody Environment body) {
        return environmentRepository.findById(id).map(e -> {
            e.setName(body.getName());
            e.setDescription(body.getDescription());
            return ResponseEntity.ok(environmentRepository.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        // Also delete env-scoped variables
        List<Variable> envVars = variableRepository.findByOrgIdAndScopeAndScopeId(null, "ENVIRONMENT", id);
        variableRepository.deleteAll(envVars);
        environmentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/variables")
    public ResponseEntity<List<Variable>> getVariables(@PathVariable Long id, HttpServletRequest request) {
        Long orgId = getOrgId(request);
        List<Variable> vars = variableRepository.findByOrgIdAndScopeAndScopeId(orgId, "ENVIRONMENT", id);
        vars.forEach(v -> { if (Boolean.TRUE.equals(v.getIsSecret())) v.setValue("••••••••"); });
        return ResponseEntity.ok(vars);
    }

    @PostMapping("/{id}/variables")
    public ResponseEntity<Variable> addVariable(@PathVariable Long id, @RequestBody Variable variable, HttpServletRequest request) {
        variable.setOrgId(getOrgId(request));
        variable.setScope("ENVIRONMENT");
        variable.setScopeId(id);
        return ResponseEntity.ok(variableRepository.save(variable));
    }

    @DeleteMapping("/{envId}/variables/{varId}")
    public ResponseEntity<Void> deleteVariable(@PathVariable Long envId, @PathVariable Long varId) {
        variableRepository.deleteById(varId);
        return ResponseEntity.ok().build();
    }
}
