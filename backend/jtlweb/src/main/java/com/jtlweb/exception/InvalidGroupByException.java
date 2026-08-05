package com.jtlweb.exception;

public class InvalidGroupByException extends RuntimeException {
    public InvalidGroupByException(String value) {
        super("Unsupported groupBy: " + value);
    }
}
