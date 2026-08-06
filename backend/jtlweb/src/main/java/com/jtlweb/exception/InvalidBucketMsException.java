package com.jtlweb.exception;

public class InvalidBucketMsException extends RuntimeException {
    public InvalidBucketMsException(long value) {
        super("Invalid bucketMs: " + value + " (must be > 0)");
    }
}
