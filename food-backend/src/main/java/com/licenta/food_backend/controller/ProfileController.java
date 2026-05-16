package com.licenta.food_backend.controller;

import com.licenta.food_backend.entity.User;
import com.licenta.food_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin("http://localhost:5173")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/update")
    public ResponseEntity<String> updateProfile(@RequestBody User profileData) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        user.setAge(profileData.getAge());
        user.setWeight(profileData.getWeight());
        user.setHeight(profileData.getHeight());
        user.setGender(profileData.getGender());
        user.setActivityLevel(profileData.getActivityLevel());
        user.setDailyCalorieGoal(profileData.getDailyCalorieGoal());

        userRepository.save(user);
        return ResponseEntity.ok("Profil actualizat!");
    }
    
    @GetMapping("/me")
    public ResponseEntity<User> getMyProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        return ResponseEntity.ok(user);
    }
}