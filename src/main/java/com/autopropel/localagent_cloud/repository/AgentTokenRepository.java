package com.autopropel.localagent_cloud.repository;

import com.autopropel.localagent_cloud.model.AgentToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AgentTokenRepository extends JpaRepository<AgentToken, Long> {
    Optional<AgentToken> findByToken(String token);
    java.util.List<AgentToken> findByOrgId(Long orgId);
}
