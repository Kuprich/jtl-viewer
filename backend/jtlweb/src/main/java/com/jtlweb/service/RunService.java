package com.jtlweb.service;

import com.jtlweb.dto.RunSummary;
import com.jtlweb.model.JtlRun;
import com.jtlweb.repository.JtlRunRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RunService {

    private final JtlRunRepository runRepository;

    public RunService(JtlRunRepository runRepository) {
        this.runRepository = runRepository;
    }

    public List<RunSummary> listAll() {
        return runRepository.findAllByOrderByUploadedAtDesc().stream()
                .map(RunService::toSummary)
                .toList();
    }

    private static RunSummary toSummary(JtlRun r) {
        return new RunSummary(r.getId(), r.getFileName(), r.getUploadedAt(), r.getRows(), r.getErrors());
    }
}
