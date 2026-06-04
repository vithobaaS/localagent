package com.autopropel.localagent_cloud.service;

import com.autopropel.localagent_cloud.model.Execution;
import com.autopropel.localagent_cloud.repository.ExecutionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrphanedExecutionSweeper {

    private static final Logger logger = LoggerFactory.getLogger(OrphanedExecutionSweeper.class);
    
    private final ExecutionRepository executionRepository;

    public OrphanedExecutionSweeper(ExecutionRepository executionRepository) {
        this.executionRepository = executionRepository;
    }

    // Run every 5 minutes (300000 ms)
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void sweepOrphanedExecutions() {
        // If an execution is stuck in "running" for more than 15 minutes, it is orphaned
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(15);
        List<Execution> orphanedExecutions = executionRepository.findByStatusAndCreatedAtBefore("running", cutoff);

        if (!orphanedExecutions.isEmpty()) {
            logger.warn("Found {} orphaned executions stuck in 'running' state. Marking them as failed.", orphanedExecutions.size());
            for (Execution execution : orphanedExecutions) {
                execution.setStatus("failed");
                execution.setFinishedAt(LocalDateTime.now());
                executionRepository.save(execution);
            }
        }
    }
}
