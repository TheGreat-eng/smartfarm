package com.example.smartfarm.repository;

import java.util.*;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.smartfarm.model.Rule;

public interface RuleRepository extends JpaRepository<Rule, Long> {

    List<Rule> findByEnabled(boolean enabled);
}
