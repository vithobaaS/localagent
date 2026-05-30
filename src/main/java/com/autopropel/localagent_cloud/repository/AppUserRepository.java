package com.autopropel.localagent_cloud.repository;

import com.autopropel.localagent_cloud.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByEmail(String email);
    boolean existsByEmail(String email);
    java.util.List<AppUser> findByOrgId(Long orgId);
}
