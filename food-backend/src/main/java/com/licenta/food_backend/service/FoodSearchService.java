package com.licenta.food_backend.service;

import com.licenta.food_backend.dto.FoodSearchResultDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class FoodSearchService {

    private static final String OFF_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";
    private static final String OFF_FIELDS = "product_name,product_name_en,brands,image_thumb_url,nutriments";

    private final RestTemplate restTemplate = new RestTemplate();

    public List<FoodSearchResultDto> search(String term, int pageSize) {
        if (term == null || term.trim().length() < 2) {
            return List.of();
        }

        String url = UriComponentsBuilder.fromUriString(OFF_SEARCH_URL)
            .queryParam("search_terms", term.trim())
            .queryParam("search_simple", 1)
            .queryParam("action", "process")
            .queryParam("json", 1)
            .queryParam("page_size", pageSize)
            .queryParam("fields", OFF_FIELDS)
            .build()
            .toUriString();

        try {
            OffSearchResponse response = restTemplate.getForObject(url, OffSearchResponse.class);
            if (response == null || response.getProducts() == null) {
                return List.of();
            }
            List<FoodSearchResultDto> results = new ArrayList<>();
            for (OffProduct p : response.getProducts()) {
                FoodSearchResultDto dto = mapToDto(p);
                if (dto != null) {
                    results.add(dto);
                }
            }
            return results;
        } catch (Exception ex) {

            return List.of();
        }
    }

    private FoodSearchResultDto mapToDto(OffProduct p) {
        String name = p.getProductName();
        if (name == null || name.isBlank()) {
            name = p.getProductNameEn();
        }
        if (name == null || name.isBlank()) {
            return null;
        }

        Map<String, Object> n = p.getNutriments();
        if (n == null) return null;

        Double kcal = readDouble(n, "energy-kcal_100g");
        if (kcal == null || kcal.isNaN()) return null;

        String brand = p.getBrands();
        if (brand != null) {
            String[] parts = brand.split(",");
            brand = parts.length > 0 ? parts[0].trim() : null;
            if (brand != null && brand.isBlank()) brand = null;
        }

        return FoodSearchResultDto.builder()
            .name(name.trim())
            .brand(brand)
            .caloriesPer100g((int) Math.round(kcal))
            .proteinPer100g(round1(readDouble(n, "proteins_100g")))
            .carbsPer100g(round1(readDouble(n, "carbohydrates_100g")))
            .fatsPer100g(round1(readDouble(n, "fat_100g")))
            .imageUrl(p.getImageThumbUrl())
            .build();
    }

    private Double readDouble(Map<String, Object> map, String key) {
        Object v = map.get(key);
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).doubleValue();
        try { return Double.parseDouble(v.toString()); } catch (Exception e) { return null; }
    }

    private double round1(Double v) {
        if (v == null || v.isNaN()) return 0;
        return Math.round(v * 10) / 10.0;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class OffSearchResponse {
        private List<OffProduct> products;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class OffProduct {
        @JsonProperty("product_name")
        private String productName;

        @JsonProperty("product_name_en")
        private String productNameEn;

        private String brands;

        @JsonProperty("image_thumb_url")
        private String imageThumbUrl;

        private Map<String, Object> nutriments;
    }
}
