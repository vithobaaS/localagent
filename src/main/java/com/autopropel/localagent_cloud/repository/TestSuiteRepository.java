package com.autopropel.localagent_cloud.repository;

import com.autopropel.localagent_cloud.model.TestSuite;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TestSuiteRepository extends JpaRepository<TestSuite, Long> {
    List<TestSuite> findAllByOrderByIdDesc();
}
