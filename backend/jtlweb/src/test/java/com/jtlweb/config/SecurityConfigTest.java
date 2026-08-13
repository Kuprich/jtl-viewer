package com.jtlweb.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DummyApiController.class)
@Import(SecurityConfig.class)
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void apiRejectsAnonymousRequests() throws Exception {
        mockMvc.perform(get("/api/dummy"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Authentication required"))
                .andExpect(header().doesNotExist(HttpHeaders.WWW_AUTHENTICATE));
    }

    @Test
    void apiAllowsValidCredentials() throws Exception {
        mockMvc.perform(get("/api/dummy").with(httpBasic("admin", "admin")))
                .andExpect(status().isOk());
    }

    @Test
    void apiRejectsWrongPassword() throws Exception {
        mockMvc.perform(get("/api/dummy").with(httpBasic("admin", "wrong")))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist(HttpHeaders.WWW_AUTHENTICATE));
    }

    @Test
    void apiRejectsUnknownUser() throws Exception {
        mockMvc.perform(get("/api/dummy").with(httpBasic("joe", "admin")))
                .andExpect(status().isUnauthorized());
    }
}