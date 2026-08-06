package com.jtlweb.controller;

import com.jtlweb.exception.InvalidBucketMsException;
import com.jtlweb.exception.RunNotFoundException;
import com.jtlweb.exception.JtlParseException;
import com.jtlweb.exception.InvalidGroupByException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    // Broken / empty / non-JTL file -> 400 with the reason.
    @ExceptionHandler(JtlParseException.class)
    public ResponseEntity<Map<String, String>> handleParse(JtlParseException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    // Request without the "file" part -> 400.
    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<Map<String, String>> handleMissingPart(MissingServletRequestPartException e) {
        return ResponseEntity.badRequest().body(Map.of("error", "Missing file part"));
    }

    // Oversized upload and similar multipart failures -> 400.
    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<Map<String, String>> handleMultipart(MultipartException e) {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid multipart request"));
    }

    // Anything else -> 500, without leaking internals.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal server error"));
    }

    @ExceptionHandler(RunNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(RunNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    // Unknown / invalid groupBy value for /stats -> 400.
    @ExceptionHandler(InvalidGroupByException.class)
    public ResponseEntity<Map<String, String>> handleInvalidGroupBy(InvalidGroupByException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    // bucketMs <= 0 for /timeseries -> 400.
    @ExceptionHandler(InvalidBucketMsException.class)
    public ResponseEntity<Map<String, String>> handleInvalidBucketMs(InvalidBucketMsException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}