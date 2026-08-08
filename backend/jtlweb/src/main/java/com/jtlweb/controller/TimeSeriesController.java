package com.jtlweb.controller;

import com.jtlweb.dto.TimeSeriesPoint;
import com.jtlweb.service.TimeSeriesService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/runs")
public class TimeSeriesController {

    private final TimeSeriesService timeSeriesService;

    public TimeSeriesController(TimeSeriesService timeSeriesService) {
        this.timeSeriesService = timeSeriesService;
    }

    @GetMapping("/{id}/timeseries")
    public List<TimeSeriesPoint> timeseries(@PathVariable long id,
                                            @RequestParam(required = false) Long bucketMs,
                                            @RequestParam(required = false) String label,
                                            @RequestParam(required = false) List<String> labels) {
        return timeSeriesService.timeseries(id, bucketMs, label, labels);
    }
}