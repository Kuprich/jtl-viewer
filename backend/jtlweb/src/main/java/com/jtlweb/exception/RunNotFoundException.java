package com.jtlweb.exception;

public class RunNotFoundException extends RuntimeException {
    public RunNotFoundException(long id) {
        super("Run " + id + " not found");
    }
}
