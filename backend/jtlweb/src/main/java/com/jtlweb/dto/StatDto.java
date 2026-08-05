package com.jtlweb.dto;

public record StatDto(
        String group,
        long calls,
        long errors,
        double errorRate,
        long min,
        long max,
        double avg,
        double p50,
        double p90,
        double p95,
        double p99,
        double throughput,
        long totalBytes,
        double avgBytes
) {}
