package com.autopropel.localagent_cloud.repository;

import com.autopropel.localagent_cloud.model.Variable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VariableRepository extends JpaRepository<Variable, Long> {
    List<Variable> findByOrgId(Long orgId);
    List<Variable> findByOrgIdAndScope(Long orgId, String scope);
    List<Variable> findByOrgIdAndScopeAndScopeId(Long orgId, String scope, Long scopeId);
}
