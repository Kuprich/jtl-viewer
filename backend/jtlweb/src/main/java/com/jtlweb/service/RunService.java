package com.jtlweb.service;

import com.jtlweb.dto.RunSummary;
import com.jtlweb.exception.RunNotFoundException;
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

    public RunSummary getById(long id) {
        return runRepository.findById(id)
                .map(RunService::toSummary)
                .orElseThrow(() -> new RunNotFoundException(id));
    }

    private static RunSummary toSummary(JtlRun r) {
        return new RunSummary(r.getId(), r.getFileName(), r.getUploadedAt(), r.getRows(), r.getErrors());
    }
}
