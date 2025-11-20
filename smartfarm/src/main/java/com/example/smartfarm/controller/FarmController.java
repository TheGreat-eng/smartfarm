package com.example.smartfarm.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.smartfarm.annotation.LogActivity;
import com.example.smartfarm.dto.FarmRequest;
import com.example.smartfarm.dto.FarmResponse;
import com.example.smartfarm.model.Farm;
import com.example.smartfarm.security.services.UserDetailsImpl;
import com.example.smartfarm.service.FarmService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/farms")
public class FarmController {
    @Autowired
    private FarmService farmService;

    // LẤY DANH SÁCH NÔNG TRẠI CỦA NGƯỜI DÙNG
    @GetMapping
    public ResponseEntity<List<FarmResponse>> getUserFarms(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<FarmResponse> farms = farmService.getFarmsByUserId(userDetails.getId())
                .stream()
                .map(FarmResponse::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(farms);
    }

    // TẠO NÔNG TRẠI MỚI
    @PostMapping
    @LogActivity(value = "TẠO MỚI", entity = "NÔNG TRẠI")
    public ResponseEntity<FarmResponse> createFarm(@Valid @RequestBody FarmRequest farmRequest,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        FarmResponse newFarm = new FarmResponse(farmService.createFarm(farmRequest, userDetails.getId()));
        return ResponseEntity.ok(newFarm);
    }

    @PutMapping("/{farmId}")
    @LogActivity(value = "CẬP NHẬT", entity = "NÔNG TRẠI")
    public ResponseEntity<FarmResponse> updateFarm(@PathVariable Long farmId,
            @Valid @RequestBody FarmRequest farmRequest,
            @AuthenticationPrincipal UserDetailsImpl userDetailsImpl) {
        Farm updatedFarm = farmService.updateFarm(farmId, farmRequest, userDetailsImpl.getId());
        return ResponseEntity.ok(new FarmResponse(updatedFarm));
    }

    @DeleteMapping("/{farmId}")
    @LogActivity(value = "XÓA", entity = "NÔNG TRẠI")   
    public ResponseEntity<Void> deleteFarm(@PathVariable Long farmId,
            @AuthenticationPrincipal UserDetailsImpl userDetailsImpl) {
        farmService.deleteFarm(farmId, userDetailsImpl.getId());
        return ResponseEntity.noContent().build();
    }
}