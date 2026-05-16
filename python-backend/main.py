from fastapi import FastAPI, UploadFile, File
import torch
from torchvision import transforms, models
from PIL import Image
import io
import torch.nn as nn
import json

app = FastAPI(title="Food Calorie API")

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
NUM_CLASSES = 101

# --- INCARCARE MODEL ---
model = models.resnet50(weights=None)
num_ftrs = model.fc.in_features
model.fc = nn.Sequential(
    nn.Linear(num_ftrs, 512),
    nn.ReLU(),
    nn.Dropout(0.5),
    nn.Linear(512, 256),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(256, NUM_CLASSES)
)
model.load_state_dict(torch.load("food_model_101classes_best.pth", map_location=device, weights_only=True))
model = model.to(device)
model.eval()

# --- INCARCARE CLASE SI CALORII ---
with open("food_classes.json", "r") as f:
    class_names = json.load(f)

# Aici am îmbogățit dicționarul. Fiecare cheie are acum un dicționar cu 4 valori.
calorie_database = {
    'apple_pie': {'kcal': 237, 'protein': 2.4, 'carbs': 34, 'fats': 11},
    'baby_back_ribs': {'kcal': 290, 'protein': 20, 'carbs': 5, 'fats': 22},
    'baklava': {'kcal': 360, 'protein': 6.5, 'carbs': 40, 'fats': 20},
    'beef_carpaccio': {'kcal': 120, 'protein': 21, 'carbs': 0, 'fats': 4},
    'beef_tartare': {'kcal': 180, 'protein': 20, 'carbs': 1, 'fats': 10},
    'beet_salad': {'kcal': 80, 'protein': 2, 'carbs': 10, 'fats': 4},
    'beignets': {'kcal': 350, 'protein': 5, 'carbs': 42, 'fats': 18},
    'bibimbap': {'kcal': 490, 'protein': 15, 'carbs': 65, 'fats': 18},
    'bread_pudding': {'kcal': 250, 'protein': 6, 'carbs': 35, 'fats': 10},
    'breakfast_burrito': {'kcal': 300, 'protein': 12, 'carbs': 28, 'fats': 16},
    'bruschetta': {'kcal': 150, 'protein': 3, 'carbs': 20, 'fats': 6},
    'caesar_salad': {'kcal': 180, 'protein': 5, 'carbs': 8, 'fats': 15},
    'cannoli': {'kcal': 280, 'protein': 6, 'carbs': 30, 'fats': 15},
    'caprese_salad': {'kcal': 150, 'protein': 9, 'carbs': 4, 'fats': 11},
    'carrot_cake': {'kcal': 320, 'protein': 4, 'carbs': 45, 'fats': 15},
    'ceviche': {'kcal': 140, 'protein': 18, 'carbs': 8, 'fats': 4},
    'cheesecake': {'kcal': 320, 'protein': 6, 'carbs': 25, 'fats': 22},
    'cheese_plate': {'kcal': 370, 'protein': 20, 'carbs': 2, 'fats': 30},
    'chicken_curry': {'kcal': 200, 'protein': 15, 'carbs': 8, 'fats': 12},
    'chicken_quesadilla': {'kcal': 320, 'protein': 18, 'carbs': 25, 'fats': 16},
    'chicken_wings': {'kcal': 290, 'protein': 18, 'carbs': 0, 'fats': 22},
    'chocolate_cake': {'kcal': 370, 'protein': 5, 'carbs': 45, 'fats': 18},
    'chocolate_mousse': {'kcal': 250, 'protein': 4, 'carbs': 20, 'fats': 18},
    'churros': {'kcal': 340, 'protein': 4, 'carbs': 40, 'fats': 18},
    'clam_chowder': {'kcal': 120, 'protein': 6, 'carbs': 12, 'fats': 5},
    'club_sandwich': {'kcal': 280, 'protein': 15, 'carbs': 30, 'fats': 12},
    'crab_cakes': {'kcal': 200, 'protein': 16, 'carbs': 10, 'fats': 10},
    'creme_brulee': {'kcal': 340, 'protein': 5, 'carbs': 25, 'fats': 25},
    'croque_madame': {'kcal': 350, 'protein': 18, 'carbs': 25, 'fats': 20},
    'cup_cakes': {'kcal': 330, 'protein': 3, 'carbs': 50, 'fats': 15},
    'deviled_eggs': {'kcal': 180, 'protein': 12, 'carbs': 1, 'fats': 14},
    'donuts': {'kcal': 450, 'protein': 5, 'carbs': 50, 'fats': 25},
    'dumplings': {'kcal': 240, 'protein': 10, 'carbs': 30, 'fats': 8},
    'edamame': {'kcal': 120, 'protein': 11, 'carbs': 10, 'fats': 5},
    'eggs_benedict': {'kcal': 280, 'protein': 12, 'carbs': 15, 'fats': 20},
    'escargots': {'kcal': 90, 'protein': 16, 'carbs': 2, 'fats': 1},
    'falafel': {'kcal': 330, 'protein': 13, 'carbs': 31, 'fats': 17},
    'filet_mignon': {'kcal': 240, 'protein': 26, 'carbs': 0, 'fats': 15},
    'fish_and_chips': {'kcal': 265, 'protein': 12, 'carbs': 25, 'fats': 14},
    'foie_gras': {'kcal': 460, 'protein': 11, 'carbs': 4, 'fats': 43},
    'french_fries': {'kcal': 312, 'protein': 3.4, 'carbs': 41, 'fats': 15},
    'french_onion_soup': {'kcal': 90, 'protein': 4, 'carbs': 10, 'fats': 3},
    'french_toast': {'kcal': 240, 'protein': 8, 'carbs': 30, 'fats': 10},
    'fried_calamari': {'kcal': 175, 'protein': 15, 'carbs': 15, 'fats': 6},
    'fried_rice': {'kcal': 163, 'protein': 4, 'carbs': 33, 'fats': 2},
    'frozen_yogurt': {'kcal': 127, 'protein': 4, 'carbs': 23, 'fats': 2},
    'garlic_bread': {'kcal': 350, 'protein': 8, 'carbs': 45, 'fats': 15},
    'gnocchi': {'kcal': 130, 'protein': 3, 'carbs': 28, 'fats': 1},
    'greek_salad': {'kcal': 80, 'protein': 3, 'carbs': 6, 'fats': 5},
    'grilled_cheese_sandwich': {'kcal': 290, 'protein': 12, 'carbs': 28, 'fats': 15},
    'hamburger': {'kcal': 295, 'protein': 17, 'carbs': 24, 'fats': 14}
}

