package com.licenta.food_backend.dto;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@JsonIgnoreProperties(ignoreUnknown = true) // <--- MAGIA: Ignoră câmpurile extra (cum ar fi 'rank')
public class AiPredictionDto {
    
    private String food;
    
    @JsonProperty("calories_per_100g")
    private Integer calories;

    @JsonProperty("confidence_percentage")
    private Double confidence;
    
    @JsonProperty("protein_per_100g")
    private Double protein;

    @JsonProperty("carbs_per_100g")
    private Double carbs;

    @JsonProperty("fats_per_100g")
    private Double fats;
}