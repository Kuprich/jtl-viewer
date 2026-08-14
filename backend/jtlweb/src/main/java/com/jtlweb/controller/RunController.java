package com.jtlweb.controller;

import com.jtlweb.dto.Envelope;
import com.jtlweb.dto.RunDetail;
import com.jtlweb.dto.RunSummary;
import com.jtlweb.service.RunService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/runs")
public class RunController {

    private final RunService runService;

    public RunController(RunService runService) {
        this.runService = runService;
    }

    @GetMapping
    public Envelope<RunSummary> list() {
        List<RunSummary> runs = runService.listAll();
        return new Envelope<>(runs, runs.size());
    }

    @GetMapping("/{id}")
    public RunDetail get(@PathVariable long id) {
        return runService.getById(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        runService.delete(id);
        return ResponseEntity.noContent().build();
    }
}