# Un dicționar generic dacă modelul dă o clasă care nu e în dicționar
DEFAULT_MACROS = {'kcal': 250, 'protein': 10, 'carbs': 20, 'fats': 10}

val_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# ATENTIE AICI: Verifica cum se numeste functia ta in Java. In mod normal ar trebui sa fie /predict
# Dar in poze ai avut /analyze-image. Eu las /analyze-image sa fie compatibil cu React-ul tau
@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    
    img_tensor = val_transforms(image).unsqueeze(0).to(device)
    
    with torch.no_grad():
        outputs = model(img_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        
        # Get the TOP 3 predictions instead of just 1
        top_probabilities, top_indices = torch.topk(probabilities, 3, dim=1)
    
    results = []
    
    # Loop through the top 3 results and format them
    for i in range(3):
        idx = top_indices[0][i].item()
        prob = top_probabilities[0][i].item()
        
        food_name = class_names[idx]
        
        # Tragem obiectul nutritional (daca nu exista, il dam pe cel default)
        nutritional_data = calorie_database.get(food_name, DEFAULT_MACROS)
        
        results.append({
            "rank": i + 1,
            "food": food_name,
            "calories_per_100g": nutritional_data['kcal'],
            "protein_per_100g": nutritional_data['protein'],
            "carbs_per_100g": nutritional_data['carbs'],
            "fats_per_100g": nutritional_data['fats'],
            "confidence_percentage": round(prob * 100, 2)
        })
    
    return results