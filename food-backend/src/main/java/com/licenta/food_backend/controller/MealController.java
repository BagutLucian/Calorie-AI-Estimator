package com.licenta.food_backend.controller;

import com.licenta.food_backend.dto.AiPredictionDto;
import com.licenta.food_backend.entity.Meal;
import com.licenta.food_backend.entity.User;
import com.licenta.food_backend.repository.MealRepository;
import com.licenta.food_backend.repository.UserRepository;
import com.licenta.food_backend.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/meals")
@CrossOrigin({"http://localhost:5173", "http://localhost:4200"})
public class MealController {

    @Autowired
    private AiService aiService;

    @Autowired
    private MealRepository mealRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping(value = "/analyze-image", consumes = "multipart/form-data")
    public ResponseEntity<List<AiPredictionDto>> analyzeFoodImage(@RequestParam("image") MultipartFile image) {
        try {
            List<AiPredictionDto> predictions = aiService.getPredictionsFromPython(image);
            return new ResponseEntity<>(predictions, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/my-history")
    public ResponseEntity<?> getMyHistory(@RequestParam String date) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);

        if (user == null) return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);

        LocalDate localDate = LocalDate.parse(date);
        List<Meal> meals = mealRepository.findByUserIdAndDate(user.getId(), localDate);

        return new ResponseEntity<>(meals, HttpStatus.OK);
    }

    @GetMapping("/my-history/week")
    public ResponseEntity<?> getWeeklyHistory() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);

        if (user == null) return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(6);

        List<Meal> meals = mealRepository.findByUserIdAndDateBetween(user.getId(), startDate, endDate);

        return new ResponseEntity<>(meals, HttpStatus.OK);
    }

    @GetMapping("/my-history/range")
    public ResponseEntity<?> getHistoryRange(@RequestParam String start, @RequestParam String end) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);

        if (user == null) return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);

        LocalDate startDate = LocalDate.parse(start);
        LocalDate endDate = LocalDate.parse(end);

        List<Meal> meals = mealRepository.findByUserIdAndDateBetween(user.getId(), startDate, endDate);

        return new ResponseEntity<>(meals, HttpStatus.OK);
    }

    @PostMapping("/save")
    public ResponseEntity<String> saveMeal(@RequestBody Meal mealInput) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);

        if (user == null) return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);

        Meal meal = new Meal();
        meal.setFoodName(mealInput.getFoodName());
        meal.setCaloriesPer100g(mealInput.getCaloriesPer100g());
        meal.setWeightInGrams(mealInput.getWeightInGrams());

        double weight = mealInput.getWeightInGrams() != null ? mealInput.getWeightInGrams() : 0.0;
        meal.setProtein(scaleMacro(mealInput.getProtein(), weight));
        meal.setCarbs(scaleMacro(mealInput.getCarbs(), weight));
        meal.setFats(scaleMacro(mealInput.getFats(), weight));

        double total = (mealInput.getCaloriesPer100g() * weight) / 100.0;
        meal.setTotalCalories(total);

        if (mealInput.getDate() != null) {
            meal.setDate(mealInput.getDate());
        } else {
            meal.setDate(LocalDate.now());
        }

        meal.setUser(user);
        mealRepository.save(meal);

        return new ResponseEntity<>("Masa salvată cu succes!", HttpStatus.CREATED);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteMeal(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username).orElse(null);
        Meal meal = mealRepository.findById(id).orElse(null);

        if (user == null || meal == null || !meal.getUser().getId().equals(user.getId())) {
            return new ResponseEntity<>("Unauthorized or Not Found", HttpStatus.FORBIDDEN);
        }

        mealRepository.delete(meal);
        return new ResponseEntity<>("Meal deleted successfully!", HttpStatus.OK);
    }

    @PutMapping("/edit/{id}")
    public ResponseEntity<String> editMeal(@PathVariable Long id, @RequestBody Meal mealInput) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username).orElse(null);
        Meal existingMeal = mealRepository.findById(id).orElse(null);

        if (user == null || existingMeal == null || !existingMeal.getUser().getId().equals(user.getId())) {
            return new ResponseEntity<>("Unauthorized or Not Found", HttpStatus.FORBIDDEN);
        }

        existingMeal.setFoodName(mealInput.getFoodName());
        existingMeal.setCaloriesPer100g(mealInput.getCaloriesPer100g());
        existingMeal.setWeightInGrams(mealInput.getWeightInGrams());

        double weight = mealInput.getWeightInGrams() != null ? mealInput.getWeightInGrams() : 0.0;
        existingMeal.setProtein(scaleMacro(mealInput.getProtein(), weight));
        existingMeal.setCarbs(scaleMacro(mealInput.getCarbs(), weight));
        existingMeal.setFats(scaleMacro(mealInput.getFats(), weight));

        if (mealInput.getWeightInGrams() != null && mealInput.getCaloriesPer100g() != null) {
            double total = (mealInput.getCaloriesPer100g() * weight) / 100.0;
            existingMeal.setTotalCalories(total);
        }

        mealRepository.save(existingMeal);
        return new ResponseEntity<>("Meal updated successfully!", HttpStatus.OK);
    }

    private double scaleMacro(Double perHundred, double weightGrams) {
        if (perHundred == null) return 0.0;
        return (perHundred * weightGrams) / 100.0;
    }
}
