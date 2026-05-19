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

with open("food_classes.json", "r", encoding="utf-8") as f:
    class_names = json.load(f)

with open("food_calories.json", "r", encoding="utf-8") as f:
    calorie_database = json.load(f)

DEFAULT_MACROS = {'kcal': 250, 'protein': 10, 'carbs': 20, 'fats': 10}

val_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

    img_tensor = val_transforms(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(img_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)

        top_probabilities, top_indices = torch.topk(probabilities, 3, dim=1)

    results = []

    for i in range(3):
        idx = top_indices[0][i].item()
        prob = top_probabilities[0][i].item()

        food_name = class_names[idx]

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
