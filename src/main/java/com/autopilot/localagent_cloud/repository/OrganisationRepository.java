package com.autopilot.localagent_cloud.repository;

import com.autopilot.localagent_cloud.model.Organisation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganisationRepository extends JpaRepository<Organisation, Long> {
    Organisation findBySubdomain(String subdomain);
    Organisation findByPublicId(String publicId);
}
