package com.jtlweb.controller;

import com.jtlweb.dto.StatDto;
import com.jtlweb.service.StatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/runs")
public class RunStatsController {

    private final StatsService statsService;

    public RunStatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/{id}/stats")
    public List<StatDto> stats(@PathVariable long id,
                               @RequestParam(defaultValue = "label") String groupBy,
                               @RequestParam(required = false) List<String> labels,
                               @RequestParam(required = false) Long fromMs,
                               @RequestParam(required = false) Long toMs) {
        return statsService.stats(id, groupBy, labels, fromMs, toMs);
    }

    @GetMapping("/{id}/labels")
    public List<String> labels(@PathVariable long id) {
        return statsService.labels(id);
    }
}
