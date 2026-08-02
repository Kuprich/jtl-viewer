package com.jtlweb.parser;

import com.jtlweb.model.JtlSample;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class JtlParser {

    public static final int DEFAULT_CHUNK_SIZE = 2000;

    public record ParseCounts(long rows, long errors) {
    }

    // Receives parsed rows in batches so the caller can persist them.
    public interface Sink {
        void accept(List<JtlSample> chunk);
    }

    public ParseCounts parse(InputStream in, Sink sink) throws IOException {
        return parse(in, DEFAULT_CHUNK_SIZE, sink);
    }

    public ParseCounts parse(InputStream in, int chunkSize, Sink sink) throws IOException {
        long rows = 0;
        long errors = 0;
        List<JtlSample> buffer = new ArrayList<>(chunkSize);

        // PushbackInputStream lets us read the first line to sniff the delimiter,
        // then push it back so the main parser can re-read it as the header row.
        try (PushbackInputStream push = new PushbackInputStream(new BufferedInputStream(in), 8192)) {
            byte[] firstBytes = readFirstLine(push);
            if (firstBytes.length == 0) {
                throw new JtlParseException("File is empty: expected a JTL header (timeStamp,elapsed,label,...)");
            }
            String first = new String(firstBytes, StandardCharsets.UTF_8);
            String delimiter = delimiterOf(first);

            // Commons CSV handles quotes, ""-escapes and empty lines for us.
            CSVFormat format = CSVFormat.DEFAULT.builder()
                    .setDelimiter(delimiter.charAt(0))
                    .setIgnoreEmptyLines(true)
                    .setTrim(true)
                    .build();

            // Parse only the first line to extract column names and validate the header.
            List<String> columns;
            try (CSVParser headerParser = format.parse(new StringReader(first))) {
                CSVRecord headerRecord = headerParser.iterator().next();
                columns = new ArrayList<>();
                for (int i = 0; i < headerRecord.size(); i++) {
                    columns.add(headerRecord.get(i));
                }
            }
            if (!isKnownHeader(columns)) {
                throw new JtlParseException(
                        "File does not start with a JTL header. Expected columns timeStamp,elapsed,label,...");
            }
            // Column name -> index; keys lowercased for case-insensitive lookup.
            Map<String, Integer> idx = new HashMap<>();
            for (int i = 0; i < columns.size(); i++) {
                idx.put(columns.get(i).toLowerCase(Locale.ROOT), i);
            }

            // Put the first line back so the main parser sees the header row again.
            push.unread(firstBytes);

            // Main pass: stream the whole file, skip the header row, emit chunks.
            try (Reader reader = new InputStreamReader(push, StandardCharsets.UTF_8);
                 CSVParser parser = format.parse(reader)) {
                boolean firstRow = true;
                for (CSVRecord rec : parser) {
                    if (firstRow) {
                        firstRow = false;                    // header row - skip
                        continue;
                    }
                    JtlSample sample = mapRow(idx, rec);
                    if (!sample.isSuccess()) {
                        errors++;
                    }
                    buffer.add(sample);
                    rows++;
                    if (buffer.size() == chunkSize) {
                        sink.accept(buffer);
                        buffer = new ArrayList<>(chunkSize);
                    }
                }
            }
        }

        if (!buffer.isEmpty()) {
            sink.accept(buffer);
        }
        return new ParseCounts(rows, errors);
    }

    // Builds a JtlSample by column name; missing columns get defaults/null.
    private JtlSample mapRow(Map<String, Integer> idx, CSVRecord rec) {
        JtlSample s = new JtlSample();
        s.setTimeStamp(longVal(idx, rec, "timestamp", 0L));
        s.setElapsed(longVal(idx, rec, "elapsed", 0L));
        s.setLabel(strVal(idx, rec, "label", ""));
        s.setResponseCode(strVal(idx, rec, "responsecode", null));
        s.setResponseMessage(strVal(idx, rec, "responsemessage", null));
        s.setThreadName(strVal(idx, rec, "threadname", null));
        s.setDataType(strVal(idx, rec, "datatype", null));
        s.setSuccess(isSuccess(strVal(idx, rec, "success", "")));
        s.setFailureMessage(strVal(idx, rec, "failuremessage", null));
        s.setBytes(longVal(idx, rec, "bytes", 0L));
        s.setSentBytes(optionalLongVal(idx, rec, "sentbytes"));
        s.setGrpThreads(optionalIntVal(idx, rec, "grpthreads"));
        s.setAllThreads(optionalIntVal(idx, rec, "allthreads"));
        s.setUrl(strVal(idx, rec, "url", null));
        s.setLatency(longVal(idx, rec, "latency", 0L));
        s.setIdleTime(longVal(idx, rec, "idletime", 0L));
        s.setConnect(longVal(idx, rec, "connect", 0L));
        return s;
    }

    // Reads the first line (including its trailing newline) as bytes.
    private byte[] readFirstLine(PushbackInputStream in) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        int b;
        while ((b = in.read()) != -1) {
            out.write(b);
            if (b == '\n') {
                break;
            }
        }
        return out.toByteArray();
    }

    // Delimiter: tab if present, otherwise comma.
    private String delimiterOf(String line) {
        return line.indexOf('\t') >= 0 ? "\t" : ",";
    }

    // Does the header contain at least one known JMeter column name?
    private boolean isKnownHeader(List<String> columns) {
        for (String column : columns) {
            String c = column.trim().toLowerCase(Locale.ROOT);
            if (c.equals("timestamp") || c.equals("elapsed") || c.equals("label") || c.equals("success")) {
                return true;
            }
        }
        return false;
    }

    // Success = empty / "true" / "1". Everything else ("false") is an error.
    private boolean isSuccess(String raw) {
        return raw.isEmpty() || raw.equals("true") || raw.equals("1");
    }

    private String strVal(Map<String, Integer> idx, CSVRecord rec, String col, String def) {
        Integer i = idx.get(col);
        if (i == null || i >= rec.size()) {
            return def;
        }
        String v = rec.get(i);
        return v == null || v.isEmpty() ? def : v;
    }

    private long longVal(Map<String, Integer> idx, CSVRecord rec, String col, long def) {
        Integer i = idx.get(col);
        if (i == null || i >= rec.size()) {
            return def;
        }
        try {
            return Long.parseLong(rec.get(i));
        } catch (NumberFormatException e) {
            return def;
        }
    }

    private Long optionalLongVal(Map<String, Integer> idx, CSVRecord rec, String col) {
        Integer i = idx.get(col);
        if (i == null || i >= rec.size()) {
            return null;
        }
        try {
            return Long.parseLong(rec.get(i));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer optionalIntVal(Map<String, Integer> idx, CSVRecord rec, String col) {
        Integer i = idx.get(col);
        if (i == null || i >= rec.size()) {
            return null;
        }
        try {
            return Integer.parseInt(rec.get(i));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}