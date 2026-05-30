package com.autopropel.localagent_cloud.service;

import com.autopropel.localagent_cloud.model.Group;
import com.autopropel.localagent_cloud.model.AgentGroupMapping;
import com.autopropel.localagent_cloud.repository.GroupRepository;
import com.autopropel.localagent_cloud.repository.AgentGroupMappingRepository;
import com.autopropel.localagent_cloud.repository.AgentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final AgentGroupMappingRepository agentGroupMappingRepository;
    private final AgentRepository agentRepository;

    public GroupService(GroupRepository groupRepository,
                        AgentGroupMappingRepository agentGroupMappingRepository,
                        AgentRepository agentRepository) {
        this.groupRepository = groupRepository;
        this.agentGroupMappingRepository = agentGroupMappingRepository;
        this.agentRepository = agentRepository;
    }

    public ResponseEntity<List<Group>> getAll(Long orgId) {
        List<Group> list = orgId != null
                ? groupRepository.findAll().stream().filter(g -> orgId.equals(g.getOrgId())).toList()
                : groupRepository.findAll();
        return ResponseEntity.ok(list);
    }

    public ResponseEntity<Group> create(Group group, Long orgId) {
        if (group.getName() == null || group.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        group.setOrgId(orgId);
        return ResponseEntity.status(HttpStatus.CREATED).body(groupRepository.save(group));
    }

    public ResponseEntity<Group> update(Long id, Group updated) {
        return groupRepository.findById(id).map(existing -> {
            if (updated.getName() != null) existing.setName(updated.getName());
            if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
            return ResponseEntity.ok(groupRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    public ResponseEntity<Void> delete(Long id) {
        if (!groupRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        groupRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    public ResponseEntity<List<Map<String, Object>>> getAgentsInGroup(Long groupId) {
        List<AgentGroupMapping> mappings = agentGroupMappingRepository.findByGroupId(groupId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (AgentGroupMapping m : mappings) {
            agentRepository.findById(m.getAgentId()).ifPresent(agent -> {
                Map<String, Object> entry = new HashMap<>();
                entry.put("mappingId", m.getId());
                entry.put("agent", agent);
                result.add(entry);
            });
        }
        return ResponseEntity.ok(result);
    }

    public ResponseEntity<AgentGroupMapping> addAgent(Long groupId, String agentId) {
        if (agentId == null || agentId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (!groupRepository.existsById(groupId)) {
            return ResponseEntity.notFound().build();
        }
        AgentGroupMapping mapping = new AgentGroupMapping();
        mapping.setAgentId(agentId);
        mapping.setGroupId(groupId);
        return ResponseEntity.status(HttpStatus.CREATED).body(agentGroupMappingRepository.save(mapping));
    }

    @Transactional
    public ResponseEntity<Void> removeAgent(Long groupId, String agentId) {
        agentGroupMappingRepository.deleteByAgentIdAndGroupId(agentId, groupId);
        return ResponseEntity.noContent().build();
    }
}
