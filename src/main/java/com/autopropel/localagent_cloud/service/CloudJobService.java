package com.autopropel.localagent_cloud.service;

import org.springframework.stereotype.Service;

import com.autopropel.localagent_cloud.dto.RunRequest;
import com.autopropel.localagent_cloud.dto.RunResult;
import com.autopropel.localagent_cloud.persistence.JobRecord;
import com.autopropel.localagent_cloud.persistence.JobRecordRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class CloudJobService {

    private final JobRecordRepository jobRecordRepository;
    private final ObjectMapper objectMapper;

    public CloudJobService(JobRecordRepository jobRecordRepository, ObjectMapper objectMapper) {
        this.jobRecordRepository = jobRecordRepository;
        this.objectMapper = objectMapper;
    }

    public boolean scheduleJob(String agentId, RunRequest job) {
        if (!isValidAgentId(agentId) || !isValidJob(job)) {
            return false;
        }

        String referenceId = job.result.referenceId;
        JobRecord record = jobRecordRepository.findByReferenceId(referenceId).orElseGet(JobRecord::new);
        record.setAgentId(agentId);
        record.setReferenceId(referenceId);
        record.setStatus(JobStatus.QUEUED);
        record.setPayloadJson(serialize(job));
        jobRecordRepository.save(record);
        return true;
    }

    public RunRequest pollJob(String agentId) {
        if (!isValidAgentId(agentId)) {
            return null;
        }

        JobRecord record = jobRecordRepository.findFirstByAgentIdAndStatusOrderByCreatedAtAsc(agentId, JobStatus.QUEUED)
                .orElse(null);
        if (record == null) {
            return null;
        }

        record.setStatus(JobStatus.ASSIGNED);
        jobRecordRepository.save(record);
        return deserialize(record.getPayloadJson());
    }

    public boolean receiveResult(RunRequest result) {
        if (!isValidResult(result)) {
            return false;
        }

        String referenceId = result.result.referenceId;
        JobRecord record = jobRecordRepository.findByReferenceId(referenceId).orElseGet(JobRecord::new);
        record.setReferenceId(referenceId);
        record.setStatus(isSuccess(result.result) ? JobStatus.SUCCESS : JobStatus.FAILED);
        record.setPayloadJson(serialize(result));

        if (record.getAgentId() == null) {
            record.setAgentId(result.result.environmentId);
        }

        jobRecordRepository.save(record);
        return true;
    }

    public RunRequest getJobResult(String referenceId) {
        if (referenceId == null || referenceId.isBlank()) {
            return null;
        }

        return jobRecordRepository.findByReferenceId(referenceId)
                .map(record -> deserialize(record.getPayloadJson()))
                .orElse(null);
    }

    public JobStatus getJobStatus(String referenceId) {
        if (referenceId == null || referenceId.isBlank()) {
            return null;
        }

        return jobRecordRepository.findByReferenceId(referenceId)
                .map(JobRecord::getStatus)
                .orElse(null);
    }

    private boolean isValidAgentId(String agentId) {
        return agentId != null && !agentId.isBlank();
    }

    private boolean isValidJob(RunRequest job) {
        if (job == null || job.result == null) {
            return false;
        }

        RunResult result = job.result;
        return result.referenceId != null && !result.referenceId.isBlank()
                && result.iterationval != null && !result.iterationval.isBlank()
                && result.testCase != null && !result.testCase.isEmpty();
    }

    private boolean isValidResult(RunRequest result) {
        return result != null && result.result != null
                && result.result.referenceId != null && !result.result.referenceId.isBlank();
    }

    private boolean isSuccess(RunResult result) {
        return result != null && result.result_status != null && result.result_status == 1;
    }

    private String serialize(RunRequest request) {
        try {
            return objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize RunRequest", e);
        }
    }

    private RunRequest deserialize(String payload) {
        try {
            return objectMapper.readValue(payload, RunRequest.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize RunRequest", e);
        }
    }
}
