package com.autopilot.localagent_cloud.repository;

import com.autopilot.localagent_cloud.model.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
}
