package com.autopilot.localagent_cloud;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MvpUiViewController {

    @GetMapping({
        "/autopilot",
        "/autopilot/",
        "/autopilot/login",
        "/autopilot/register",
        "/autopilot/dashboard",
        "/autopilot/scheduler",
        "/autopilot/scheduler/**",
        "/autopilot/groups",
        "/autopilot/groups/**",
        "/autopilot/test-cases",
        "/autopilot/test-cases/**",
        "/autopilot/test-case-groups",
        "/autopilot/test-case-groups/**",
        "/autopilot/test-suites",
        "/autopilot/test-suites/**",
        "/autopilot/stub/**"
    })
    public String dashboardRedirect() {
        return "forward:/autopilot/index.html";
    }
}
