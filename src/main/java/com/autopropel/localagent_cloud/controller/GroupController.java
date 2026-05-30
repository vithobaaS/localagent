package com.autopropel.localagent_cloud.controller;

import com.autopropel.localagent_cloud.model.Group;
import com.autopropel.localagent_cloud.model.AgentGroupMapping;
import com.autopropel.localagent_cloud.service.GroupService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = "*")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    private Long orgId(HttpServletRequest req) {
        Object o = req.getAttribute("orgId");
        return o != null ? ((Number) o).longValue() : null;
    }

    @GetMapping
    public ResponseEntity<List<Group>> getGroups(HttpServletRequest req) {
        return groupService.getAll(orgId(req));
    }

    @PostMapping
    public ResponseEntity<Group> createGroup(@RequestBody Group group, HttpServletRequest req) {
        return groupService.create(group, orgId(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Group> updateGroup(@PathVariable("id") Long id, @RequestBody Group updated) {
        return groupService.update(id, updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable("id") Long id) {
        return groupService.delete(id);
    }

    @GetMapping("/{id}/agents")
    public ResponseEntity<List<Map<String, Object>>> getAgentsInGroup(@PathVariable("id") Long groupId) {
        return groupService.getAgentsInGroup(groupId);
    }

    @PostMapping("/{id}/agents")
    public ResponseEntity<AgentGroupMapping> addAgentToGroup(
            @PathVariable("id") Long groupId,
            @RequestBody Map<String, String> body) {
        return groupService.addAgent(groupId, body.get("agentId"));
    }

    @DeleteMapping("/{groupId}/agents/{agentId}")
    public ResponseEntity<Void> removeAgentFromGroup(
            @PathVariable("groupId") Long groupId,
            @PathVariable("agentId") String agentId) {
        return groupService.removeAgent(groupId, agentId);
    }
}
