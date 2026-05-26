package com.autopropel.localagent_cloud.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StepResultRepository extends JpaRepository<StepResult, Long> {
    List<StepResult> findByExecutionId(Long executionId);
}
