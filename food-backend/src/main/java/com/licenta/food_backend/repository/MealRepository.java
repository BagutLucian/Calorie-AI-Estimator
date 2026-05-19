package com.licenta.food_backend.repository;

import com.licenta.food_backend.entity.Meal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MealRepository extends JpaRepository<Meal, Long> {

    List<Meal> findByUserId(Long userId);
    List<Meal> findByUserIdAndDate(Long userId, LocalDate date);
    List<Meal> findByUserIdAndDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
}
