package com.autopropel.localagent_cloud.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExecutionRepository extends JpaRepository<Execution, Long> {
    List<Execution> findAllByOrderByIdDesc();
    long countByOrgId(Long orgId);
}

