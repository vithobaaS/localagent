package com.autopropel.localagent_cloud.repository;

import com.autopropel.localagent_cloud.model.Screenshot;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScreenshotRepository extends JpaRepository<Screenshot, Long> {
    List<Screenshot> findByExecutionId(Long executionId);
}
