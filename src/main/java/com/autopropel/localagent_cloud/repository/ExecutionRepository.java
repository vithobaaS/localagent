package com.autopropel.localagent_cloud.repository;

import com.autopropel.localagent_cloud.model.Execution;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExecutionRepository extends JpaRepository<Execution, Long> {
    List<Execution> findAllByOrderByIdDesc();
    long countByOrgId(Long orgId);
}
