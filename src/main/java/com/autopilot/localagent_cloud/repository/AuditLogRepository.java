package com.autopilot.localagent_cloud.repository;

import com.autopilot.localagent_cloud.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByOrgIdOrderByCreatedAtDesc(Long orgId);
}
