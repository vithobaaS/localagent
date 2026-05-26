package com.autopropel.localagent_cloud;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MvpUiViewController {

    @GetMapping("/autopropel/dashboard")
    public String dashboardRedirect() {
        return "forward:/autopropel/dashboard/index.html";
    }
}
