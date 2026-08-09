package com.jtlweb.util;

public final class Metrics {

    private Metrics() {
    }

    public static double round1(double v) {
        return Math.round(v * 10) / 10.0;
    }
}