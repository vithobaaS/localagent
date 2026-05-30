package com.autopropel.localagent_cloud.repository;

import com.autopropel.localagent_cloud.model.Job;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    @Query("SELECT j FROM Job j WHERE j.status = 'QUEUED' AND (j.agentId = :agentId OR j.agentId IS NULL) ORDER BY j.id ASC")
    List<Job> findNextAvailableJobs(@Param("agentId") String agentId, Pageable pageable);

    List<Job> findByExecutionId(Long executionId);
}
