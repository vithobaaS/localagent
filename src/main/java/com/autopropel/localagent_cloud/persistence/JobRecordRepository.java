package com.autopropel.localagent_cloud.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.autopropel.localagent_cloud.service.JobStatus;

public interface JobRecordRepository extends JpaRepository<JobRecord, Long> {

    Optional<JobRecord> findFirstByAgentIdAndStatusOrderByCreatedAtAsc(String agentId, JobStatus status);

    Optional<JobRecord> findByReferenceId(String referenceId);
}
