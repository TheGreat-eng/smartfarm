package com.example.smartfarm.controller;

import com.example.smartfarm.dto.RuleRequest;
import com.example.smartfarm.dto.RuleResponse;
import com.example.smartfarm.model.Rule;
import com.example.smartfarm.security.services.UserDetailsImpl;
import com.example.smartfarm.service.RuleService;
import jakarta.validation.Valid;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/farms/{farmId}/rules")
public class RuleController {

    @Autowired
    private RuleService ruleService;

    @PostMapping
    public ResponseEntity<?> createRule(
            @PathVariable Long farmId,
            @Valid @RequestBody RuleRequest ruleRequest,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            Rule newRule = ruleService.createRule(farmId, ruleRequest, userDetails.getId());
            return ResponseEntity.ok(new RuleResponse(newRule));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getRulesByFarm(
            @PathVariable Long farmId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            List<RuleResponse> rules = ruleService.getRulesByFarm(farmId, userDetails.getId())
                    .stream()
                    .map(RuleResponse::new)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(rules);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }
}