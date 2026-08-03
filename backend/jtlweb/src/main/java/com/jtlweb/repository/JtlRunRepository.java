package com.jtlweb.repository;

import com.jtlweb.model.JtlRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JtlRunRepository extends JpaRepository<JtlRun, Long> {
    List<JtlRun> findAllByOrderByUploadedAtDesc();
}