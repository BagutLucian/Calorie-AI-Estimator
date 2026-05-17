package com.licenta.food_backend.controller;

import com.licenta.food_backend.dto.FoodSearchResultDto;
import com.licenta.food_backend.service.FoodSearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/foods")
@CrossOrigin({"http://localhost:5173", "http://localhost:4200"})
public class FoodSearchController {

    @Autowired
    private FoodSearchService foodSearchService;

    @GetMapping("/search")
    public ResponseEntity<List<FoodSearchResultDto>> search(
        @RequestParam String term,
        @RequestParam(required = false, defaultValue = "12") int pageSize
    ) {
        return ResponseEntity.ok(foodSearchService.search(term, pageSize));
    }
}
