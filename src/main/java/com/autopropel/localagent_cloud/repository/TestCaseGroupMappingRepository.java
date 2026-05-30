package com.autopropel.localagent_cloud.repository;

import com.autopropel.localagent_cloud.model.TestCaseGroupMapping;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface TestCaseGroupMappingRepository extends JpaRepository<TestCaseGroupMapping, Long> {
    List<TestCaseGroupMapping> findByTestCaseGroupIdOrderByCaseOrder(Long testCaseGroupId);

    @Transactional
    void deleteByTestCaseGroupId(Long testCaseGroupId);
}
