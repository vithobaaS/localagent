package com.autopropel.localagent_cloud.controller;

import com.autopropel.localagent_cloud.auth.JwtUtil;
import com.autopropel.localagent_cloud.model.Variable;
import com.autopropel.localagent_cloud.repository.VariableRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/variables")
public class VariableController {

    private final VariableRepository variableRepository;
    private final JwtUtil jwtUtil;

    public VariableController(VariableRepository variableRepository, JwtUtil jwtUtil) {
        this.variableRepository = variableRepository;
        this.jwtUtil = jwtUtil;
    }

    private Long getOrgId(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try { return jwtUtil.extractOrgId(token); } catch (Exception ignored) {}
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<List<Variable>> getAll(
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) Long scopeId,
            HttpServletRequest request) {
        Long orgId = getOrgId(request);
        List<Variable> vars;
        if (scope != null && scopeId != null) {
            vars = variableRepository.findByOrgIdAndScopeAndScopeId(orgId, scope.toUpperCase(), scopeId);
        } else if (scope != null) {
            vars = variableRepository.findByOrgIdAndScope(orgId, scope.toUpperCase());
        } else {
            vars = variableRepository.findByOrgId(orgId);
        }
        // Mask secret values
        vars.forEach(v -> { if (Boolean.TRUE.equals(v.getIsSecret())) v.setValue("••••••••"); });
        return ResponseEntity.ok(vars);
    }

    @PostMapping
    public ResponseEntity<Variable> create(@RequestBody Variable variable, HttpServletRequest request) {
        Long orgId = getOrgId(request);
        variable.setOrgId(orgId);
        if (variable.getScope() == null) variable.setScope("GLOBAL");
        return ResponseEntity.ok(variableRepository.save(variable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Variable> update(@PathVariable Long id, @RequestBody Variable body, HttpServletRequest request) {
        return variableRepository.findById(id).map(v -> {
            v.setKeyName(body.getKeyName());
            // Only update value if not masked
            if (body.getValue() != null && !body.getValue().equals("••••••••")) {
                v.setValue(body.getValue());
            }
            v.setScope(body.getScope() != null ? body.getScope() : v.getScope());
            v.setScopeId(body.getScopeId());
            v.setIsSecret(body.getIsSecret());
            return ResponseEntity.ok(variableRepository.save(v));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        variableRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
