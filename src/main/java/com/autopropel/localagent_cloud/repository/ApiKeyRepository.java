package com.autopropel.localagent_cloud.repository;

import com.autopropel.localagent_cloud.model.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    List<ApiKey> findByOrgId(Long orgId);
    Optional<ApiKey> findByToken(String token);
}
