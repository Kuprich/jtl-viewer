package com.jtlweb.dto;

import java.time.Instant;

public record RunSummary(long id, String fileName, Instant uploadedAt, long rows, long errors) {
}