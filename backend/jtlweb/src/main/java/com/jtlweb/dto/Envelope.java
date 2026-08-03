package com.jtlweb.dto;

import java.util.List;

public record Envelope<T>(List<T> items, long total) {}

