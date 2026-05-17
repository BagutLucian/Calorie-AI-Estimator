package com.licenta.food_backend.dto;

import com.licenta.food_backend.entity.Gender;
import com.licenta.food_backend.entity.Goal;
import com.licenta.food_backend.entity.GoalRate;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileDto {
    private String username;
    private String email;

    private Integer age;
    private Double weight;
    private Double height;
    private Gender gender;
    private Double activityLevel;

    private Goal goal;
    private GoalRate goalRate;
    private Double targetWeight;

    private Integer proteinPct;
    private Integer carbPct;
    private Integer fatPct;

    private Integer dailyCalorieGoal;
    private Integer proteinGrams;
    private Integer carbGrams;
    private Integer fatGrams;
}
