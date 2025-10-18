package com.example.smartfarm.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.smartfarm.model.Farm;

public interface FarmRepository extends JpaRepository<Farm, Long> {

    List<Farm> findByUserId(Long userId);

}
