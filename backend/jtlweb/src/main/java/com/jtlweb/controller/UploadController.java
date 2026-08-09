package com.jtlweb.controller;

import com.jtlweb.dto.RunSummary;
import com.jtlweb.model.JtlRun;
import com.jtlweb.service.JtlImportService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;

@RestController
@RequestMapping("/api/runs")
public class UploadController {

    private final JtlImportService importService;

    public UploadController(JtlImportService importService) {
        this.importService = importService;
    }

    @PostMapping
    public RunSummary upload(@RequestParam("file") MultipartFile file) {
        try {
            return RunSummary.from(importService.importJtl(file.getOriginalFilename(), file.getInputStream()));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
