package com.jtlweb.service;

import com.jtlweb.dto.StatDto;
import com.jtlweb.exception.InvalidGroupByException;
import com.jtlweb.exception.RunNotFoundException;
import com.jtlweb.repository.JtlRunRepository;
import com.jtlweb.repository.JtlSampleRepository;
import com.jtlweb.repository.JtlSampleRepository.GroupStatRow;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class StatsService {

    private static final Set<String> VALID_GROUP_BY = Set.of("label", "threadName", "responseCode");

    private final JtlRunRepository runRepository;
    private final JtlSampleRepository sampleRepository;

    public StatsService(JtlRunRepository runRepository, JtlSampleRepository sampleRepository) {
        this.runRepository = runRepository;
        this.sampleRepository = sampleRepository;
    }

    public List<StatDto> stats(long runId, String groupBy) {
        if (!runRepository.existsById(runId)) {
            throw new RunNotFoundException(runId);
        }
        if (groupBy == null || !VALID_GROUP_BY.contains(groupBy)) {
            throw new InvalidGroupByException(groupBy);
        }

        List<GroupStatRow> rows = switch (groupBy) {
            case "threadName"   -> sampleRepository.findStatsByThreadName(runId);
            case "responseCode" -> sampleRepository.findStatsByResponseCode(runId);
            default             -> sampleRepository.findStatsByLabel(runId);
        };
        return rows.stream().map(StatsService::toStat).toList();
    }

    private static StatDto toStat(GroupStatRow r) {
        long calls = r.getCalls();
        double durationSec = r.getDurationMs() / 1000.0;
        double throughput = durationSec > 0 ? calls / durationSec : 0;
        return new StatDto(
                r.getGrp(),
                calls,
                r.getErrors(),
                round1(calls == 0 ? 0 : r.getErrors() * 100.0 / calls),
                r.getMinElapsed(),
                r.getMaxElapsed(),
                round1(r.getAvgElapsed()),
                round1(r.getP50()),
                round1(r.getP90()),
                round1(r.getP95()),
                round1(r.getP99()),
                round1(throughput),
                r.getTotalBytes(),
                round1(calls == 0 ? 0 : r.getTotalBytes() / (double) calls));
    }

    private static double round1(double v) {
        return Math.round(v * 10) / 10.0;
    }
}
