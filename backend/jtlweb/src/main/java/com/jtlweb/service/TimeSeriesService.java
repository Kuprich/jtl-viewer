package com.jtlweb.service;

import com.jtlweb.dto.TimeSeriesPoint;
import com.jtlweb.exception.InvalidBucketMsException;
import com.jtlweb.exception.RunNotFoundException;
import com.jtlweb.repository.JtlRunRepository;
import com.jtlweb.repository.JtlSampleRepository;
import com.jtlweb.util.Metrics;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TimeSeriesService {

    private static final long DEFAULT_POINTS = 100;
    private static final long MIN_BUCKET_MS = 100;
    private static final long MAX_BUCKET_MS = 60_000;

    private final JtlRunRepository runRepository;
    private final JtlSampleRepository sampleRepository;

    public TimeSeriesService(JtlRunRepository runRepository, JtlSampleRepository sampleRepository) {
        this.runRepository = runRepository;
        this.sampleRepository = sampleRepository;
    }

    public List<TimeSeriesPoint> timeseries(long runId, Long bucketMs, String label, List<String> labels) {
        if (!runRepository.existsById(runId)) {
            throw new RunNotFoundException(runId);
        }
        if (bucketMs != null && bucketMs <= 0) {
            throw new InvalidBucketMsException(bucketMs);
        }
        if (labels == null) {
            labels = sampleRepository.findDistinctLabels(runId);
        }
        if (labels.isEmpty()) {
            return List.of();
        }

        JtlSampleRepository.TimeRange range = sampleRepository.findTimeRange(runId, labels);
        if (range.getMinTs() == null || range.getMaxTs() == null) {
            return List.of();
        }
        long minTs = range.getMinTs();
        long maxTs = range.getMaxTs();
        long bucket = bucketMs != null ? bucketMs
                : clamp((maxTs - minTs) / DEFAULT_POINTS, MIN_BUCKET_MS, MAX_BUCKET_MS);

        List<JtlSampleRepository.TimeSeriesRow> rows = sampleRepository.findTimeSeries(runId, bucket, label, labels);
        Map<Long, TimeSeriesPoint> byBucket = new HashMap<>();
        for (JtlSampleRepository.TimeSeriesRow r : rows) {
            byBucket.put(r.getBucket() * bucket, toPoint(r, bucket));
        }

        List<TimeSeriesPoint> result = new ArrayList<>();
        long start = minTs / bucket * bucket;
        long end = maxTs / bucket * bucket;
        for (long b = start; b <= end; b += bucket) {
            result.add(byBucket.getOrDefault(b, TimeSeriesPoint.empty(b)));
        }
        return result;
    }

    private static TimeSeriesPoint toPoint(JtlSampleRepository.TimeSeriesRow r, long bucketMs) {
        return new TimeSeriesPoint(
                r.getBucket() * bucketMs,
                r.getCalls(),
                r.getErrors(),
                r.getMinElapsed(),
                r.getMaxElapsed(),
                Metrics.round1(r.getAvgElapsed()),
                Metrics.round1(r.getP50()),
                Metrics.round1(r.getP90()),
                Metrics.round1(r.getP95()),
                Metrics.round1(r.getP99()),
                Metrics.round1(r.getCalls() / (bucketMs / 1000.0)),
                r.getTotalBytes(),
                r.getTotalSentBytes(),
                r.getThreads());
    }

    private static long clamp(long v, long min, long max) {
        return Math.max(min, Math.min(max, v));
    }
}