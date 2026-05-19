import json
import time
import sys
import urllib.parse
import urllib.request

CLASSES_FILE = "food_classes.json"
OUTPUT_FILE = "food_calories.json"
OFF_URL = "https://world.openfoodfacts.org/cgi/search.pl"
REQUEST_DELAY_SEC = 0.4

DEFAULT_MACROS = {"kcal": 250, "protein": 10, "carbs": 20, "fats": 10}

EXISTING = {
    "apple_pie": {"kcal": 237, "protein": 2.4, "carbs": 34, "fats": 11},
    "baby_back_ribs": {"kcal": 290, "protein": 20, "carbs": 5, "fats": 22},
    "baklava": {"kcal": 360, "protein": 6.5, "carbs": 40, "fats": 20},
    "beef_carpaccio": {"kcal": 120, "protein": 21, "carbs": 0, "fats": 4},
    "beef_tartare": {"kcal": 180, "protein": 20, "carbs": 1, "fats": 10},
    "beet_salad": {"kcal": 80, "protein": 2, "carbs": 10, "fats": 4},
    "beignets": {"kcal": 350, "protein": 5, "carbs": 42, "fats": 18},
    "bibimbap": {"kcal": 490, "protein": 15, "carbs": 65, "fats": 18},
    "bread_pudding": {"kcal": 250, "protein": 6, "carbs": 35, "fats": 10},
    "breakfast_burrito": {"kcal": 300, "protein": 12, "carbs": 28, "fats": 16},
    "bruschetta": {"kcal": 150, "protein": 3, "carbs": 20, "fats": 6},
    "caesar_salad": {"kcal": 180, "protein": 5, "carbs": 8, "fats": 15},
    "cannoli": {"kcal": 280, "protein": 6, "carbs": 30, "fats": 15},
    "caprese_salad": {"kcal": 150, "protein": 9, "carbs": 4, "fats": 11},
    "carrot_cake": {"kcal": 320, "protein": 4, "carbs": 45, "fats": 15},
    "ceviche": {"kcal": 140, "protein": 18, "carbs": 8, "fats": 4},
    "cheesecake": {"kcal": 320, "protein": 6, "carbs": 25, "fats": 22},
    "cheese_plate": {"kcal": 370, "protein": 20, "carbs": 2, "fats": 30},
    "chicken_curry": {"kcal": 200, "protein": 15, "carbs": 8, "fats": 12},
    "chicken_quesadilla": {"kcal": 320, "protein": 18, "carbs": 25, "fats": 16},
    "chicken_wings": {"kcal": 290, "protein": 18, "carbs": 0, "fats": 22},
    "chocolate_cake": {"kcal": 370, "protein": 5, "carbs": 45, "fats": 18},
    "chocolate_mousse": {"kcal": 250, "protein": 4, "carbs": 20, "fats": 18},
    "churros": {"kcal": 340, "protein": 4, "carbs": 40, "fats": 18},
    "clam_chowder": {"kcal": 120, "protein": 6, "carbs": 12, "fats": 5},
    "club_sandwich": {"kcal": 280, "protein": 15, "carbs": 30, "fats": 12},
    "crab_cakes": {"kcal": 200, "protein": 16, "carbs": 10, "fats": 10},
    "creme_brulee": {"kcal": 340, "protein": 5, "carbs": 25, "fats": 25},
    "croque_madame": {"kcal": 350, "protein": 18, "carbs": 25, "fats": 20},
    "cup_cakes": {"kcal": 330, "protein": 3, "carbs": 50, "fats": 15},
    "deviled_eggs": {"kcal": 180, "protein": 12, "carbs": 1, "fats": 14},
    "donuts": {"kcal": 450, "protein": 5, "carbs": 50, "fats": 25},
    "dumplings": {"kcal": 240, "protein": 10, "carbs": 30, "fats": 8},
    "edamame": {"kcal": 120, "protein": 11, "carbs": 10, "fats": 5},
    "eggs_benedict": {"kcal": 280, "protein": 12, "carbs": 15, "fats": 20},
    "escargots": {"kcal": 90, "protein": 16, "carbs": 2, "fats": 1},
    "falafel": {"kcal": 330, "protein": 13, "carbs": 31, "fats": 17},
    "filet_mignon": {"kcal": 240, "protein": 26, "carbs": 0, "fats": 15},
    "fish_and_chips": {"kcal": 265, "protein": 12, "carbs": 25, "fats": 14},
    "foie_gras": {"kcal": 460, "protein": 11, "carbs": 4, "fats": 43},
    "french_fries": {"kcal": 312, "protein": 3.4, "carbs": 41, "fats": 15},
    "french_onion_soup": {"kcal": 90, "protein": 4, "carbs": 10, "fats": 3},
    "french_toast": {"kcal": 240, "protein": 8, "carbs": 30, "fats": 10},
    "fried_calamari": {"kcal": 175, "protein": 15, "carbs": 15, "fats": 6},
    "fried_rice": {"kcal": 163, "protein": 4, "carbs": 33, "fats": 2},
    "frozen_yogurt": {"kcal": 127, "protein": 4, "carbs": 23, "fats": 2},
    "garlic_bread": {"kcal": 350, "protein": 8, "carbs": 45, "fats": 15},
    "gnocchi": {"kcal": 130, "protein": 3, "carbs": 28, "fats": 1},
    "greek_salad": {"kcal": 80, "protein": 3, "carbs": 6, "fats": 5},
    "grilled_cheese_sandwich": {"kcal": 290, "protein": 12, "carbs": 28, "fats": 15},
    "grilled_salmon": {"kcal": 208, "protein": 22, "carbs": 0, "fats": 13},
    "guacamole": {"kcal": 160, "protein": 2, "carbs": 9, "fats": 14},
    "gyoza": {"kcal": 220, "protein": 8, "carbs": 25, "fats": 10},
    "hamburger": {"kcal": 295, "protein": 17, "carbs": 24, "fats": 14},
    "hot_and_sour_soup": {"kcal": 50, "protein": 3, "carbs": 4, "fats": 2},
    "hot_dog": {"kcal": 290, "protein": 10, "carbs": 4, "fats": 26},
    "huevos_rancheros": {"kcal": 160, "protein": 9, "carbs": 14, "fats": 8},
    "hummus": {"kcal": 165, "protein": 8, "carbs": 14, "fats": 10},
    "ice_cream": {"kcal": 207, "protein": 3.5, "carbs": 24, "fats": 11},
    "lasagna": {"kcal": 135, "protein": 8, "carbs": 14, "fats": 5},
    "lobster_bisque": {"kcal": 110, "protein": 5, "carbs": 8, "fats": 6},
    "lobster_roll_sandwich": {"kcal": 230, "protein": 12, "carbs": 22, "fats": 11},
    "macaroni_and_cheese": {"kcal": 290, "protein": 11, "carbs": 30, "fats": 14},
    "macarons": {"kcal": 404, "protein": 5, "carbs": 60, "fats": 17},
    "miso_soup": {"kcal": 40, "protein": 3, "carbs": 4, "fats": 1.5},
    "mussels": {"kcal": 86, "protein": 12, "carbs": 4, "fats": 2.2},
    "nachos": {"kcal": 343, "protein": 9, "carbs": 36, "fats": 19},
    "omelette": {"kcal": 154, "protein": 11, "carbs": 1, "fats": 12},
    "onion_rings": {"kcal": 332, "protein": 5, "carbs": 30, "fats": 22},
    "oysters": {"kcal": 81, "protein": 9, "carbs": 5, "fats": 2.5},
    "pad_thai": {"kcal": 180, "protein": 9, "carbs": 20, "fats": 7},
    "paella": {"kcal": 170, "protein": 9, "carbs": 22, "fats": 5},
    "pancakes": {"kcal": 227, "protein": 6, "carbs": 28, "fats": 10},
    "panna_cotta": {"kcal": 298, "protein": 4, "carbs": 20, "fats": 22},
    "peking_duck": {"kcal": 337, "protein": 27, "carbs": 0, "fats": 24},
    "pho": {"kcal": 85, "protein": 6, "carbs": 11, "fats": 2},
    "pizza": {"kcal": 266, "protein": 11, "carbs": 33, "fats": 10},
    "pork_chop": {"kcal": 230, "protein": 24, "carbs": 0, "fats": 14},
    "poutine": {"kcal": 233, "protein": 8, "carbs": 20, "fats": 14},
    "prime_rib": {"kcal": 320, "protein": 23, "carbs": 0, "fats": 25},
    "pulled_pork_sandwich": {"kcal": 250, "protein": 16, "carbs": 24, "fats": 10},
    "ramen": {"kcal": 90, "protein": 4, "carbs": 12, "fats": 3},
    "ravioli": {"kcal": 200, "protein": 8, "carbs": 28, "fats": 6},
    "red_velvet_cake": {"kcal": 380, "protein": 4, "carbs": 50, "fats": 19},
    "risotto": {"kcal": 166, "protein": 4, "carbs": 21, "fats": 5},
    "samosa": {"kcal": 308, "protein": 5, "carbs": 30, "fats": 18},
    "sashimi": {"kcal": 130, "protein": 22, "carbs": 0, "fats": 5},
    "scallops": {"kcal": 88, "protein": 17, "carbs": 2, "fats": 0.8},
    "seaweed_salad": {"kcal": 70, "protein": 1.5, "carbs": 7, "fats": 4},
    "shrimp_and_grits": {"kcal": 175, "protein": 10, "carbs": 16, "fats": 8},
    "spaghetti_bolognese": {"kcal": 150, "protein": 8, "carbs": 18, "fats": 5},
    "spaghetti_carbonara": {"kcal": 270, "protein": 11, "carbs": 28, "fats": 12},
    "spring_rolls": {"kcal": 154, "protein": 4, "carbs": 22, "fats": 6},
    "steak": {"kcal": 271, "protein": 25, "carbs": 0, "fats": 19},
    "strawberry_shortcake": {"kcal": 343, "protein": 4, "carbs": 50, "fats": 14},
    "sushi": {"kcal": 150, "protein": 6, "carbs": 30, "fats": 0.5},
    "tacos": {"kcal": 217, "protein": 9, "carbs": 18, "fats": 12},
    "takoyaki": {"kcal": 198, "protein": 8, "carbs": 21, "fats": 9},
    "tiramisu": {"kcal": 240, "protein": 4, "carbs": 22, "fats": 15},
    "tuna_tartare": {"kcal": 145, "protein": 23, "carbs": 1, "fats": 5},
    "waffles": {"kcal": 291, "protein": 8, "carbs": 33, "fats": 14},
}

