package com.example.smartfarm.controller;

import com.example.smartfarm.dto.FarmRequest;
import com.example.smartfarm.dto.FarmResponse;
import com.example.smartfarm.model.Farm;
import com.example.smartfarm.security.services.UserDetailsImpl;
import com.example.smartfarm.service.FarmService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

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
    public ResponseEntity<FarmResponse> createFarm(@Valid @RequestBody FarmRequest farmRequest,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        FarmResponse newFarm = new FarmResponse(farmService.createFarm(farmRequest, userDetails.getId()));
        return ResponseEntity.ok(newFarm);
    }

    @PutMapping("/{farmId}")
    public ResponseEntity<FarmResponse> updateFarm(@PathVariable Long farmId,
            @Valid @RequestBody FarmRequest farmRequest,
            @AuthenticationPrincipal UserDetailsImpl userDetailsImpl) {
        Farm updatedFarm = farmService.updateFarm(farmId, farmRequest, userDetailsImpl.getId());
        return ResponseEntity.ok(new FarmResponse(updatedFarm));
    }

    @DeleteMapping("/{farmId}")
    public ResponseEntity<Void> deleteFarm(@PathVariable Long farmId,
            @AuthenticationPrincipal UserDetailsImpl userDetailsImpl) {
        farmService.deleteFarm(farmId, userDetailsImpl.getId());
        return ResponseEntity.noContent().build();
    }
}