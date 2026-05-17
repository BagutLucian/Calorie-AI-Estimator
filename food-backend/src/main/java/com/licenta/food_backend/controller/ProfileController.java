package com.licenta.food_backend.controller;

import com.licenta.food_backend.dto.ProfileDto;
import com.licenta.food_backend.entity.User;
import com.licenta.food_backend.repository.UserRepository;
import com.licenta.food_backend.service.CalorieCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin({"http://localhost:5173", "http://localhost:4200"})
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CalorieCalculator calorieCalculator;

    @GetMapping("/me")
    public ResponseEntity<ProfileDto> getMyProfile() {
        User user = currentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(toDto(user));
    }

    @PostMapping("/update")
    public ResponseEntity<ProfileDto> updateProfile(@RequestBody ProfileDto dto) {
        User user = currentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        user.setAge(dto.getAge());
        user.setWeight(dto.getWeight());
        user.setHeight(dto.getHeight());
        user.setGender(dto.getGender());
        user.setActivityLevel(dto.getActivityLevel());

        user.setGoal(dto.getGoal());
        user.setGoalRate(dto.getGoalRate());
        user.setTargetWeight(dto.getTargetWeight());

        user.setProteinPct(dto.getProteinPct());
        user.setCarbPct(dto.getCarbPct());
        user.setFatPct(dto.getFatPct());

        int dailyTarget = calorieCalculator.calculateDailyTarget(user);
        user.setDailyCalorieGoal(dailyTarget > 0 ? dailyTarget : null);

        userRepository.save(user);
        return ResponseEntity.ok(toDto(user));
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return null;
        }
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }

    private ProfileDto toDto(User user) {
        Integer kcal = user.getDailyCalorieGoal();
        Integer protein = kcal != null ? calorieCalculator.proteinGrams(kcal, user.getProteinPct()) : null;
        Integer carbs = kcal != null ? calorieCalculator.carbGrams(kcal, user.getCarbPct()) : null;
        Integer fat = kcal != null ? calorieCalculator.fatGrams(kcal, user.getFatPct()) : null;

        return ProfileDto.builder()
            .username(user.getUsername())
            .email(user.getEmail())
            .age(user.getAge())
            .weight(user.getWeight())
            .height(user.getHeight())
            .gender(user.getGender())
            .activityLevel(user.getActivityLevel())
            .goal(user.getGoal())
            .goalRate(user.getGoalRate())
            .targetWeight(user.getTargetWeight())
            .proteinPct(user.getProteinPct())
            .carbPct(user.getCarbPct())
            .fatPct(user.getFatPct())
            .dailyCalorieGoal(kcal)
            .proteinGrams(protein)
            .carbGrams(carbs)
            .fatGrams(fat)
            .build();
    }
}
