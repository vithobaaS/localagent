package com.autopropel.localagent_cloud.repository;

import com.autopropel.localagent_cloud.model.TestStep;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface TestStepRepository extends JpaRepository<TestStep, Long> {
    List<TestStep> findByTestCaseIdOrderByStepOrder(Long testCaseId);

    @Transactional
    void deleteByTestCaseId(Long testCaseId);
}
