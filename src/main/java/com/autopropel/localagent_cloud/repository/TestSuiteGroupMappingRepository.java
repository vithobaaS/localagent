package com.autopropel.localagent_cloud.repository;

import com.autopropel.localagent_cloud.model.TestSuiteGroupMapping;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface TestSuiteGroupMappingRepository extends JpaRepository<TestSuiteGroupMapping, Long> {
    List<TestSuiteGroupMapping> findByTestSuiteIdOrderByGroupOrder(Long testSuiteId);

    @Transactional
    void deleteByTestSuiteId(Long testSuiteId);
}
