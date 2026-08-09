package com.jtlweb.repository;

import com.jtlweb.model.JtlSample;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface JtlSampleRepository extends JpaRepository<JtlSample, Long> {

    // Shared aggregation columns (call count, error count, latency metrics).
    String MEASURES = """
            COUNT(*)                                              AS calls,
            COUNT(*) FILTER (WHERE NOT success)               AS errors,
            MIN(elapsed)                                      AS minElapsed,
            MAX(elapsed)                                      AS maxElapsed,
            AVG(elapsed)                                      AS avgElapsed,
            PERCENTILE_CONT(0.5)  WITHIN GROUP (ORDER BY elapsed) AS p50,
            PERCENTILE_CONT(0.9)  WITHIN GROUP (ORDER BY elapsed) AS p90,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY elapsed) AS p95,
            PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY elapsed) AS p99
            """;

    String STATS_EXTRA = """
            MAX(time_stamp) - MIN(time_stamp)            AS durationMs,
            SUM(bytes)                                   AS totalBytes
            """;

    String TS_EXTRA = """
            SUM(bytes)                                   AS totalBytes,
            COALESCE(MAX(all_threads), 0)                AS threads
            """;

    String FROM_WHERE = "FROM jtl_sample WHERE run_id = :runId AND label IN (:labels) ";

    @Query(value = "SELECT label AS grp, " + MEASURES + ", " + STATS_EXTRA +
            FROM_WHERE + "GROUP BY label ORDER BY calls DESC", nativeQuery = true)
    List<GroupStatRow> findStatsByLabel(@Param("runId") long runId,
                                        @Param("labels") List<String> labels);

    @Query(value = "SELECT COALESCE(response_code, '(none)') AS grp, " + MEASURES + ", " + STATS_EXTRA +
            FROM_WHERE + "GROUP BY response_code ORDER BY calls DESC", nativeQuery = true)
    List<GroupStatRow> findStatsByResponseCode(@Param("runId") long runId,
                                               @Param("labels") List<String> labels);

    @Query(value = "SELECT COALESCE(failure_message, '(none)') AS grp, " + MEASURES + ", " + STATS_EXTRA +
            FROM_WHERE + " AND NOT success GROUP BY failure_message ORDER BY calls DESC", nativeQuery = true)
    List<GroupStatRow> findStatsByErrorMessage(@Param("runId") long runId,
                                               @Param("labels") List<String> labels);

    interface GroupStatRow {
        String getGrp();

        long getCalls();

        long getErrors();

        long getMinElapsed();

        long getMaxElapsed();

        double getAvgElapsed();

        double getP50();

        double getP90();

        double getP95();

        double getP99();

        long getDurationMs();

        long getTotalBytes();
    }

    @Query(value = """
            SELECT DISTINCT label
            FROM jtl_sample
            WHERE run_id = :runId
              AND label IS NOT NULL
            ORDER BY label
            """, nativeQuery = true)
    List<String> findDistinctLabels(@Param("runId") long runId);

    @Query(value = "SELECT (time_stamp / :bucketMs) AS bucket, " + MEASURES + ", " + TS_EXTRA +
            FROM_WHERE +
            " AND (:label IS NULL OR label = :label) GROUP BY bucket ORDER BY bucket", nativeQuery = true)
    List<TimeSeriesRow> findTimeSeries(@Param("runId") long runId,
                                       @Param("bucketMs") long bucketMs,
                                       @Param("label") String label,
                                       @Param("labels") List<String> labels);

    @Query(value = "SELECT MIN(time_stamp) AS minTs, MAX(time_stamp) AS maxTs " +
            "FROM jtl_sample WHERE run_id = :runId AND label IN (:labels)", nativeQuery = true)
    TimeRange findTimeRange(@Param("runId") long runId,
                            @Param("labels") List<String> labels);

    @Query(value = "SELECT MIN(time_stamp) AS minTs, MAX(time_stamp) AS maxTs " +
            "FROM jtl_sample WHERE run_id = :runId", nativeQuery = true)
    TimeRange findTimeRangeAll(@Param("runId") long runId);

    interface TimeSeriesRow {
        long getBucket();

        long getCalls();

        long getErrors();

        long getMinElapsed();

        long getMaxElapsed();

        double getAvgElapsed();

        double getP50();

        double getP90();

        double getP95();

        double getP99();

        long getTotalBytes();

        long getThreads();
    }

    interface TimeRange {
        Long getMinTs();

        Long getMaxTs();
    }
}