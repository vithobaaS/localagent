package com.autopilot.localagent_cloud.repository;

import com.autopilot.localagent_cloud.model.Agent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AgentRepository extends JpaRepository<Agent, String> {
    List<Agent> findByOrgId(Long orgId);
    List<Agent> findAll();
}
