package com.autopilot.localagent_cloud.controller;

import com.autopilot.localagent_cloud.model.Organisation;
import com.autopilot.localagent_cloud.repository.OrganisationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public/orgs")
@CrossOrigin(origins = "*")
public class PublicOrgController {

    private final OrganisationRepository orgRepository;

    public PublicOrgController(OrganisationRepository orgRepository) {
        this.orgRepository = orgRepository;
    }

    @GetMapping("/by-subdomain/{subdomain}")
    public ResponseEntity<Map<String, String>> getOrgBySubdomain(@PathVariable String subdomain) {
        Organisation org = orgRepository.findBySubdomain(subdomain);
        if (org == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(Map.of(
            "name", org.getName(),
            "subdomain", org.getSubdomain()
        ));
    }
}
