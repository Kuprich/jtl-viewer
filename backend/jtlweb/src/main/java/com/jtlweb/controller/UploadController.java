package com.jtlweb.controller;

import com.jtlweb.model.JtlRun;
import com.jtlweb.service.JtlImportService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/runs")
public class UploadController {

    private final JtlImportService importService;

    public UploadController(JtlImportService importService) {
        this.importService = importService;
    }

    @PostMapping
    public JtlRun upload(@RequestParam("file") MultipartFile file) throws IOException {
        return importService.importJtl(file.getOriginalFilename(), file.getInputStream());
    }
}
