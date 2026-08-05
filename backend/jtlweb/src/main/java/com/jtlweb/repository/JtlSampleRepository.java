package com.jtlweb.repository;

import com.jtlweb.model.JtlSample;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface JtlSampleRepository extends JpaRepository<JtlSample, Long> {

    @Query(value = """
            SELECT label                                        AS grp,
                   COUNT(*)                                     AS calls,
                   COUNT(*) FILTER (WHERE NOT success)          AS errors,
                   MIN(elapsed)                                 AS minElapsed,
                   MAX(elapsed)                                 AS maxElapsed,
                   AVG(elapsed)                                 AS avgElapsed,
                   PERCENTILE_CONT(0.5)  WITHIN GROUP (ORDER BY elapsed) AS p50,
                   PERCENTILE_CONT(0.9)  WITHIN GROUP (ORDER BY elapsed) AS p90,
                   PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY elapsed) AS p95,
                   PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY elapsed) AS p99,
                   MAX(time_stamp) - MIN(time_stamp)            AS durationMs,
                   SUM(bytes)                                   AS totalBytes
            FROM jtl_sample
            WHERE run_id = :runId
            GROUP BY label
            ORDER BY calls DESC
            """, nativeQuery = true)
    List<GroupStatRow> findStatsByLabel(@Param("runId") long runId);

    @Query(value = """
            SELECT thread_name                                  AS grp,
                   COUNT(*)                                     AS calls,
                   COUNT(*) FILTER (WHERE NOT success)          AS errors,
                   MIN(elapsed)                                 AS minElapsed,
                   MAX(elapsed)                                 AS maxElapsed,
                   AVG(elapsed)                                 AS avgElapsed,
                   PERCENTILE_CONT(0.5)  WITHIN GROUP (ORDER BY elapsed) AS p50,
                   PERCENTILE_CONT(0.9)  WITHIN GROUP (ORDER BY elapsed) AS p90,
                   PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY elapsed) AS p95,
                   PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY elapsed) AS p99,
                   MAX(time_stamp) - MIN(time_stamp)            AS durationMs,
                   SUM(bytes)                                   AS totalBytes
            FROM jtl_sample
            WHERE run_id = :runId
            GROUP BY thread_name
            ORDER BY calls DESC
            """, nativeQuery = true)
    List<GroupStatRow> findStatsByThreadName(@Param("runId") long runId);

    @Query(value = """
            SELECT COALESCE(response_code, '(none)')                AS grp,
                   COUNT(*)                                         AS calls,
                   COUNT(*) FILTER (WHERE NOT success)              AS errors,
                   MIN(elapsed)                                 AS minElapsed,
                   MAX(elapsed)                                 AS maxElapsed,
                   AVG(elapsed)                                 AS avgElapsed,
                   PERCENTILE_CONT(0.5)  WITHIN GROUP (ORDER BY elapsed) AS p50,
                   PERCENTILE_CONT(0.9)  WITHIN GROUP (ORDER BY elapsed) AS p90,
                   PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY elapsed) AS p95,
                   PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY elapsed) AS p99,
                   MAX(time_stamp) - MIN(time_stamp)            AS durationMs,
                   SUM(bytes)                                   AS totalBytes
            FROM jtl_sample
            WHERE run_id = :runId
            GROUP BY response_code
            ORDER BY calls DESC
            """, nativeQuery = true)
    List<GroupStatRow> findStatsByResponseCode(@Param("runId") long runId);

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
}
