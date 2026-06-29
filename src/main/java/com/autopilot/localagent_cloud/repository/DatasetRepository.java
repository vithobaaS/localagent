package com.autopilot.localagent_cloud.repository;

import com.autopilot.localagent_cloud.model.Dataset;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DatasetRepository extends JpaRepository<Dataset, Long> {
    List<Dataset> findByOrgId(Long orgId);
}
