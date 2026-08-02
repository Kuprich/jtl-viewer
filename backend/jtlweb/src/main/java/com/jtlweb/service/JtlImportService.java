package com.jtlweb.service;

import com.jtlweb.model.JtlRun;
import com.jtlweb.parser.JtlParser;
import com.jtlweb.repository.JtlRunRepository;
import com.jtlweb.repository.JtlSampleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;

@Service
public class JtlImportService {
    private final JtlParser parser;
    private JtlRunRepository runRepository;
    private JtlSampleRepository sampleRepository;

    public JtlImportService(JtlParser parser, JtlRunRepository runRepository, JtlSampleRepository sampleRepository) {
        this.parser = parser;
        this.runRepository = runRepository;
        this.sampleRepository = sampleRepository;
    }

    @Transactional
    public JtlRun importJtl(String fileName, InputStream in) throws IOException {
        JtlRun run = new JtlRun();
        run.setFileName(fileName);
        JtlRun savedRun = runRepository.save(run);

        JtlParser.ParseCounts counts = parser.parse(in, chunk -> {
            chunk.forEach(sample -> sample.setRun(savedRun));
            sampleRepository.saveAll(chunk);
        });

        run.setRows(counts.rows());
        run.setErrors(counts.errors());
        return runRepository.save(run);
    }

}
