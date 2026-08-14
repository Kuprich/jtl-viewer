package com.jtlweb.service;

import com.jtlweb.dto.StatDto;
import com.jtlweb.repository.JtlRunRepository;
import com.jtlweb.repository.JtlSampleRepository;
import com.jtlweb.repository.JtlSampleRepository.GroupStatRow;
import com.jtlweb.util.Metrics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatsServiceTest {

    @Mock
    private JtlRunRepository runRepository;

    @Mock
    private JtlSampleRepository sampleRepository;

    private StatsService statsService;

    @BeforeEach
    void setUp() {
        statsService = new StatsService(runRepository, sampleRepository);
    }

    private GroupStatRow row(String group, long calls, long errors) {
        return new GroupStatRow() {
            @Override public String getGrp() { return group; }
            @Override public long getCalls() { return calls; }
            @Override public long getErrors() { return errors; }
            @Override public long getMinElapsed() { return 100; }
            @Override public long getMaxElapsed() { return 200; }
            @Override public double getAvgElapsed() { return 150; }
            @Override public double getP50() { return 150; }
            @Override public double getP90() { return 150; }
            @Override public double getP95() { return 150; }
            @Override public double getP99() { return 150; }
            @Override public long getDurationMs() { return 1000; }
            @Override public long getTotalBytes() { return 1000; }
        };
    }

    @Test
    void errorRateByResponseCodeIsShareOfTotalRequests() {
        when(runRepository.existsById(1L)).thenReturn(true);
        when(sampleRepository.findStatsByResponseCode(1L, List.of("UC01_Get_products"), null, null))
                .thenReturn(List.of(
                        row("200", 301, 0),
                        row("502", 1, 1)));

        List<StatDto> result = statsService.stats(1L, "responseCode", List.of("UC01_Get_products"), null, null);

        assertThat(result).hasSize(2);
        StatDto twoHundred = result.get(0);
        StatDto fiveOhTwo = result.get(1);
        assertThat(twoHundred.errorRate()).isEqualTo(0.0);
        assertThat(fiveOhTwo.errorRate()).isEqualTo(Metrics.round1(1.0 * 100 / 302));
    }

    @Test
    void errorRateByErrorMessageIsShareOfTotalRequests() {
        when(runRepository.existsById(1L)).thenReturn(true);
        when(sampleRepository.findStatsByErrorMessage(1L, List.of("UC01_Get_products"), null, null))
                .thenReturn(List.of(row("500 Internal Server Error", 1, 1)));
        when(sampleRepository.countSamples(1L, List.of("UC01_Get_products"), null, null)).thenReturn(302L);

        List<StatDto> result = statsService.stats(1L, "errorMessage", List.of("UC01_Get_products"), null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).errorRate()).isEqualTo(Metrics.round1(1.0 * 100 / 302));
    }

    @Test
    void errorRateByLabelIsPerGroupRate() {
        when(runRepository.existsById(1L)).thenReturn(true);
        when(sampleRepository.findStatsByLabel(1L, List.of("UC01_Get_products"), null, null))
                .thenReturn(List.of(row("UC01_Get_products", 10, 2)));

        List<StatDto> result = statsService.stats(1L, "label", List.of("UC01_Get_products"), null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).errorRate()).isEqualTo(20.0);
    }
}