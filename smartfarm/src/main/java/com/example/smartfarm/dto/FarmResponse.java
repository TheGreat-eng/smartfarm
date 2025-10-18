package com.example.smartfarm.dto;

import com.example.smartfarm.model.Farm;
import lombok.Data;

@Data
public class FarmResponse {
    private Long id;
    private String name;
    private String location;

    public FarmResponse(Farm farm) {
        this.id = farm.getId();
        this.name = farm.getName();
        this.location = farm.getLocation();
    }
}