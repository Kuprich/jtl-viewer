package com.jtlweb.dto;

import com.jtlweb.model.JtlRun;

import java.time.Instant;

public record RunSummary(long id, String fileName, Instant uploadedAt, long rows, long errors) {

    public static RunSummary from(JtlRun run) {
        return new RunSummary(run.getId(), run.getFileName(), run.getUploadedAt(), run.getRows(), run.getErrors());
    }
}