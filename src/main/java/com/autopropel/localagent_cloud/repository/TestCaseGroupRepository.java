package com.autopropel.localagent_cloud.repository;

import com.autopropel.localagent_cloud.model.TestCaseGroup;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TestCaseGroupRepository extends JpaRepository<TestCaseGroup, Long> {
    List<TestCaseGroup> findAllByOrderByIdDesc();
}
