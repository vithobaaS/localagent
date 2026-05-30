package com.autopropel.localagent_cloud.repository;

import com.autopropel.localagent_cloud.model.AgentGroupMapping;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface AgentGroupMappingRepository extends JpaRepository<AgentGroupMapping, Long> {
    List<AgentGroupMapping> findByGroupId(Long groupId);
    List<AgentGroupMapping> findByAgentId(String agentId);

    @Transactional
    void deleteByAgentIdAndGroupId(String agentId, Long groupId);
}
