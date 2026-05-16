package com.licenta.food_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "meals")
public class Meal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String foodName;

    @Column(nullable = false)
    private Integer caloriesPer100g;

    private Double weightInGrams;

    private Double totalCalories;

    private LocalDateTime consumedAt;
    
    @PrePersist
    protected void onCreate() {
        this.consumedAt = LocalDateTime.now();
    }

    @Column(name = "meal_date")
    private LocalDate date;

    @Column(nullable = true)
    private Double protein;

    @Column(nullable = true)
    private Double carbs;

    @Column(nullable = true)
    private Double fats;
}