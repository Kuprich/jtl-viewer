package com.jtlweb.config;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DummyApiController {

    @GetMapping("/api/dummy")
    public String dummy() {
        return "ok";
    }
}