def recompute_kcal(macros):
    kcal = 4 * macros["protein"] + 4 * macros["carbs"] + 9 * macros["fats"]
    return {"kcal": int(round(kcal)),
            "protein": macros["protein"],
            "carbs": macros["carbs"],
            "fats": macros["fats"]}

def fetch_off(class_name):
    query = class_name.replace("_", " ")
    params = {
        "search_terms": query,
        "search_simple": 1,
        "action": "process",
        "json": 1,
        "page_size": 8,
        "fields": "product_name,nutriments",
    }
    url = OFF_URL + "?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  ! request failed: {e}", file=sys.stderr)
        return None

    for product in data.get("products", []) or []:
        n = product.get("nutriments") or {}
        kcal = n.get("energy-kcal_100g")
        if kcal is None:
            continue
        protein = n.get("proteins_100g")
        carbs = n.get("carbohydrates_100g")
        fats = n.get("fat_100g")
        if None in (protein, carbs, fats):
            continue
        return {
            "kcal": int(round(float(kcal))),
            "protein": round(float(protein), 1),
            "carbs": round(float(carbs), 1),
            "fats": round(float(fats), 1),
        }
    return None

def main():
    with open(CLASSES_FILE, "r", encoding="utf-8") as f:
        classes = json.load(f)

    out = {}
    stats = {"existing": 0, "off": 0, "default": 0}

    for i, c in enumerate(classes, start=1):
        if c in EXISTING:
            out[c] = recompute_kcal(EXISTING[c])
            stats["existing"] += 1
            print(f"[{i:>3}/{len(classes)}] {c} -> existing {out[c]}")
            continue

        v = fetch_off(c)
        if v is not None:
            out[c] = recompute_kcal(v)
            stats["off"] += 1
            print(f"[{i:>3}/{len(classes)}] {c} -> OFF {out[c]}")
        else:
            out[c] = recompute_kcal(DEFAULT_MACROS)
            stats["default"] += 1
            print(f"[{i:>3}/{len(classes)}] {c} -> default (no OFF match)")

        time.sleep(REQUEST_DELAY_SEC)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    print()
    print(f"Wrote {len(out)} entries to {OUTPUT_FILE}")
    print(
        f"  existing: {stats['existing']}, OFF: {stats['off']}, default: {stats['default']}"
    )

if __name__ == "__main__":
    main()
