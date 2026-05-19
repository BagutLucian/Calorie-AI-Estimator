package com.licenta.food_backend.service;

import com.licenta.food_backend.entity.Gender;
import com.licenta.food_backend.entity.Goal;
import com.licenta.food_backend.entity.GoalRate;
import com.licenta.food_backend.entity.User;
import org.springframework.stereotype.Service;

@Service
public class CalorieCalculator {

    private static final int FLOOR_MALE = 1500;
    private static final int FLOOR_FEMALE = 1200;

    public boolean hasRequiredInputs(User user) {
        return user.getAge() != null
            && user.getWeight() != null
            && user.getHeight() != null
            && user.getGender() != null
            && user.getActivityLevel() != null
            && user.getGoal() != null;
    }

    public int calculateDailyTarget(User user) {
        if (!hasRequiredInputs(user)) {
            return 0;
        }

        double bmr = calculateBmr(user.getGender(), user.getWeight(), user.getHeight(), user.getAge());
        double tdee = bmr * user.getActivityLevel();
        double target = tdee + goalAdjustment(user.getGoal(), user.getGoalRate());

        int floor = user.getGender() == Gender.FEMALE ? FLOOR_FEMALE : FLOOR_MALE;
        return (int) Math.round(Math.max(target, floor));
    }

    public int proteinGrams(int dailyCalories, Integer proteinPct) {
        if (proteinPct == null) return 0;
        return (int) Math.round((dailyCalories * proteinPct / 100.0) / 4.0);
    }

    public int carbGrams(int dailyCalories, Integer carbPct) {
        if (carbPct == null) return 0;
        return (int) Math.round((dailyCalories * carbPct / 100.0) / 4.0);
    }

    public int fatGrams(int dailyCalories, Integer fatPct) {
        if (fatPct == null) return 0;
        return (int) Math.round((dailyCalories * fatPct / 100.0) / 9.0);
    }

    private double calculateBmr(Gender gender, double weightKg, double heightCm, int age) {
        double base = 10.0 * weightKg + 6.25 * heightCm - 5.0 * age;
        return switch (gender) {
            case FEMALE -> base - 161;
            case MALE, OTHER -> base + 5;
        };
    }

    private int goalAdjustment(Goal goal, GoalRate rate) {
        if (goal == Goal.MAINTAIN || rate == null) {
            return 0;
        }

        int magnitude = switch (rate) {
            case LIGHT -> 250;
            case MODERATE -> 500;
            case AGGRESSIVE -> 750;
        };

        return switch (goal) {
            case LOSE -> -magnitude;
            case GAIN, MUSCLE_GAIN -> magnitude;
            case MAINTAIN -> 0;
        };
    }
}
