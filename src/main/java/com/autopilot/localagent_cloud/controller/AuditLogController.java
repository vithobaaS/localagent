package com.autopilot.localagent_cloud.controller;

import com.autopilot.localagent_cloud.model.AuditLog;
import com.autopilot.localagent_cloud.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    public AuditLogController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    private Long orgId(HttpServletRequest req) {
        Object o = req.getAttribute("orgId");
        return o != null ? ((Number) o).longValue() : null;
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAuditLogs(HttpServletRequest req) {
        Long orgId = orgId(req);
        if (orgId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        
        List<AuditLog> logs = auditLogRepository.findByOrgIdOrderByCreatedAtDesc(orgId);
        return ResponseEntity.ok(logs);
    }
}
