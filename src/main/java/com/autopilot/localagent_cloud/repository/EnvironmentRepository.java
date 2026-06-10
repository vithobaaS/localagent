package com.autopilot.localagent_cloud.repository;

import com.autopilot.localagent_cloud.model.Environment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EnvironmentRepository extends JpaRepository<Environment, Long> {
    List<Environment> findByOrgId(Long orgId);
}
