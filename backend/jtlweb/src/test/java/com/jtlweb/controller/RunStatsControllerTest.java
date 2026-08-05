package com.jtlweb.controller;

import com.jtlweb.dto.StatDto;
import com.jtlweb.exception.InvalidGroupByException;
import com.jtlweb.exception.RunNotFoundException;
import com.jtlweb.service.StatsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RunStatsController.class)
class RunStatsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StatsService statsService;

    @Test
    void statsReturnsList() throws Exception {
        when(statsService.stats(1L, "label")).thenReturn(List.of(new StatDto(
                "UC01_Get_products", 302, 0, 0.0, 147, 1195, 172.6,
                162.5, 189.0, 196.0, 406.5, 0.2, 3445364, 11408.5)));

        mockMvc.perform(get("/api/runs/1/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].group").value("UC01_Get_products"))
                .andExpect(jsonPath("$[0].calls").value(302))
                .andExpect(jsonPath("$[0].errorRate").value(0.0))
                .andExpect(jsonPath("$[0].throughput").value(0.2))
                .andExpect(jsonPath("$[0].totalBytes").value(3445364))
                .andExpect(jsonPath("$[0].avgBytes").value(11408.5));
    }

    @Test
    void invalidGroupByReturns400() throws Exception {
        when(statsService.stats(1L, "bogus")).thenThrow(new InvalidGroupByException("bogus"));

        mockMvc.perform(get("/api/runs/1/stats").param("groupBy", "bogus"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Unsupported groupBy: bogus"));
    }

    @Test
    void missingRunReturns404() throws Exception {
        when(statsService.stats(999L, "label")).thenThrow(new RunNotFoundException(999));

        mockMvc.perform(get("/api/runs/999/stats"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Run 999 not found"));
    }
}
