package com.licenta.food_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Column(nullable = true)
    private Integer age;

    @Column(nullable = true)
    private Double weight;

    @Column(nullable = true)
    private Double height;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private Gender gender;

    @Column(nullable = true)
    private Double activityLevel;

    @Column(nullable = true)
    private Integer dailyCalorieGoal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private Goal goal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private GoalRate goalRate;

    @Column(nullable = true)
    private Double targetWeight;

    @Column(nullable = true)
    private Integer proteinPct;

    @Column(nullable = true)
    private Integer carbPct;

    @Column(nullable = true)
    private Integer fatPct;
}
