package com.jtlweb.service;

import com.jtlweb.dto.RunDetail;
import com.jtlweb.dto.RunSummary;
import com.jtlweb.exception.RunNotFoundException;
import com.jtlweb.model.JtlRun;
import com.jtlweb.repository.JtlRunRepository;
import com.jtlweb.repository.JtlSampleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RunService {

    private final JtlRunRepository runRepository;
    private final JtlSampleRepository sampleRepository;

    public RunService(JtlRunRepository runRepository, JtlSampleRepository sampleRepository) {
        this.runRepository = runRepository;
        this.sampleRepository = sampleRepository;
    }

    public List<RunSummary> listAll() {
        return runRepository.findAllByOrderByUploadedAtDesc().stream()
                .map(RunService::toSummary)
                .toList();
    }

    public RunDetail getById(long id) {
        JtlRun run = runRepository.findById(id)
                .orElseThrow(() -> new RunNotFoundException(id));

        JtlSampleRepository.TimeRange range = sampleRepository.findTimeRangeAll(id);
        Long startTime = range.getMinTs();
        Long endTime = range.getMaxTs();
        Long durationMs = (startTime != null && endTime != null) ? endTime - startTime : null;

        return new RunDetail(run.getId(), run.getFileName(), run.getUploadedAt(),
                run.getRows(), run.getErrors(), startTime, endTime, durationMs);
    }

    @Transactional
    public void delete(long id) {
        runRepository.findById(id)
                .orElseThrow(() -> new RunNotFoundException(id));
        sampleRepository.deleteByRunId(id);
        runRepository.deleteById(id);
    }

    private static RunSummary toSummary(JtlRun r) {
        return RunSummary.from(r);
    }
}
