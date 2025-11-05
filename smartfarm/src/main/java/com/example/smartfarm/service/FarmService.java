package com.example.smartfarm.service;

import com.example.smartfarm.dto.FarmRequest;
import com.example.smartfarm.model.Farm;
import com.example.smartfarm.model.User;
import com.example.smartfarm.repository.FarmRepository;
import com.example.smartfarm.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class FarmService {
    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Farm> getFarmsByUserId(Long userId) {
        return farmRepository.findByUserId(userId);
    }

    public Farm createFarm(FarmRequest farmRequest, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        Farm farm = new Farm();
        farm.setName(farmRequest.getName());
        farm.setLocation(farmRequest.getLocation());
        farm.setUser(user);

        return farmRepository.save(farm);
    }

    public Farm updateFarm(Long farmId, FarmRequest farmRequest, Long userId) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new RuntimeException("Farm not found"));
        if (!farm.getUser().getId().equals(userId)) {
            throw new SecurityException("User not authorized to update this farm");
        }
        farm.setName(farmRequest.getName());
        farm.setLocation(farmRequest.getLocation());
        return farmRepository.save(farm);
    }

    public void deleteFarm(Long farmId, Long userId) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new RuntimeException("Farm not found"));
        if (!farm.getUser().getId().equals(userId)) {
            throw new SecurityException("User not authorized to delete this farm");
        }
        farmRepository.delete(farm);
    }
}