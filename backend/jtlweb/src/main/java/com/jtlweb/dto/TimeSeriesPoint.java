package com.jtlweb.dto;

public record TimeSeriesPoint(
        long bucket,
        long calls,
        long errors,
        long min,
        long max,
        double avg,
        double p50,
        double p90,
        double p95,
        double p99,
        double throughput,
        long totalBytes
) {}