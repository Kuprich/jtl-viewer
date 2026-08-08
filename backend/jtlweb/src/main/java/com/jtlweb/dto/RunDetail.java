package com.jtlweb.dto;

import java.time.Instant;

public record RunDetail(long id,
                        String fileName,
                        Instant uploadedAt,
                        long rows,
                        long errors,
                        Long startTime,
                        Long endTime,
                        Long durationMs) {
}
