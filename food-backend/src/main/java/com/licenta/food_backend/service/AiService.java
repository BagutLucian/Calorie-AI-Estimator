package com.licenta.food_backend.service;

import com.licenta.food_backend.dto.AiPredictionDto;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

@Service
public class AiService {

    // Adresa exactă unde rulează AI-ul tău în Python (modifică /predict dacă ai alt endpoint)
    private final String PYTHON_API_URL = "http://localhost:8000/predict";

    public List<AiPredictionDto> getPredictionsFromPython(MultipartFile file) throws Exception {
        
        // RestTemplate este unealta Spring Boot care funcționează exact ca Postman
        RestTemplate restTemplate = new RestTemplate();

        // 1. Setăm tipul cererii (îi spunem Python-ului că îi trimitem un fișier de tip poză)
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        // 2. Împachetăm poza venită de la telefon/utilizator
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename(); // Python FastAPI are nevoie de numele original al fișierului
            }
        });

        // 3. Lipim header-ele și poza împreună
        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        // 4. Facem click pe "SEND" (Trimitem cererea POST către portul 8000)
        ResponseEntity<AiPredictionDto[]> response = restTemplate.postForEntity(
                PYTHON_API_URL,
                requestEntity,
                AiPredictionDto[].class
        );

        // 5. Transformăm array-ul primit de la Python într-o Listă Java și o returnăm
        return Arrays.asList(response.getBody());
    }
}