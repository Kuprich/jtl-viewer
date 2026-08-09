package com.jtlweb.service;

import com.jtlweb.dto.StatDto;
import com.jtlweb.exception.InvalidGroupByException;
import com.jtlweb.exception.RunNotFoundException;
import com.jtlweb.repository.JtlRunRepository;
import com.jtlweb.repository.JtlSampleRepository;
import com.jtlweb.repository.JtlSampleRepository.GroupStatRow;
import com.jtlweb.util.Metrics;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class StatsService {

    private static final Set<String> VALID_GROUP_BY = Set.of("label", "responseCode", "errorMessage");

    private final JtlRunRepository runRepository;
    private final JtlSampleRepository sampleRepository;

    public StatsService(JtlRunRepository runRepository, JtlSampleRepository sampleRepository) {
        this.runRepository = runRepository;
        this.sampleRepository = sampleRepository;
    }

    public List<StatDto> stats(long runId, String groupBy, List<String> labels, Long fromMs, Long toMs) {
        if (!runRepository.existsById(runId)) {
            throw new RunNotFoundException(runId);
        }
        if (groupBy == null || !VALID_GROUP_BY.contains(groupBy)) {
            throw new InvalidGroupByException(groupBy);
        }
        if (labels == null) {
            labels = sampleRepository.findDistinctLabels(runId);
        }
        if (labels.isEmpty()) {
            return List.of();
        }

        List<GroupStatRow> rows = switch (groupBy) {
            case "responseCode" -> sampleRepository.findStatsByResponseCode(runId, labels, fromMs, toMs);
            case "errorMessage" -> sampleRepository.findStatsByErrorMessage(runId, labels, fromMs, toMs);
            default             -> sampleRepository.findStatsByLabel(runId, labels, fromMs, toMs);
        };
        return rows.stream().map(StatsService::toStat).toList();
    }

    public List<String> labels(long runId) {
        if (!runRepository.existsById(runId)) {
            throw new RunNotFoundException(runId);
        }
        return sampleRepository.findDistinctLabels(runId);
    }

    private static StatDto toStat(GroupStatRow r) {
        long calls = r.getCalls();
        double durationSec = r.getDurationMs() / 1000.0;
        double throughput = durationSec > 0 ? calls / durationSec : 0;
        return new StatDto(
                r.getGrp(),
                calls,
                r.getErrors(),
                Metrics.round1(calls == 0 ? 0 : r.getErrors() * 100.0 / calls),
                r.getMinElapsed(),
                r.getMaxElapsed(),
                Metrics.round1(r.getAvgElapsed()),
                Metrics.round1(r.getP50()),
                Metrics.round1(r.getP90()),
                Metrics.round1(r.getP95()),
                Metrics.round1(r.getP99()),
                Metrics.round1(throughput),
                r.getTotalBytes(),
                Metrics.round1(calls == 0 ? 0 : r.getTotalBytes() / (double) calls));
    }
}
