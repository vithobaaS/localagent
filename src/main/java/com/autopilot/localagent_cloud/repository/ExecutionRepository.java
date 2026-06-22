package com.autopilot.localagent_cloud.repository;

import com.autopilot.localagent_cloud.model.Execution;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExecutionRepository extends JpaRepository<Execution, Long> {
    List<Execution> findAllByOrderByIdDesc();
    long countByOrgId(Long orgId);
    List<Execution> findByStatusAndCreatedAtBefore(String status, java.time.LocalDateTime cutoff);
    Optional<Execution> findFirstBySchedulerIdOrderByIdDesc(Long schedulerId);
}
