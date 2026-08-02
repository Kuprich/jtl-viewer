package com.jtlweb.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "jtl_sample",
        indexes = {
                @Index(name = "idx_sample_run_label", columnList = "run_id, label"),
                @Index(name = "idx_sample_run_success", columnList = "run_id, success"),
                @Index(name = "idx_sample_run_response_code", columnList = "run_id, response_code"),
                @Index(name = "idx_sample_run_thread_name", columnList = "run_id, thread_name"),
                @Index(name = "idx_sample_run_time_stamp", columnList = "run_id, time_stamp")
        })
@Getter
@Setter
public class JtlSample {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id", nullable = false)
    private JtlRun run;

    @Column(name = "time_stamp", nullable = false)
    private long timeStamp;

    @Column(nullable = false)
    private long elapsed;

    @Column(nullable = false)
    private String label;

    @Column(name = "response_code")
    private String responseCode;

    @Column(name = "response_message")
    private String responseMessage;

    @Column(name = "thread_name")
    private String threadName;

    @Column(name = "data_type")
    private String dataType;

    @Column(nullable = false)
    private boolean success;

    @Column(name = "failure_message")
    private String failureMessage;

    @Column(nullable = false)
    private long bytes;

    @Column(name = "sent_bytes")
    private Long sentBytes;

    @Column(name = "grp_threads")
    private Integer grpThreads;

    @Column(name = "all_threads")
    private Integer allThreads;

    @Column(name = "url")
    private String url;

    @Column(nullable = false)
    private long latency;

    @Column(name = "idle_time")
    private long idleTime;

    @Column(nullable = false)
    private long connect;
}