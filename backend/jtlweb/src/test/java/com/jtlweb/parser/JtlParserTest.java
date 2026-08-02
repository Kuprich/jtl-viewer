package com.jtlweb.parser;

import com.jtlweb.model.JtlSample;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JtlParserTest {

    private final JtlParser parser = new JtlParser();

    // ---- helpers ----

    private InputStream csv(String content) {
        return new ByteArrayInputStream(content.getBytes(StandardCharsets.UTF_8));
    }

    private InputStream fixture() {
        return getClass().getResourceAsStream("/results.jtl");
    }

    private List<List<JtlSample>> collect(InputStream in) throws IOException {
        List<List<JtlSample>> chunks = new ArrayList<>();
        parser.parse(in, chunks::add);
        return chunks;
    }

    private long total(List<List<JtlSample>> chunks) {
        return chunks.stream().mapToLong(List::size).sum();
    }

    // ---- tests ----

    @Test
    void fixtureParsesAllRowsAndCountsErrors() throws IOException {
        JtlParser.ParseCounts counts = parser.parse(fixture(), ignored -> {
        });
        assertEquals(1502, counts.rows());
        assertEquals(50, counts.errors());
    }

    @Test
    void fixtureEmitsAllRowsInBoundedChunks() throws IOException {
        List<List<JtlSample>> chunks = collect(fixture());
        assertEquals(1502, total(chunks));
        assertTrue(chunks.stream().allMatch(c -> c.size() <= 2000));
    }

    @Test
    void tabDelimitedFileParses() throws IOException {
        String tabJtl = "timeStamp\telapsed\tlabel\tsuccess\n"
                + "100\t5\tGET /a\ttrue\n"
                + "200\t7\tGET /b\tfalse\n";
        JtlParser.ParseCounts counts = parser.parse(csv(tabJtl), ignored -> {
        });
        assertEquals(2, counts.rows());
        assertEquals(1, counts.errors());
    }

    @Test
    void quotedCommaKeepsValueIntact() throws IOException {
        String quoted = "timeStamp,elapsed,label,success,responseMessage\n"
                + "1,10,Transaction Controller,true,\"Hello, world\"\n";
        List<List<JtlSample>> chunks = collect(csv(quoted));
        assertEquals(1, total(chunks));
        JtlSample sample = chunks.get(0).get(0);
        assertEquals("Transaction Controller", sample.getLabel());
        assertEquals("Hello, world", sample.getResponseMessage());
    }

    @Test
    void successFalseIsErrorEvenWithResponseCode200() throws IOException {
        String jtl = "timeStamp,elapsed,label,success,responseCode\n1,10,L,false,200\n";
        JtlParser.ParseCounts counts = parser.parse(csv(jtl), ignored -> {
        });
        assertEquals(1, counts.errors());
    }

    @Test
    void emptySuccessIsNotAnError() throws IOException {
        String jtl = "timeStamp,elapsed,label,success\n1,10,L,\n";
        JtlParser.ParseCounts counts = parser.parse(csv(jtl), ignored -> {
        });
        assertEquals(1, counts.rows());
        assertEquals(0, counts.errors());
    }

    @Test
    void fileWithoutHeaderThrows() {
        String jtl = "foo,bar\n1,2\n";
        assertThrows(JtlParseException.class, () -> parser.parse(csv(jtl), ignored -> {
        }));
    }

    @Test
    void emptyFileThrows() {
        assertThrows(JtlParseException.class, () -> parser.parse(csv(""), ignored -> {
        }));
    }
}