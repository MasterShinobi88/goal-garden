/**
 * Built-in food database for calorie auto-calc (approx USDA-style values).
 * Units: kcal / protein / carbs / fat per 100g unless unit is "each".
 */

export type FoodUnit = "g" | "ml" | "each" | "cup" | "tbsp" | "tsp" | "slice" | "oz";

export type ShoppingCategory =
  | "produce"
  | "protein"
  | "dairy"
  | "grains"
  | "pantry"
  | "frozen"
  | "other";

export type FoodItem = {
  id: string;
  name: string;
  aliases: string[];
  /** Per 100g/ml for g/ml; per piece for each/slice; per cup/tbsp as stated */
  unit: FoodUnit;
  /** Serving size in the unit above that matches the macros */
  servingSize: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  /** grams equivalent of one unit when unit is cup/tbsp/each (for display) */
  gramsPerUnit?: number;
  /** Aisle grouping for shopping lists */
  category?: ShoppingCategory;
};

/**
 * Built-in food list (~250 items). Values are approximate USDA-style averages
 * for planning — not lab analysis. Per 100g/ml unless unit is each/slice/tbsp/etc.
 */
export const FOOD_DB: FoodItem[] = [
  // ── Proteins: poultry ──────────────────────────────────────────
  { id: "chicken-breast", name: "Chicken breast (cooked)", aliases: ["chicken", "chicken breast"], unit: "g", servingSize: 100, kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, category: "protein" },
  { id: "chicken-thigh", name: "Chicken thigh (cooked)", aliases: ["thigh", "chicken thigh"], unit: "g", servingSize: 100, kcal: 209, protein_g: 26, carbs_g: 0, fat_g: 10.9, category: "protein" },
  { id: "chicken-wing", name: "Chicken wing (cooked)", aliases: ["wing", "wings", "chicken wing"], unit: "g", servingSize: 100, kcal: 203, protein_g: 30, carbs_g: 0, fat_g: 8.1, category: "protein" },
  { id: "chicken-drumstick", name: "Chicken drumstick (cooked)", aliases: ["drumstick", "leg"], unit: "g", servingSize: 100, kcal: 172, protein_g: 28, carbs_g: 0, fat_g: 5.7, category: "protein" },
  { id: "rotisserie-chicken", name: "Rotisserie chicken (meat only)", aliases: ["rotisserie"], unit: "g", servingSize: 100, kcal: 190, protein_g: 27, carbs_g: 0, fat_g: 9, category: "protein" },
  { id: "turkey", name: "Turkey breast (cooked)", aliases: ["turkey"], unit: "g", servingSize: 100, kcal: 135, protein_g: 30, carbs_g: 0, fat_g: 1, category: "protein" },
  { id: "turkey-ground", name: "Ground turkey 93% lean (cooked)", aliases: ["ground turkey", "turkey mince"], unit: "g", servingSize: 100, kcal: 176, protein_g: 27, carbs_g: 0, fat_g: 7.5, category: "protein" },
  { id: "duck-breast", name: "Duck breast (cooked)", aliases: ["duck"], unit: "g", servingSize: 100, kcal: 201, protein_g: 23, carbs_g: 0, fat_g: 11, category: "protein" },
  { id: "deli-turkey", name: "Deli turkey slices", aliases: ["turkey deli", "sliced turkey"], unit: "g", servingSize: 100, kcal: 104, protein_g: 17, carbs_g: 4, fat_g: 2, category: "protein" },
  { id: "deli-chicken", name: "Deli chicken slices", aliases: ["chicken deli", "sliced chicken"], unit: "g", servingSize: 100, kcal: 98, protein_g: 16, carbs_g: 3, fat_g: 2.5, category: "protein" },

  // ── Proteins: beef & pork ──────────────────────────────────────
  { id: "ground-beef-90", name: "Ground beef 90% lean (cooked)", aliases: ["beef", "ground beef", "mince"], unit: "g", servingSize: 100, kcal: 217, protein_g: 26, carbs_g: 0, fat_g: 11.7, category: "protein" },
  { id: "ground-beef-80", name: "Ground beef 80% lean (cooked)", aliases: ["80/20", "beef mince fatty"], unit: "g", servingSize: 100, kcal: 254, protein_g: 25, carbs_g: 0, fat_g: 17, category: "protein" },
  { id: "steak", name: "Steak / beef (cooked)", aliases: ["steak", "ribeye", "sirloin"], unit: "g", servingSize: 100, kcal: 271, protein_g: 25, carbs_g: 0, fat_g: 19, category: "protein" },
  { id: "sirloin", name: "Sirloin steak (cooked lean)", aliases: ["sirloin steak"], unit: "g", servingSize: 100, kcal: 206, protein_g: 30, carbs_g: 0, fat_g: 9, category: "protein" },
  { id: "brisket", name: "Beef brisket (cooked)", aliases: ["brisket"], unit: "g", servingSize: 100, kcal: 291, protein_g: 28, carbs_g: 0, fat_g: 19, category: "protein" },
  { id: "roast-beef", name: "Roast beef (lean)", aliases: ["roast beef"], unit: "g", servingSize: 100, kcal: 167, protein_g: 29, carbs_g: 0, fat_g: 5, category: "protein" },
  { id: "pork-chop", name: "Pork chop (cooked)", aliases: ["pork", "pork chop"], unit: "g", servingSize: 100, kcal: 231, protein_g: 25, carbs_g: 0, fat_g: 14, category: "protein" },
  { id: "pork-loin", name: "Pork loin / tenderloin (cooked)", aliases: ["pork loin", "tenderloin", "pork tenderloin"], unit: "g", servingSize: 100, kcal: 143, protein_g: 26, carbs_g: 0, fat_g: 3.5, category: "protein" },
  { id: "pork-ground", name: "Ground pork (cooked)", aliases: ["ground pork", "pork mince"], unit: "g", servingSize: 100, kcal: 297, protein_g: 25, carbs_g: 0, fat_g: 21, category: "protein" },
  { id: "bacon", name: "Bacon (cooked)", aliases: ["bacon"], unit: "g", servingSize: 100, kcal: 541, protein_g: 37, carbs_g: 1.4, fat_g: 42, category: "protein" },
  { id: "ham", name: "Ham (sliced)", aliases: ["ham"], unit: "g", servingSize: 100, kcal: 145, protein_g: 21, carbs_g: 1.5, fat_g: 6, category: "protein" },
  { id: "sausage-pork", name: "Pork sausage (cooked)", aliases: ["sausage", "breakfast sausage"], unit: "g", servingSize: 100, kcal: 301, protein_g: 15, carbs_g: 2, fat_g: 26, category: "protein" },
  { id: "hot-dog", name: "Hot dog / frankfurter", aliases: ["hot dog", "frankfurter", "wiener"], unit: "each", servingSize: 1, kcal: 151, protein_g: 5, carbs_g: 2, fat_g: 13, gramsPerUnit: 45, category: "protein" },
  { id: "lamb-chop", name: "Lamb chop (cooked)", aliases: ["lamb", "lamb chop"], unit: "g", servingSize: 100, kcal: 282, protein_g: 25, carbs_g: 0, fat_g: 20, category: "protein" },
  { id: "venison", name: "Venison (cooked)", aliases: ["venison", "deer"], unit: "g", servingSize: 100, kcal: 158, protein_g: 30, carbs_g: 0, fat_g: 3.2, category: "protein" },
  { id: "bison", name: "Bison / buffalo (cooked)", aliases: ["bison", "buffalo"], unit: "g", servingSize: 100, kcal: 143, protein_g: 28, carbs_g: 0, fat_g: 2.4, category: "protein" },
  { id: "beef-jerky", name: "Beef jerky", aliases: ["jerky"], unit: "g", servingSize: 100, kcal: 410, protein_g: 33, carbs_g: 11, fat_g: 26, category: "pantry" },

  // ── Proteins: seafood ──────────────────────────────────────────
  { id: "salmon", name: "Salmon (cooked)", aliases: ["salmon"], unit: "g", servingSize: 100, kcal: 208, protein_g: 20, carbs_g: 0, fat_g: 13, category: "protein" },
  { id: "salmon-smoked", name: "Smoked salmon / lox", aliases: ["smoked salmon", "lox"], unit: "g", servingSize: 100, kcal: 117, protein_g: 18, carbs_g: 0, fat_g: 4.3, category: "protein" },
  { id: "tuna-can", name: "Tuna canned in water", aliases: ["tuna", "canned tuna"], unit: "g", servingSize: 100, kcal: 86, protein_g: 19, carbs_g: 0, fat_g: 1, category: "pantry" },
  { id: "tuna-oil", name: "Tuna canned in oil", aliases: ["tuna oil"], unit: "g", servingSize: 100, kcal: 198, protein_g: 29, carbs_g: 0, fat_g: 8, category: "pantry" },
  { id: "tuna-steak", name: "Tuna steak (cooked)", aliases: ["tuna steak", "ahi"], unit: "g", servingSize: 100, kcal: 132, protein_g: 29, carbs_g: 0, fat_g: 1, category: "protein" },
  { id: "cod", name: "Cod (cooked)", aliases: ["cod", "white fish"], unit: "g", servingSize: 100, kcal: 105, protein_g: 23, carbs_g: 0, fat_g: 0.9, category: "protein" },
  { id: "tilapia", name: "Tilapia (cooked)", aliases: ["tilapia"], unit: "g", servingSize: 100, kcal: 128, protein_g: 26, carbs_g: 0, fat_g: 2.7, category: "protein" },
  { id: "halibut", name: "Halibut (cooked)", aliases: ["halibut"], unit: "g", servingSize: 100, kcal: 140, protein_g: 27, carbs_g: 0, fat_g: 2.9, category: "protein" },
  { id: "mahi-mahi", name: "Mahi-mahi (cooked)", aliases: ["mahi", "mahi mahi", "dolphinfish"], unit: "g", servingSize: 100, kcal: 109, protein_g: 24, carbs_g: 0, fat_g: 0.9, category: "protein" },
  { id: "trout", name: "Trout (cooked)", aliases: ["trout"], unit: "g", servingSize: 100, kcal: 190, protein_g: 27, carbs_g: 0, fat_g: 8.5, category: "protein" },
  { id: "sardines", name: "Sardines canned in oil", aliases: ["sardine", "sardines"], unit: "g", servingSize: 100, kcal: 208, protein_g: 25, carbs_g: 0, fat_g: 11, category: "pantry" },
  { id: "mackerel", name: "Mackerel (cooked)", aliases: ["mackerel"], unit: "g", servingSize: 100, kcal: 262, protein_g: 24, carbs_g: 0, fat_g: 18, category: "protein" },
  { id: "anchovy", name: "Anchovies canned", aliases: ["anchovy", "anchovies"], unit: "g", servingSize: 100, kcal: 210, protein_g: 29, carbs_g: 0, fat_g: 10, category: "pantry" },
  { id: "shrimp", name: "Shrimp (cooked)", aliases: ["shrimp", "prawn", "prawns"], unit: "g", servingSize: 100, kcal: 99, protein_g: 24, carbs_g: 0.2, fat_g: 0.3, category: "protein" },
  { id: "crab", name: "Crab meat (cooked)", aliases: ["crab"], unit: "g", servingSize: 100, kcal: 97, protein_g: 19, carbs_g: 0, fat_g: 1.5, category: "protein" },
  { id: "lobster", name: "Lobster (cooked)", aliases: ["lobster"], unit: "g", servingSize: 100, kcal: 89, protein_g: 19, carbs_g: 0, fat_g: 0.9, category: "protein" },
  { id: "scallops", name: "Scallops (cooked)", aliases: ["scallop", "scallops"], unit: "g", servingSize: 100, kcal: 111, protein_g: 23, carbs_g: 3, fat_g: 0.8, category: "protein" },
  { id: "mussels", name: "Mussels (cooked)", aliases: ["mussel", "mussels"], unit: "g", servingSize: 100, kcal: 172, protein_g: 24, carbs_g: 7, fat_g: 4.5, category: "protein" },
  { id: "clams", name: "Clams (cooked)", aliases: ["clam", "clams"], unit: "g", servingSize: 100, kcal: 148, protein_g: 26, carbs_g: 5, fat_g: 2, category: "protein" },
  { id: "oysters", name: "Oysters (cooked)", aliases: ["oyster", "oysters"], unit: "g", servingSize: 100, kcal: 79, protein_g: 9, carbs_g: 4, fat_g: 3, category: "protein" },
  { id: "squid", name: "Squid / calamari (cooked)", aliases: ["squid", "calamari"], unit: "g", servingSize: 100, kcal: 92, protein_g: 16, carbs_g: 3, fat_g: 1.4, category: "protein" },

  // ── Proteins: plant & eggs ─────────────────────────────────────
  { id: "egg", name: "Egg (large)", aliases: ["eggs", "egg", "whole egg"], unit: "each", servingSize: 1, kcal: 72, protein_g: 6.3, carbs_g: 0.4, fat_g: 4.8, gramsPerUnit: 50, category: "dairy" },
  { id: "egg-white", name: "Egg white (large)", aliases: ["egg white", "egg whites"], unit: "each", servingSize: 1, kcal: 17, protein_g: 3.6, carbs_g: 0.2, fat_g: 0.1, gramsPerUnit: 33, category: "dairy" },
  { id: "egg-yolk", name: "Egg yolk (large)", aliases: ["yolk", "egg yolk"], unit: "each", servingSize: 1, kcal: 55, protein_g: 2.7, carbs_g: 0.6, fat_g: 4.5, gramsPerUnit: 17, category: "dairy" },
  { id: "tofu", name: "Tofu firm", aliases: ["tofu"], unit: "g", servingSize: 100, kcal: 144, protein_g: 17, carbs_g: 3, fat_g: 8, category: "protein" },
  { id: "tofu-silken", name: "Tofu silken", aliases: ["silken tofu"], unit: "g", servingSize: 100, kcal: 55, protein_g: 5, carbs_g: 2, fat_g: 3, category: "protein" },
  { id: "tempeh", name: "Tempeh", aliases: ["tempeh"], unit: "g", servingSize: 100, kcal: 192, protein_g: 20, carbs_g: 8, fat_g: 11, category: "protein" },
  { id: "seitan", name: "Seitan", aliases: ["seitan", "wheat meat"], unit: "g", servingSize: 100, kcal: 370, protein_g: 75, carbs_g: 14, fat_g: 1.9, category: "protein" },
  { id: "edamame", name: "Edamame (shelled, cooked)", aliases: ["edamame"], unit: "g", servingSize: 100, kcal: 121, protein_g: 12, carbs_g: 9, fat_g: 5, category: "produce" },
  { id: "tvp", name: "TVP / soy crumbles (dry)", aliases: ["tvp", "soy crumbles", "textured vegetable protein"], unit: "g", servingSize: 100, kcal: 327, protein_g: 52, carbs_g: 34, fat_g: 1, category: "pantry" },
  { id: "beyond-burger", name: "Plant-based burger patty", aliases: ["beyond", "impossible", "veggie burger", "plant burger"], unit: "each", servingSize: 1, kcal: 250, protein_g: 20, carbs_g: 3, fat_g: 18, gramsPerUnit: 113, category: "protein" },

  // ── Dairy & alternatives ───────────────────────────────────────
  { id: "greek-yogurt", name: "Greek yogurt plain nonfat", aliases: ["greek yogurt", "yogurt", "nonfat greek"], unit: "g", servingSize: 100, kcal: 59, protein_g: 10, carbs_g: 3.6, fat_g: 0.4, category: "dairy" },
  { id: "greek-yogurt-2", name: "Greek yogurt plain 2%", aliases: ["2% greek yogurt", "low fat greek"], unit: "g", servingSize: 100, kcal: 73, protein_g: 10, carbs_g: 3.9, fat_g: 1.9, category: "dairy" },
  { id: "greek-yogurt-full", name: "Greek yogurt plain full-fat", aliases: ["full fat greek", "whole milk greek"], unit: "g", servingSize: 100, kcal: 97, protein_g: 9, carbs_g: 4, fat_g: 5, category: "dairy" },
  { id: "yogurt-plain", name: "Yogurt plain low-fat", aliases: ["plain yogurt", "regular yogurt"], unit: "g", servingSize: 100, kcal: 63, protein_g: 5.3, carbs_g: 7, fat_g: 1.6, category: "dairy" },
  { id: "yogurt-flavored", name: "Yogurt flavored low-fat", aliases: ["fruit yogurt", "vanilla yogurt"], unit: "g", servingSize: 100, kcal: 99, protein_g: 4, carbs_g: 16, fat_g: 1.5, category: "dairy" },
  { id: "skyr", name: "Skyr plain", aliases: ["skyr"], unit: "g", servingSize: 100, kcal: 63, protein_g: 11, carbs_g: 4, fat_g: 0.2, category: "dairy" },
  { id: "kefir", name: "Kefir plain low-fat", aliases: ["kefir"], unit: "ml", servingSize: 100, kcal: 43, protein_g: 3.8, carbs_g: 4.5, fat_g: 1, category: "dairy" },
  { id: "milk-whole", name: "Milk whole", aliases: ["milk", "whole milk"], unit: "ml", servingSize: 100, kcal: 61, protein_g: 3.2, carbs_g: 4.8, fat_g: 3.3, category: "dairy" },
  { id: "milk-2", name: "Milk 2%", aliases: ["2% milk", "reduced fat milk"], unit: "ml", servingSize: 100, kcal: 50, protein_g: 3.3, carbs_g: 4.8, fat_g: 2, category: "dairy" },
  { id: "milk-skim", name: "Milk skim", aliases: ["skim milk", "fat free milk", "nonfat milk"], unit: "ml", servingSize: 100, kcal: 34, protein_g: 3.4, carbs_g: 5, fat_g: 0.1, category: "dairy" },
  { id: "milk-lactose-free", name: "Milk lactose-free 2%", aliases: ["lactose free milk"], unit: "ml", servingSize: 100, kcal: 50, protein_g: 3.3, carbs_g: 4.8, fat_g: 2, category: "dairy" },
  { id: "soy-milk", name: "Soy milk unsweetened", aliases: ["soy milk", "plant milk"], unit: "ml", servingSize: 100, kcal: 33, protein_g: 2.9, carbs_g: 1.2, fat_g: 1.8, category: "dairy" },
  { id: "almond-milk", name: "Almond milk unsweetened", aliases: ["almond milk"], unit: "ml", servingSize: 100, kcal: 15, protein_g: 0.6, carbs_g: 0.3, fat_g: 1.1, category: "dairy" },
  { id: "oat-milk", name: "Oat milk unsweetened", aliases: ["oat milk"], unit: "ml", servingSize: 100, kcal: 40, protein_g: 1, carbs_g: 6.5, fat_g: 1.5, category: "dairy" },
  { id: "coconut-milk-bev", name: "Coconut milk beverage unsweetened", aliases: ["coconut milk drink"], unit: "ml", servingSize: 100, kcal: 19, protein_g: 0.2, carbs_g: 0.5, fat_g: 1.9, category: "dairy" },
  { id: "coconut-milk-can", name: "Coconut milk canned full-fat", aliases: ["canned coconut milk", "coconut cream"], unit: "ml", servingSize: 100, kcal: 197, protein_g: 2, carbs_g: 3, fat_g: 21, category: "pantry" },
  { id: "cheddar", name: "Cheddar cheese", aliases: ["cheddar", "cheese"], unit: "g", servingSize: 100, kcal: 403, protein_g: 25, carbs_g: 1.3, fat_g: 33, category: "dairy" },
  { id: "mozzarella", name: "Mozzarella part-skim", aliases: ["mozzarella", "mozz"], unit: "g", servingSize: 100, kcal: 280, protein_g: 28, carbs_g: 3, fat_g: 17, category: "dairy" },
  { id: "mozzarella-fresh", name: "Mozzarella fresh (whole milk)", aliases: ["fresh mozzarella", "bocconcini"], unit: "g", servingSize: 100, kcal: 280, protein_g: 18, carbs_g: 2, fat_g: 22, category: "dairy" },
  { id: "parmesan", name: "Parmesan cheese", aliases: ["parmesan", "parmigiano"], unit: "g", servingSize: 100, kcal: 431, protein_g: 38, carbs_g: 4, fat_g: 29, category: "dairy" },
  { id: "feta", name: "Feta cheese", aliases: ["feta"], unit: "g", servingSize: 100, kcal: 264, protein_g: 14, carbs_g: 4, fat_g: 21, category: "dairy" },
  { id: "swiss", name: "Swiss cheese", aliases: ["swiss"], unit: "g", servingSize: 100, kcal: 380, protein_g: 27, carbs_g: 5, fat_g: 28, category: "dairy" },
  { id: "gouda", name: "Gouda cheese", aliases: ["gouda"], unit: "g", servingSize: 100, kcal: 356, protein_g: 25, carbs_g: 2, fat_g: 27, category: "dairy" },
  { id: "cream-cheese", name: "Cream cheese", aliases: ["cream cheese"], unit: "g", servingSize: 100, kcal: 342, protein_g: 6, carbs_g: 4, fat_g: 34, category: "dairy" },
  { id: "cottage-cheese", name: "Cottage cheese low-fat", aliases: ["cottage cheese"], unit: "g", servingSize: 100, kcal: 72, protein_g: 12, carbs_g: 2.7, fat_g: 1, category: "dairy" },
  { id: "cottage-full", name: "Cottage cheese 4% full-fat", aliases: ["full fat cottage"], unit: "g", servingSize: 100, kcal: 98, protein_g: 11, carbs_g: 3.4, fat_g: 4.3, category: "dairy" },
  { id: "ricotta", name: "Ricotta part-skim", aliases: ["ricotta"], unit: "g", servingSize: 100, kcal: 138, protein_g: 11, carbs_g: 5, fat_g: 8, category: "dairy" },
  { id: "string-cheese", name: "String cheese / mozzarella stick", aliases: ["string cheese", "cheese stick"], unit: "each", servingSize: 1, kcal: 80, protein_g: 7, carbs_g: 1, fat_g: 6, gramsPerUnit: 28, category: "dairy" },
  { id: "butter", name: "Butter", aliases: ["butter"], unit: "g", servingSize: 100, kcal: 717, protein_g: 0.9, carbs_g: 0.1, fat_g: 81, category: "dairy" },
  { id: "ghee", name: "Ghee / clarified butter", aliases: ["ghee"], unit: "g", servingSize: 100, kcal: 900, protein_g: 0, carbs_g: 0, fat_g: 100, category: "dairy" },
  { id: "sour-cream", name: "Sour cream", aliases: ["sour cream"], unit: "g", servingSize: 100, kcal: 193, protein_g: 2.4, carbs_g: 4.6, fat_g: 19, category: "dairy" },
  { id: "heavy-cream", name: "Heavy cream / whipping cream", aliases: ["heavy cream", "whipping cream", "double cream"], unit: "ml", servingSize: 100, kcal: 340, protein_g: 2, carbs_g: 2.8, fat_g: 36, category: "dairy" },
  { id: "half-half", name: "Half-and-half", aliases: ["half and half", "half half"], unit: "ml", servingSize: 100, kcal: 130, protein_g: 3, carbs_g: 4.3, fat_g: 12, category: "dairy" },
  { id: "whey", name: "Whey protein powder", aliases: ["whey", "protein powder", "protein scoop", "whey protein"], unit: "g", servingSize: 30, kcal: 120, protein_g: 24, carbs_g: 3, fat_g: 1.5, category: "pantry" },
  { id: "casein", name: "Casein protein powder", aliases: ["casein"], unit: "g", servingSize: 30, kcal: 110, protein_g: 24, carbs_g: 3, fat_g: 1, category: "pantry" },
  { id: "pea-protein", name: "Pea protein powder", aliases: ["pea protein", "vegan protein"], unit: "g", servingSize: 30, kcal: 110, protein_g: 22, carbs_g: 2, fat_g: 1.5, category: "pantry" },

  // ── Grains, breads & starches ──────────────────────────────────
  { id: "rice-white", name: "White rice (cooked)", aliases: ["rice", "white rice"], unit: "g", servingSize: 100, kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, category: "grains" },
  { id: "rice-brown", name: "Brown rice (cooked)", aliases: ["brown rice"], unit: "g", servingSize: 100, kcal: 112, protein_g: 2.3, carbs_g: 24, fat_g: 0.8, category: "grains" },
  { id: "rice-jasmine", name: "Jasmine rice (cooked)", aliases: ["jasmine rice"], unit: "g", servingSize: 100, kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, category: "grains" },
  { id: "rice-basmati", name: "Basmati rice (cooked)", aliases: ["basmati"], unit: "g", servingSize: 100, kcal: 121, protein_g: 3.5, carbs_g: 25, fat_g: 0.4, category: "grains" },
  { id: "rice-wild", name: "Wild rice (cooked)", aliases: ["wild rice"], unit: "g", servingSize: 100, kcal: 101, protein_g: 4, carbs_g: 21, fat_g: 0.3, category: "grains" },
  { id: "rice-dry", name: "White rice dry (uncooked)", aliases: ["dry rice", "uncooked rice"], unit: "g", servingSize: 100, kcal: 365, protein_g: 7, carbs_g: 80, fat_g: 0.7, category: "grains" },
  { id: "oats", name: "Oats dry", aliases: ["oats", "oatmeal", "porridge", "rolled oats"], unit: "g", servingSize: 100, kcal: 389, protein_g: 17, carbs_g: 66, fat_g: 7, category: "grains" },
  { id: "oats-cooked", name: "Oatmeal cooked (water)", aliases: ["cooked oats", "cooked oatmeal"], unit: "g", servingSize: 100, kcal: 71, protein_g: 2.5, carbs_g: 12, fat_g: 1.5, category: "grains" },
  { id: "pasta", name: "Pasta (cooked)", aliases: ["pasta", "spaghetti", "noodles"], unit: "g", servingSize: 100, kcal: 131, protein_g: 5, carbs_g: 25, fat_g: 1.1, category: "grains" },
  { id: "pasta-whole", name: "Whole wheat pasta (cooked)", aliases: ["whole wheat pasta", "wholegrain pasta"], unit: "g", servingSize: 100, kcal: 124, protein_g: 5.3, carbs_g: 26, fat_g: 0.5, category: "grains" },
  { id: "pasta-dry", name: "Pasta dry (uncooked)", aliases: ["dry pasta", "uncooked pasta"], unit: "g", servingSize: 100, kcal: 371, protein_g: 13, carbs_g: 75, fat_g: 1.5, category: "grains" },
  { id: "pasta-protein", name: "Protein / chickpea pasta (cooked)", aliases: ["protein pasta", "chickpea pasta", "barilla protein"], unit: "g", servingSize: 100, kcal: 140, protein_g: 11, carbs_g: 22, fat_g: 2, category: "grains" },
  { id: "rice-noodles", name: "Rice noodles (cooked)", aliases: ["rice noodles", "pad thai noodles"], unit: "g", servingSize: 100, kcal: 109, protein_g: 0.9, carbs_g: 25, fat_g: 0.2, category: "grains" },
  { id: "udon", name: "Udon noodles (cooked)", aliases: ["udon"], unit: "g", servingSize: 100, kcal: 99, protein_g: 2.6, carbs_g: 21, fat_g: 0.2, category: "grains" },
  { id: "ramen-noodles", name: "Ramen noodles cooked (no packet)", aliases: ["ramen", "instant noodles"], unit: "g", servingSize: 100, kcal: 138, protein_g: 4, carbs_g: 20, fat_g: 5, category: "grains" },
  { id: "bread-slice", name: "Bread slice (wheat)", aliases: ["bread", "toast", "slice of bread", "white bread"], unit: "slice", servingSize: 1, kcal: 79, protein_g: 3.1, carbs_g: 14, fat_g: 1, gramsPerUnit: 28, category: "grains" },
  { id: "bread-whole", name: "Bread slice whole wheat", aliases: ["whole wheat bread", "wholemeal bread"], unit: "slice", servingSize: 1, kcal: 81, protein_g: 4, carbs_g: 14, fat_g: 1.1, gramsPerUnit: 28, category: "grains" },
  { id: "bread-sourdough", name: "Sourdough bread slice", aliases: ["sourdough"], unit: "slice", servingSize: 1, kcal: 87, protein_g: 3.5, carbs_g: 17, fat_g: 0.6, gramsPerUnit: 32, category: "grains" },
  { id: "bread-rye", name: "Rye bread slice", aliases: ["rye", "rye bread"], unit: "slice", servingSize: 1, kcal: 83, protein_g: 2.7, carbs_g: 15, fat_g: 1.1, gramsPerUnit: 32, category: "grains" },
  { id: "bagel", name: "Bagel plain (medium)", aliases: ["bagel"], unit: "each", servingSize: 1, kcal: 277, protein_g: 11, carbs_g: 55, fat_g: 1.4, gramsPerUnit: 95, category: "grains" },
  { id: "english-muffin", name: "English muffin", aliases: ["english muffin"], unit: "each", servingSize: 1, kcal: 134, protein_g: 4.4, carbs_g: 26, fat_g: 1, gramsPerUnit: 57, category: "grains" },
  { id: "pita", name: "Pita bread (medium)", aliases: ["pita"], unit: "each", servingSize: 1, kcal: 165, protein_g: 5.5, carbs_g: 33, fat_g: 0.7, gramsPerUnit: 60, category: "grains" },
  { id: "naan", name: "Naan bread", aliases: ["naan"], unit: "each", servingSize: 1, kcal: 262, protein_g: 7.5, carbs_g: 45, fat_g: 5.5, gramsPerUnit: 90, category: "grains" },
  { id: "croissant", name: "Croissant", aliases: ["croissant"], unit: "each", servingSize: 1, kcal: 231, protein_g: 4.7, carbs_g: 26, fat_g: 12, gramsPerUnit: 57, category: "grains" },
  { id: "tortilla", name: "Flour tortilla (medium)", aliases: ["tortilla", "wrap", "flour wrap"], unit: "each", servingSize: 1, kcal: 140, protein_g: 4, carbs_g: 24, fat_g: 3.5, gramsPerUnit: 45, category: "grains" },
  { id: "tortilla-corn", name: "Corn tortilla (small)", aliases: ["corn tortilla"], unit: "each", servingSize: 1, kcal: 52, protein_g: 1.4, carbs_g: 11, fat_g: 0.7, gramsPerUnit: 24, category: "grains" },
  { id: "tortilla-lowcarb", name: "Low-carb tortilla", aliases: ["keto tortilla", "low carb wrap"], unit: "each", servingSize: 1, kcal: 70, protein_g: 6, carbs_g: 12, fat_g: 3, gramsPerUnit: 42, category: "grains" },
  { id: "quinoa", name: "Quinoa (cooked)", aliases: ["quinoa"], unit: "g", servingSize: 100, kcal: 120, protein_g: 4.4, carbs_g: 21, fat_g: 1.9, category: "grains" },
  { id: "couscous", name: "Couscous (cooked)", aliases: ["couscous"], unit: "g", servingSize: 100, kcal: 112, protein_g: 3.8, carbs_g: 23, fat_g: 0.2, category: "grains" },
  { id: "bulgur", name: "Bulgur (cooked)", aliases: ["bulgur", "bulgar"], unit: "g", servingSize: 100, kcal: 83, protein_g: 3.1, carbs_g: 19, fat_g: 0.2, category: "grains" },
  { id: "farro", name: "Farro (cooked)", aliases: ["farro"], unit: "g", servingSize: 100, kcal: 170, protein_g: 6, carbs_g: 34, fat_g: 1.5, category: "grains" },
  { id: "barley", name: "Barley pearl (cooked)", aliases: ["barley"], unit: "g", servingSize: 100, kcal: 123, protein_g: 2.3, carbs_g: 28, fat_g: 0.4, category: "grains" },
  { id: "polenta", name: "Polenta / cornmeal (cooked)", aliases: ["polenta", "grits"], unit: "g", servingSize: 100, kcal: 70, protein_g: 1.7, carbs_g: 15, fat_g: 0.3, category: "grains" },
  { id: "corn-on-cob", name: "Corn on the cob (medium ear)", aliases: ["corn", "corn cob", "sweet corn"], unit: "each", servingSize: 1, kcal: 88, protein_g: 3.3, carbs_g: 19, fat_g: 1.4, gramsPerUnit: 90, category: "produce" },
  { id: "corn-kernels", name: "Corn kernels (cooked)", aliases: ["corn kernels", "canned corn"], unit: "g", servingSize: 100, kcal: 96, protein_g: 3.4, carbs_g: 21, fat_g: 1.5, category: "produce" },
  { id: "potato", name: "Potato (boiled)", aliases: ["potato", "potatoes"], unit: "g", servingSize: 100, kcal: 87, protein_g: 1.9, carbs_g: 20, fat_g: 0.1, category: "produce" },
  { id: "potato-baked", name: "Potato baked with skin", aliases: ["baked potato"], unit: "g", servingSize: 100, kcal: 93, protein_g: 2.5, carbs_g: 21, fat_g: 0.1, category: "produce" },
  { id: "sweet-potato", name: "Sweet potato (baked)", aliases: ["sweet potato", "yam"], unit: "g", servingSize: 100, kcal: 90, protein_g: 2, carbs_g: 21, fat_g: 0.2, category: "produce" },
  { id: "cauli-rice", name: "Cauliflower rice", aliases: ["cauli rice", "cauliflower rice"], unit: "g", servingSize: 100, kcal: 25, protein_g: 2, carbs_g: 5, fat_g: 0.3, category: "produce" },
  { id: "hash-browns", name: "Hash browns", aliases: ["hash browns", "hashbrown"], unit: "g", servingSize: 100, kcal: 265, protein_g: 3, carbs_g: 30, fat_g: 15, category: "frozen" },
  { id: "cracker", name: "Crackers (wheat, ~5 small)", aliases: ["crackers", "cracker"], unit: "g", servingSize: 100, kcal: 430, protein_g: 8, carbs_g: 70, fat_g: 12, category: "pantry" },
  { id: "rice-cake", name: "Rice cake plain", aliases: ["rice cake", "rice cakes"], unit: "each", servingSize: 1, kcal: 35, protein_g: 0.7, carbs_g: 7.3, fat_g: 0.3, gramsPerUnit: 9, category: "pantry" },
  { id: "granola", name: "Granola", aliases: ["granola"], unit: "g", servingSize: 100, kcal: 471, protein_g: 10, carbs_g: 64, fat_g: 20, category: "pantry" },
  { id: "cereal-cheerios", name: "Cheerios-style cereal", aliases: ["cheerios", "oat cereal"], unit: "g", servingSize: 100, kcal: 367, protein_g: 12, carbs_g: 73, fat_g: 6, category: "pantry" },
  { id: "cereal-flakes", name: "Corn flakes", aliases: ["corn flakes", "flakes"], unit: "g", servingSize: 100, kcal: 357, protein_g: 7, carbs_g: 84, fat_g: 0.4, category: "pantry" },

  // ── Legumes ────────────────────────────────────────────────────
  { id: "beans-black", name: "Black beans (cooked)", aliases: ["black beans", "beans"], unit: "g", servingSize: 100, kcal: 132, protein_g: 8.9, carbs_g: 24, fat_g: 0.5, category: "pantry" },
  { id: "beans-kidney", name: "Kidney beans (cooked)", aliases: ["kidney beans", "red beans"], unit: "g", servingSize: 100, kcal: 127, protein_g: 8.7, carbs_g: 23, fat_g: 0.5, category: "pantry" },
  { id: "beans-pinto", name: "Pinto beans (cooked)", aliases: ["pinto beans"], unit: "g", servingSize: 100, kcal: 143, protein_g: 9, carbs_g: 26, fat_g: 0.7, category: "pantry" },
  { id: "beans-navy", name: "Navy / white beans (cooked)", aliases: ["navy beans", "white beans", "cannellini"], unit: "g", servingSize: 100, kcal: 140, protein_g: 8.2, carbs_g: 26, fat_g: 0.6, category: "pantry" },
  { id: "beans-refried", name: "Refried beans", aliases: ["refried beans"], unit: "g", servingSize: 100, kcal: 91, protein_g: 5.5, carbs_g: 13, fat_g: 2, category: "pantry" },
  { id: "chickpeas", name: "Chickpeas (cooked)", aliases: ["chickpeas", "garbanzo", "garbanzo beans"], unit: "g", servingSize: 100, kcal: 164, protein_g: 8.9, carbs_g: 27, fat_g: 2.6, category: "pantry" },
  { id: "lentils", name: "Lentils (cooked)", aliases: ["lentils"], unit: "g", servingSize: 100, kcal: 116, protein_g: 9, carbs_g: 20, fat_g: 0.4, category: "pantry" },
  { id: "lentils-red", name: "Red lentils (cooked)", aliases: ["red lentils"], unit: "g", servingSize: 100, kcal: 116, protein_g: 9, carbs_g: 20, fat_g: 0.4, category: "pantry" },
  { id: "peas-green", name: "Green peas (cooked)", aliases: ["peas", "green peas", "garden peas"], unit: "g", servingSize: 100, kcal: 84, protein_g: 5.4, carbs_g: 16, fat_g: 0.2, category: "produce" },
  { id: "hummus", name: "Hummus", aliases: ["hummus"], unit: "g", servingSize: 100, kcal: 166, protein_g: 8, carbs_g: 14, fat_g: 10, category: "pantry" },
  { id: "baked-beans", name: "Baked beans in tomato sauce", aliases: ["baked beans"], unit: "g", servingSize: 100, kcal: 94, protein_g: 4.8, carbs_g: 17, fat_g: 0.4, category: "pantry" },

  // ── Fruit ──────────────────────────────────────────────────────
  { id: "banana", name: "Banana (medium)", aliases: ["banana"], unit: "each", servingSize: 1, kcal: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.4, gramsPerUnit: 118, category: "produce" },
  { id: "apple", name: "Apple (medium)", aliases: ["apple"], unit: "each", servingSize: 1, kcal: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3, gramsPerUnit: 182, category: "produce" },
  { id: "orange", name: "Orange (medium)", aliases: ["orange"], unit: "each", servingSize: 1, kcal: 62, protein_g: 1.2, carbs_g: 15, fat_g: 0.2, gramsPerUnit: 131, category: "produce" },
  { id: "grapefruit", name: "Grapefruit (half)", aliases: ["grapefruit"], unit: "each", servingSize: 1, kcal: 52, protein_g: 1, carbs_g: 13, fat_g: 0.2, gramsPerUnit: 123, category: "produce" },
  { id: "pear", name: "Pear (medium)", aliases: ["pear"], unit: "each", servingSize: 1, kcal: 101, protein_g: 0.6, carbs_g: 27, fat_g: 0.2, gramsPerUnit: 178, category: "produce" },
  { id: "peach", name: "Peach (medium)", aliases: ["peach"], unit: "each", servingSize: 1, kcal: 59, protein_g: 1.4, carbs_g: 14, fat_g: 0.4, gramsPerUnit: 150, category: "produce" },
  { id: "nectarine", name: "Nectarine (medium)", aliases: ["nectarine"], unit: "each", servingSize: 1, kcal: 62, protein_g: 1.5, carbs_g: 15, fat_g: 0.5, gramsPerUnit: 142, category: "produce" },
  { id: "plum", name: "Plum (medium)", aliases: ["plum"], unit: "each", servingSize: 1, kcal: 30, protein_g: 0.5, carbs_g: 8, fat_g: 0.2, gramsPerUnit: 66, category: "produce" },
  { id: "mango", name: "Mango (cup / ~165g)", aliases: ["mango"], unit: "g", servingSize: 100, kcal: 60, protein_g: 0.8, carbs_g: 15, fat_g: 0.4, category: "produce" },
  { id: "pineapple", name: "Pineapple", aliases: ["pineapple"], unit: "g", servingSize: 100, kcal: 50, protein_g: 0.5, carbs_g: 13, fat_g: 0.1, category: "produce" },
  { id: "watermelon", name: "Watermelon", aliases: ["watermelon"], unit: "g", servingSize: 100, kcal: 30, protein_g: 0.6, carbs_g: 8, fat_g: 0.2, category: "produce" },
  { id: "cantaloupe", name: "Cantaloupe / melon", aliases: ["cantaloupe", "melon", "honeydew"], unit: "g", servingSize: 100, kcal: 34, protein_g: 0.8, carbs_g: 8, fat_g: 0.2, category: "produce" },
  { id: "grapes", name: "Grapes", aliases: ["grape", "grapes"], unit: "g", servingSize: 100, kcal: 69, protein_g: 0.7, carbs_g: 18, fat_g: 0.2, category: "produce" },
  { id: "kiwi", name: "Kiwi (medium)", aliases: ["kiwi", "kiwifruit"], unit: "each", servingSize: 1, kcal: 42, protein_g: 0.8, carbs_g: 10, fat_g: 0.4, gramsPerUnit: 69, category: "produce" },
  { id: "cherry", name: "Cherries", aliases: ["cherry", "cherries"], unit: "g", servingSize: 100, kcal: 63, protein_g: 1.1, carbs_g: 16, fat_g: 0.2, category: "produce" },
  { id: "blueberry", name: "Blueberries", aliases: ["blueberry", "blueberries"], unit: "g", servingSize: 100, kcal: 57, protein_g: 0.7, carbs_g: 14, fat_g: 0.3, category: "produce" },
  { id: "strawberry", name: "Strawberries", aliases: ["strawberry", "strawberries"], unit: "g", servingSize: 100, kcal: 32, protein_g: 0.7, carbs_g: 7.7, fat_g: 0.3, category: "produce" },
  { id: "raspberry", name: "Raspberries", aliases: ["raspberry", "raspberries"], unit: "g", servingSize: 100, kcal: 52, protein_g: 1.2, carbs_g: 12, fat_g: 0.7, category: "produce" },
  { id: "blackberry", name: "Blackberries", aliases: ["blackberry", "blackberries"], unit: "g", servingSize: 100, kcal: 43, protein_g: 1.4, carbs_g: 10, fat_g: 0.5, category: "produce" },
  { id: "berries-mixed", name: "Mixed berries", aliases: ["berries", "mixed berries"], unit: "g", servingSize: 100, kcal: 50, protein_g: 0.7, carbs_g: 12, fat_g: 0.3, category: "produce" },
  { id: "avocado", name: "Avocado", aliases: ["avocado"], unit: "g", servingSize: 100, kcal: 160, protein_g: 2, carbs_g: 8.5, fat_g: 15, category: "produce" },
  { id: "lemon", name: "Lemon (medium)", aliases: ["lemon"], unit: "each", servingSize: 1, kcal: 17, protein_g: 0.6, carbs_g: 5.4, fat_g: 0.2, gramsPerUnit: 58, category: "produce" },
  { id: "lime", name: "Lime (medium)", aliases: ["lime"], unit: "each", servingSize: 1, kcal: 20, protein_g: 0.5, carbs_g: 7, fat_g: 0.1, gramsPerUnit: 67, category: "produce" },
  { id: "dates", name: "Dates (Medjool)", aliases: ["date", "dates", "medjool"], unit: "each", servingSize: 1, kcal: 66, protein_g: 0.4, carbs_g: 18, fat_g: 0, gramsPerUnit: 24, category: "produce" },
  { id: "raisins", name: "Raisins", aliases: ["raisin", "raisins"], unit: "g", servingSize: 100, kcal: 299, protein_g: 3.1, carbs_g: 79, fat_g: 0.5, category: "pantry" },
  { id: "dried-cranberries", name: "Dried cranberries sweetened", aliases: ["craisins", "dried cranberries"], unit: "g", servingSize: 100, kcal: 308, protein_g: 0.1, carbs_g: 82, fat_g: 1.4, category: "pantry" },
  { id: "figs-dried", name: "Dried figs", aliases: ["fig", "figs", "dried figs"], unit: "g", servingSize: 100, kcal: 249, protein_g: 3.3, carbs_g: 64, fat_g: 0.9, category: "pantry" },
  { id: "coconut-shred", name: "Coconut shredded unsweetened", aliases: ["shredded coconut", "desiccated coconut"], unit: "g", servingSize: 100, kcal: 660, protein_g: 6.9, carbs_g: 24, fat_g: 65, category: "pantry" },

  // ── Vegetables ─────────────────────────────────────────────────
  { id: "broccoli", name: "Broccoli (cooked)", aliases: ["broccoli"], unit: "g", servingSize: 100, kcal: 35, protein_g: 2.4, carbs_g: 7, fat_g: 0.4, category: "produce" },
  { id: "broccoli-raw", name: "Broccoli raw", aliases: ["raw broccoli"], unit: "g", servingSize: 100, kcal: 34, protein_g: 2.8, carbs_g: 7, fat_g: 0.4, category: "produce" },
  { id: "spinach", name: "Spinach raw", aliases: ["spinach"], unit: "g", servingSize: 100, kcal: 23, protein_g: 2.9, carbs_g: 3.6, fat_g: 0.4, category: "produce" },
  { id: "spinach-cooked", name: "Spinach cooked", aliases: ["cooked spinach"], unit: "g", servingSize: 100, kcal: 23, protein_g: 3, carbs_g: 3.8, fat_g: 0.3, category: "produce" },
  { id: "kale", name: "Kale raw", aliases: ["kale"], unit: "g", servingSize: 100, kcal: 35, protein_g: 2.9, carbs_g: 4.4, fat_g: 1.5, category: "produce" },
  { id: "carrot", name: "Carrot raw", aliases: ["carrot", "carrots"], unit: "g", servingSize: 100, kcal: 41, protein_g: 0.9, carbs_g: 10, fat_g: 0.2, category: "produce" },
  { id: "mixed-salad", name: "Mixed salad greens", aliases: ["salad", "lettuce", "greens", "romaine", "iceberg"], unit: "g", servingSize: 100, kcal: 20, protein_g: 1.5, carbs_g: 3, fat_g: 0.2, category: "produce" },
  { id: "arugula", name: "Arugula / rocket", aliases: ["arugula", "rocket"], unit: "g", servingSize: 100, kcal: 25, protein_g: 2.6, carbs_g: 3.7, fat_g: 0.7, category: "produce" },
  { id: "cabbage", name: "Cabbage", aliases: ["cabbage"], unit: "g", servingSize: 100, kcal: 25, protein_g: 1.3, carbs_g: 6, fat_g: 0.1, category: "produce" },
  { id: "brussels", name: "Brussels sprouts (cooked)", aliases: ["brussels", "brussel sprouts", "brussels sprouts"], unit: "g", servingSize: 100, kcal: 36, protein_g: 2.6, carbs_g: 7, fat_g: 0.5, category: "produce" },
  { id: "cauliflower", name: "Cauliflower (cooked)", aliases: ["cauliflower"], unit: "g", servingSize: 100, kcal: 23, protein_g: 1.8, carbs_g: 4, fat_g: 0.5, category: "produce" },
  { id: "tomato", name: "Tomato", aliases: ["tomato", "tomatoes"], unit: "g", servingSize: 100, kcal: 18, protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2, category: "produce" },
  { id: "cherry-tomato", name: "Cherry tomatoes", aliases: ["cherry tomato", "grape tomato"], unit: "g", servingSize: 100, kcal: 18, protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2, category: "produce" },
  { id: "onion", name: "Onion", aliases: ["onion"], unit: "g", servingSize: 100, kcal: 40, protein_g: 1.1, carbs_g: 9, fat_g: 0.1, category: "produce" },
  { id: "garlic", name: "Garlic (clove)", aliases: ["garlic", "clove"], unit: "each", servingSize: 1, kcal: 4, protein_g: 0.2, carbs_g: 1, fat_g: 0, gramsPerUnit: 3, category: "produce" },
  { id: "cucumber", name: "Cucumber", aliases: ["cucumber"], unit: "g", servingSize: 100, kcal: 15, protein_g: 0.7, carbs_g: 3.6, fat_g: 0.1, category: "produce" },
  { id: "zucchini", name: "Zucchini", aliases: ["zucchini", "courgette"], unit: "g", servingSize: 100, kcal: 17, protein_g: 1.2, carbs_g: 3.1, fat_g: 0.3, category: "produce" },
  { id: "bell-pepper", name: "Bell pepper", aliases: ["pepper", "bell pepper", "capsicum"], unit: "g", servingSize: 100, kcal: 31, protein_g: 1, carbs_g: 6, fat_g: 0.3, category: "produce" },
  { id: "jalapeno", name: "Jalapeño pepper", aliases: ["jalapeno", "jalapeño"], unit: "g", servingSize: 100, kcal: 29, protein_g: 0.9, carbs_g: 6.5, fat_g: 0.4, category: "produce" },
  { id: "mushroom", name: "Mushrooms white", aliases: ["mushroom", "mushrooms"], unit: "g", servingSize: 100, kcal: 22, protein_g: 3.1, carbs_g: 3.3, fat_g: 0.3, category: "produce" },
  { id: "mushroom-portobello", name: "Portobello mushroom", aliases: ["portobello", "portabella"], unit: "g", servingSize: 100, kcal: 22, protein_g: 2.1, carbs_g: 3.9, fat_g: 0.4, category: "produce" },
  { id: "asparagus", name: "Asparagus (cooked)", aliases: ["asparagus"], unit: "g", servingSize: 100, kcal: 22, protein_g: 2.4, carbs_g: 4, fat_g: 0.2, category: "produce" },
  { id: "green-beans", name: "Green beans (cooked)", aliases: ["green beans", "string beans"], unit: "g", servingSize: 100, kcal: 35, protein_g: 1.9, carbs_g: 8, fat_g: 0.3, category: "produce" },
  { id: "celery", name: "Celery", aliases: ["celery"], unit: "g", servingSize: 100, kcal: 16, protein_g: 0.7, carbs_g: 3, fat_g: 0.2, category: "produce" },
  { id: "eggplant", name: "Eggplant (cooked)", aliases: ["eggplant", "aubergine"], unit: "g", servingSize: 100, kcal: 35, protein_g: 0.8, carbs_g: 9, fat_g: 0.2, category: "produce" },
  { id: "squash-butternut", name: "Butternut squash (cooked)", aliases: ["butternut", "squash"], unit: "g", servingSize: 100, kcal: 40, protein_g: 0.9, carbs_g: 10, fat_g: 0.1, category: "produce" },
  { id: "beet", name: "Beet / beetroot (cooked)", aliases: ["beet", "beets", "beetroot"], unit: "g", servingSize: 100, kcal: 44, protein_g: 1.7, carbs_g: 10, fat_g: 0.2, category: "produce" },
  { id: "radish", name: "Radish", aliases: ["radish", "radishes"], unit: "g", servingSize: 100, kcal: 16, protein_g: 0.7, carbs_g: 3.4, fat_g: 0.1, category: "produce" },
  { id: "artichoke", name: "Artichoke hearts", aliases: ["artichoke"], unit: "g", servingSize: 100, kcal: 47, protein_g: 3.3, carbs_g: 11, fat_g: 0.2, category: "produce" },
  { id: "okra", name: "Okra (cooked)", aliases: ["okra"], unit: "g", servingSize: 100, kcal: 22, protein_g: 1.9, carbs_g: 4.5, fat_g: 0.2, category: "produce" },
  { id: "bok-choy", name: "Bok choy (cooked)", aliases: ["bok choy", "pak choi"], unit: "g", servingSize: 100, kcal: 12, protein_g: 1.6, carbs_g: 1.8, fat_g: 0.2, category: "produce" },
  { id: "cabbage-napa", name: "Napa cabbage", aliases: ["napa", "napa cabbage", "chinese cabbage"], unit: "g", servingSize: 100, kcal: 13, protein_g: 1.2, carbs_g: 2.2, fat_g: 0.2, category: "produce" },
  { id: "pickle", name: "Dill pickle spear", aliases: ["pickle", "pickles"], unit: "each", servingSize: 1, kcal: 4, protein_g: 0.2, carbs_g: 0.8, fat_g: 0.1, gramsPerUnit: 35, category: "pantry" },
  { id: "sauerkraut", name: "Sauerkraut", aliases: ["sauerkraut"], unit: "g", servingSize: 100, kcal: 19, protein_g: 0.9, carbs_g: 4.3, fat_g: 0.1, category: "pantry" },
  { id: "kimchi", name: "Kimchi", aliases: ["kimchi"], unit: "g", servingSize: 100, kcal: 15, protein_g: 1.1, carbs_g: 2.4, fat_g: 0.5, category: "pantry" },
  { id: "olives", name: "Olives green", aliases: ["olive", "olives"], unit: "g", servingSize: 100, kcal: 145, protein_g: 1, carbs_g: 3.8, fat_g: 15, category: "pantry" },
  { id: "olives-black", name: "Olives black / Kalamata", aliases: ["kalamata", "black olives"], unit: "g", servingSize: 100, kcal: 145, protein_g: 1, carbs_g: 4, fat_g: 14, category: "pantry" },

  // ── Fats, nuts, seeds, oils ────────────────────────────────────
  { id: "olive-oil", name: "Olive oil", aliases: ["olive oil", "oil", "evoo"], unit: "tbsp", servingSize: 1, kcal: 119, protein_g: 0, carbs_g: 0, fat_g: 13.5, gramsPerUnit: 14, category: "pantry" },
  { id: "avocado-oil", name: "Avocado oil", aliases: ["avocado oil"], unit: "tbsp", servingSize: 1, kcal: 124, protein_g: 0, carbs_g: 0, fat_g: 14, gramsPerUnit: 14, category: "pantry" },
  { id: "coconut-oil", name: "Coconut oil", aliases: ["coconut oil"], unit: "tbsp", servingSize: 1, kcal: 121, protein_g: 0, carbs_g: 0, fat_g: 13.5, gramsPerUnit: 14, category: "pantry" },
  { id: "canola-oil", name: "Canola / vegetable oil", aliases: ["canola", "vegetable oil", "veg oil"], unit: "tbsp", servingSize: 1, kcal: 124, protein_g: 0, carbs_g: 0, fat_g: 14, gramsPerUnit: 14, category: "pantry" },
  { id: "sesame-oil", name: "Sesame oil", aliases: ["sesame oil"], unit: "tbsp", servingSize: 1, kcal: 120, protein_g: 0, carbs_g: 0, fat_g: 13.6, gramsPerUnit: 14, category: "pantry" },
  { id: "mayo", name: "Mayonnaise", aliases: ["mayo", "mayonnaise"], unit: "tbsp", servingSize: 1, kcal: 94, protein_g: 0.1, carbs_g: 0.1, fat_g: 10, gramsPerUnit: 14, category: "pantry" },
  { id: "mayo-light", name: "Mayonnaise light", aliases: ["light mayo", "low fat mayo"], unit: "tbsp", servingSize: 1, kcal: 35, protein_g: 0.1, carbs_g: 2, fat_g: 3, gramsPerUnit: 15, category: "pantry" },
  { id: "almonds", name: "Almonds", aliases: ["almond", "almonds"], unit: "g", servingSize: 100, kcal: 579, protein_g: 21, carbs_g: 22, fat_g: 50, category: "pantry" },
  { id: "walnuts", name: "Walnuts", aliases: ["walnut", "walnuts"], unit: "g", servingSize: 100, kcal: 654, protein_g: 15, carbs_g: 14, fat_g: 65, category: "pantry" },
  { id: "cashews", name: "Cashews", aliases: ["cashew", "cashews"], unit: "g", servingSize: 100, kcal: 553, protein_g: 18, carbs_g: 30, fat_g: 44, category: "pantry" },
  { id: "peanuts", name: "Peanuts", aliases: ["peanut", "peanuts"], unit: "g", servingSize: 100, kcal: 567, protein_g: 26, carbs_g: 16, fat_g: 49, category: "pantry" },
  { id: "pistachios", name: "Pistachios", aliases: ["pistachio", "pistachios"], unit: "g", servingSize: 100, kcal: 560, protein_g: 20, carbs_g: 28, fat_g: 45, category: "pantry" },
  { id: "macadamia", name: "Macadamia nuts", aliases: ["macadamia"], unit: "g", servingSize: 100, kcal: 718, protein_g: 8, carbs_g: 14, fat_g: 76, category: "pantry" },
  { id: "pecans", name: "Pecans", aliases: ["pecan", "pecans"], unit: "g", servingSize: 100, kcal: 691, protein_g: 9, carbs_g: 14, fat_g: 72, category: "pantry" },
  { id: "hazelnuts", name: "Hazelnuts", aliases: ["hazelnut", "hazelnuts"], unit: "g", servingSize: 100, kcal: 628, protein_g: 15, carbs_g: 17, fat_g: 61, category: "pantry" },
  { id: "mixed-nuts", name: "Mixed nuts unsalted", aliases: ["mixed nuts", "trail mix nuts"], unit: "g", servingSize: 100, kcal: 607, protein_g: 20, carbs_g: 21, fat_g: 54, category: "pantry" },
  { id: "peanut-butter", name: "Peanut butter", aliases: ["peanut butter", "pb"], unit: "tbsp", servingSize: 1, kcal: 94, protein_g: 4, carbs_g: 3, fat_g: 8, gramsPerUnit: 16, category: "pantry" },
  { id: "almond-butter", name: "Almond butter", aliases: ["almond butter"], unit: "tbsp", servingSize: 1, kcal: 98, protein_g: 3.4, carbs_g: 3, fat_g: 9, gramsPerUnit: 16, category: "pantry" },
  { id: "chia", name: "Chia seeds", aliases: ["chia", "chia seeds"], unit: "g", servingSize: 100, kcal: 486, protein_g: 17, carbs_g: 42, fat_g: 31, category: "pantry" },
  { id: "flax", name: "Flaxseed ground", aliases: ["flax", "flaxseed", "linseed"], unit: "g", servingSize: 100, kcal: 534, protein_g: 18, carbs_g: 29, fat_g: 42, category: "pantry" },
  { id: "hemp-seeds", name: "Hemp seeds / hearts", aliases: ["hemp", "hemp seeds", "hemp hearts"], unit: "g", servingSize: 100, kcal: 553, protein_g: 32, carbs_g: 9, fat_g: 49, category: "pantry" },
  { id: "pumpkin-seeds", name: "Pumpkin seeds / pepitas", aliases: ["pumpkin seeds", "pepitas"], unit: "g", servingSize: 100, kcal: 559, protein_g: 30, carbs_g: 11, fat_g: 49, category: "pantry" },
  { id: "sunflower-seeds", name: "Sunflower seeds", aliases: ["sunflower seeds"], unit: "g", servingSize: 100, kcal: 584, protein_g: 21, carbs_g: 20, fat_g: 51, category: "pantry" },
  { id: "sesame-seeds", name: "Sesame seeds", aliases: ["sesame", "sesame seeds"], unit: "g", servingSize: 100, kcal: 573, protein_g: 17, carbs_g: 23, fat_g: 50, category: "pantry" },
  { id: "tahini", name: "Tahini / sesame paste", aliases: ["tahini"], unit: "tbsp", servingSize: 1, kcal: 89, protein_g: 2.6, carbs_g: 3.2, fat_g: 8, gramsPerUnit: 15, category: "pantry" },

  // ── Condiments, sauces & baking ────────────────────────────────
  { id: "ketchup", name: "Ketchup", aliases: ["ketchup", "catsup"], unit: "tbsp", servingSize: 1, kcal: 17, protein_g: 0.2, carbs_g: 4.5, fat_g: 0, gramsPerUnit: 17, category: "pantry" },
  { id: "mustard", name: "Mustard yellow", aliases: ["mustard"], unit: "tsp", servingSize: 1, kcal: 3, protein_g: 0.2, carbs_g: 0.3, fat_g: 0.2, gramsPerUnit: 5, category: "pantry" },
  { id: "hot-sauce", name: "Hot sauce", aliases: ["hot sauce", "sriracha", "tabasco"], unit: "tsp", servingSize: 1, kcal: 1, protein_g: 0, carbs_g: 0.2, fat_g: 0, gramsPerUnit: 5, category: "pantry" },
  { id: "soy-sauce", name: "Soy sauce", aliases: ["soy sauce", "shoyu"], unit: "tbsp", servingSize: 1, kcal: 8, protein_g: 1.3, carbs_g: 0.8, fat_g: 0, gramsPerUnit: 16, category: "pantry" },
  { id: "soy-sauce-low", name: "Soy sauce low-sodium", aliases: ["low sodium soy", "lite soy"], unit: "tbsp", servingSize: 1, kcal: 8, protein_g: 1.3, carbs_g: 0.8, fat_g: 0, gramsPerUnit: 16, category: "pantry" },
  { id: "teriyaki", name: "Teriyaki sauce", aliases: ["teriyaki"], unit: "tbsp", servingSize: 1, kcal: 15, protein_g: 0.6, carbs_g: 2.5, fat_g: 0, gramsPerUnit: 18, category: "pantry" },
  { id: "bbq-sauce", name: "BBQ sauce", aliases: ["bbq", "barbecue sauce"], unit: "tbsp", servingSize: 1, kcal: 29, protein_g: 0.2, carbs_g: 7, fat_g: 0.1, gramsPerUnit: 17, category: "pantry" },
  { id: "salsa", name: "Salsa", aliases: ["salsa"], unit: "g", servingSize: 100, kcal: 36, protein_g: 1.5, carbs_g: 7, fat_g: 0.2, category: "pantry" },
  { id: "tomato-sauce", name: "Tomato pasta sauce", aliases: ["pasta sauce", "marinara", "tomato sauce"], unit: "g", servingSize: 100, kcal: 51, protein_g: 1.5, carbs_g: 8, fat_g: 1.5, category: "pantry" },
  { id: "tomato-paste", name: "Tomato paste", aliases: ["tomato paste"], unit: "g", servingSize: 100, kcal: 82, protein_g: 4.3, carbs_g: 19, fat_g: 0.5, category: "pantry" },
  { id: "pesto", name: "Pesto", aliases: ["pesto"], unit: "g", servingSize: 100, kcal: 263, protein_g: 5, carbs_g: 6, fat_g: 25, category: "pantry" },
  { id: "ranch", name: "Ranch dressing", aliases: ["ranch"], unit: "tbsp", servingSize: 1, kcal: 65, protein_g: 0.3, carbs_g: 1, fat_g: 6.7, gramsPerUnit: 15, category: "pantry" },
  { id: "italian-dressing", name: "Italian dressing", aliases: ["italian dressing"], unit: "tbsp", servingSize: 1, kcal: 35, protein_g: 0, carbs_g: 1.5, fat_g: 3.3, gramsPerUnit: 14, category: "pantry" },
  { id: "balsamic", name: "Balsamic vinegar", aliases: ["balsamic", "vinegar balsamic"], unit: "tbsp", servingSize: 1, kcal: 14, protein_g: 0.1, carbs_g: 2.7, fat_g: 0, gramsPerUnit: 16, category: "pantry" },
  { id: "apple-cider-vinegar", name: "Apple cider vinegar", aliases: ["acv", "apple cider vinegar"], unit: "tbsp", servingSize: 1, kcal: 3, protein_g: 0, carbs_g: 0.1, fat_g: 0, gramsPerUnit: 15, category: "pantry" },
  { id: "honey", name: "Honey", aliases: ["honey"], unit: "tbsp", servingSize: 1, kcal: 64, protein_g: 0.1, carbs_g: 17, fat_g: 0, gramsPerUnit: 21, category: "pantry" },
  { id: "maple-syrup", name: "Maple syrup", aliases: ["maple", "maple syrup"], unit: "tbsp", servingSize: 1, kcal: 52, protein_g: 0, carbs_g: 13, fat_g: 0, gramsPerUnit: 20, category: "pantry" },
  { id: "agave", name: "Agave nectar", aliases: ["agave"], unit: "tbsp", servingSize: 1, kcal: 60, protein_g: 0, carbs_g: 16, fat_g: 0, gramsPerUnit: 21, category: "pantry" },
  { id: "sugar", name: "Sugar white", aliases: ["sugar", "white sugar"], unit: "tsp", servingSize: 1, kcal: 16, protein_g: 0, carbs_g: 4.2, fat_g: 0, gramsPerUnit: 4, category: "pantry" },
  { id: "brown-sugar", name: "Brown sugar", aliases: ["brown sugar"], unit: "tsp", servingSize: 1, kcal: 17, protein_g: 0, carbs_g: 4.5, fat_g: 0, gramsPerUnit: 4.5, category: "pantry" },
  { id: "stevia", name: "Stevia sweetener packet", aliases: ["stevia"], unit: "each", servingSize: 1, kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, gramsPerUnit: 1, category: "pantry" },
  { id: "flour-ap", name: "All-purpose flour", aliases: ["flour", "ap flour", "wheat flour"], unit: "g", servingSize: 100, kcal: 364, protein_g: 10, carbs_g: 76, fat_g: 1, category: "pantry" },
  { id: "flour-almond", name: "Almond flour", aliases: ["almond flour", "almond meal"], unit: "g", servingSize: 100, kcal: 571, protein_g: 21, carbs_g: 19, fat_g: 50, category: "pantry" },
  { id: "flour-coconut", name: "Coconut flour", aliases: ["coconut flour"], unit: "g", servingSize: 100, kcal: 400, protein_g: 18, carbs_g: 60, fat_g: 13, category: "pantry" },
  { id: "cornstarch", name: "Cornstarch", aliases: ["cornstarch", "corn starch", "cornflour"], unit: "tbsp", servingSize: 1, kcal: 30, protein_g: 0, carbs_g: 7.3, fat_g: 0, gramsPerUnit: 8, category: "pantry" },
  { id: "baking-powder", name: "Baking powder", aliases: ["baking powder"], unit: "tsp", servingSize: 1, kcal: 2, protein_g: 0, carbs_g: 1, fat_g: 0, gramsPerUnit: 4, category: "pantry" },
  { id: "cocoa-powder", name: "Cocoa powder unsweetened", aliases: ["cocoa", "cocoa powder"], unit: "tbsp", servingSize: 1, kcal: 12, protein_g: 1, carbs_g: 3, fat_g: 0.7, gramsPerUnit: 5, category: "pantry" },
  { id: "vanilla", name: "Vanilla extract", aliases: ["vanilla", "vanilla extract"], unit: "tsp", servingSize: 1, kcal: 12, protein_g: 0, carbs_g: 0.5, fat_g: 0, gramsPerUnit: 4, category: "pantry" },
  { id: "stock-chicken", name: "Chicken broth low-sodium", aliases: ["chicken broth", "chicken stock", "stock"], unit: "ml", servingSize: 100, kcal: 7, protein_g: 0.8, carbs_g: 0.5, fat_g: 0.2, category: "pantry" },
  { id: "stock-veg", name: "Vegetable broth", aliases: ["veg broth", "vegetable stock"], unit: "ml", servingSize: 100, kcal: 5, protein_g: 0.2, carbs_g: 1, fat_g: 0, category: "pantry" },
  { id: "coconut-aminos", name: "Coconut aminos", aliases: ["coconut aminos"], unit: "tbsp", servingSize: 1, kcal: 10, protein_g: 0, carbs_g: 2, fat_g: 0, gramsPerUnit: 15, category: "pantry" },

  // ── Drinks ─────────────────────────────────────────────────────
  { id: "coffee-black", name: "Coffee black", aliases: ["coffee", "black coffee"], unit: "ml", servingSize: 100, kcal: 1, protein_g: 0.1, carbs_g: 0, fat_g: 0, category: "other" },
  { id: "espresso", name: "Espresso shot", aliases: ["espresso"], unit: "each", servingSize: 1, kcal: 3, protein_g: 0.1, carbs_g: 0.5, fat_g: 0.1, gramsPerUnit: 30, category: "other" },
  { id: "latte", name: "Latte (whole milk, 12 oz)", aliases: ["latte", "cafe latte"], unit: "each", servingSize: 1, kcal: 150, protein_g: 8, carbs_g: 12, fat_g: 8, gramsPerUnit: 355, category: "other" },
  { id: "tea-black", name: "Black tea unsweetened", aliases: ["tea", "black tea"], unit: "ml", servingSize: 100, kcal: 1, protein_g: 0, carbs_g: 0.3, fat_g: 0, category: "other" },
  { id: "tea-green", name: "Green tea unsweetened", aliases: ["green tea"], unit: "ml", servingSize: 100, kcal: 1, protein_g: 0, carbs_g: 0, fat_g: 0, category: "other" },
  { id: "orange-juice", name: "Orange juice", aliases: ["oj", "orange juice"], unit: "ml", servingSize: 100, kcal: 45, protein_g: 0.7, carbs_g: 10, fat_g: 0.2, category: "other" },
  { id: "apple-juice", name: "Apple juice", aliases: ["apple juice"], unit: "ml", servingSize: 100, kcal: 46, protein_g: 0.1, carbs_g: 11, fat_g: 0.1, category: "other" },
  { id: "soda", name: "Regular soda / cola", aliases: ["soda", "coke", "cola", "pop"], unit: "ml", servingSize: 100, kcal: 42, protein_g: 0, carbs_g: 10.6, fat_g: 0, category: "other" },
  { id: "soda-diet", name: "Diet soda / zero cola", aliases: ["diet soda", "diet coke", "zero coke", "coke zero"], unit: "ml", servingSize: 100, kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, category: "other" },
  { id: "sports-drink", name: "Sports drink (Gatorade-style)", aliases: ["gatorade", "sports drink", "electrolyte drink"], unit: "ml", servingSize: 100, kcal: 24, protein_g: 0, carbs_g: 6, fat_g: 0, category: "other" },
  { id: "energy-drink", name: "Energy drink", aliases: ["energy drink", "red bull", "monster"], unit: "ml", servingSize: 100, kcal: 45, protein_g: 0, carbs_g: 11, fat_g: 0, category: "other" },
  { id: "beer", name: "Beer", aliases: ["beer"], unit: "ml", servingSize: 100, kcal: 43, protein_g: 0.5, carbs_g: 3.6, fat_g: 0, category: "other" },
  { id: "beer-light", name: "Light beer", aliases: ["light beer", "lite beer"], unit: "ml", servingSize: 100, kcal: 29, protein_g: 0.2, carbs_g: 1.3, fat_g: 0, category: "other" },
  { id: "wine", name: "Wine red", aliases: ["wine", "red wine"], unit: "ml", servingSize: 100, kcal: 85, protein_g: 0.1, carbs_g: 2.6, fat_g: 0, category: "other" },
  { id: "wine-white", name: "Wine white", aliases: ["white wine"], unit: "ml", servingSize: 100, kcal: 82, protein_g: 0.1, carbs_g: 2.6, fat_g: 0, category: "other" },
  { id: "champagne", name: "Champagne / sparkling wine", aliases: ["champagne", "prosecco", "sparkling wine"], unit: "ml", servingSize: 100, kcal: 84, protein_g: 0.3, carbs_g: 1.5, fat_g: 0, category: "other" },
  { id: "vodka", name: "Vodka (shot 44 ml)", aliases: ["vodka"], unit: "each", servingSize: 1, kcal: 97, protein_g: 0, carbs_g: 0, fat_g: 0, gramsPerUnit: 44, category: "other" },
  { id: "whiskey", name: "Whiskey / whisky (shot 44 ml)", aliases: ["whiskey", "whisky", "bourbon"], unit: "each", servingSize: 1, kcal: 97, protein_g: 0, carbs_g: 0, fat_g: 0, gramsPerUnit: 44, category: "other" },
  { id: "protein-shake-rt", name: "Ready-to-drink protein shake", aliases: ["protein shake", "premier protein", "fairlife shake"], unit: "each", servingSize: 1, kcal: 160, protein_g: 30, carbs_g: 5, fat_g: 3, gramsPerUnit: 325, category: "other" },
  { id: "smoothie-green", name: "Green smoothie (typical)", aliases: ["green smoothie", "smoothie"], unit: "ml", servingSize: 100, kcal: 45, protein_g: 1.5, carbs_g: 9, fat_g: 0.5, category: "other" },
  { id: "coconut-water", name: "Coconut water", aliases: ["coconut water"], unit: "ml", servingSize: 100, kcal: 19, protein_g: 0.7, carbs_g: 3.7, fat_g: 0.2, category: "other" },
  { id: "water", name: "Water", aliases: ["water"], unit: "ml", servingSize: 100, kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, category: "other" },

  // ── Snacks, sweets & prepared ──────────────────────────────────
  { id: "dark-chocolate", name: "Dark chocolate 70%", aliases: ["chocolate", "dark chocolate"], unit: "g", servingSize: 100, kcal: 598, protein_g: 7.8, carbs_g: 46, fat_g: 43, category: "pantry" },
  { id: "milk-chocolate", name: "Milk chocolate", aliases: ["milk chocolate"], unit: "g", servingSize: 100, kcal: 535, protein_g: 8, carbs_g: 59, fat_g: 30, category: "pantry" },
  { id: "ice-cream", name: "Ice cream vanilla", aliases: ["ice cream"], unit: "g", servingSize: 100, kcal: 207, protein_g: 3.5, carbs_g: 24, fat_g: 11, category: "frozen" },
  { id: "ice-cream-light", name: "Ice cream light / low-fat", aliases: ["light ice cream", "low fat ice cream"], unit: "g", servingSize: 100, kcal: 140, protein_g: 4, carbs_g: 24, fat_g: 3, category: "frozen" },
  { id: "frozen-yogurt", name: "Frozen yogurt", aliases: ["froyo", "frozen yogurt"], unit: "g", servingSize: 100, kcal: 127, protein_g: 3, carbs_g: 22, fat_g: 3.5, category: "frozen" },
  { id: "gelato", name: "Gelato", aliases: ["gelato"], unit: "g", servingSize: 100, kcal: 180, protein_g: 3.5, carbs_g: 24, fat_g: 8, category: "frozen" },
  { id: "popsicle", name: "Fruit popsicle", aliases: ["popsicle", "ice pop"], unit: "each", servingSize: 1, kcal: 40, protein_g: 0, carbs_g: 10, fat_g: 0, gramsPerUnit: 50, category: "frozen" },
  { id: "pizza-slice", name: "Pizza cheese slice", aliases: ["pizza", "pizza slice"], unit: "slice", servingSize: 1, kcal: 285, protein_g: 12, carbs_g: 36, fat_g: 10, gramsPerUnit: 107, category: "other" },
  { id: "pizza-pepperoni", name: "Pizza pepperoni slice", aliases: ["pepperoni pizza"], unit: "slice", servingSize: 1, kcal: 298, protein_g: 13, carbs_g: 34, fat_g: 12, gramsPerUnit: 110, category: "other" },
  { id: "burger", name: "Hamburger (fast food)", aliases: ["burger", "hamburger"], unit: "each", servingSize: 1, kcal: 540, protein_g: 25, carbs_g: 40, fat_g: 30, gramsPerUnit: 200, category: "other" },
  { id: "cheeseburger", name: "Cheeseburger (fast food)", aliases: ["cheeseburger"], unit: "each", servingSize: 1, kcal: 300, protein_g: 15, carbs_g: 33, fat_g: 12, gramsPerUnit: 120, category: "other" },
  { id: "fries", name: "French fries", aliases: ["fries", "chips", "french fries"], unit: "g", servingSize: 100, kcal: 312, protein_g: 3.4, carbs_g: 41, fat_g: 15, category: "frozen" },
  { id: "onion-rings", name: "Onion rings", aliases: ["onion rings"], unit: "g", servingSize: 100, kcal: 411, protein_g: 4, carbs_g: 38, fat_g: 27, category: "frozen" },
  { id: "nuggets", name: "Chicken nuggets", aliases: ["nuggets", "chicken nuggets"], unit: "g", servingSize: 100, kcal: 296, protein_g: 15, carbs_g: 16, fat_g: 20, category: "frozen" },
  { id: "fish-sticks", name: "Fish sticks / fish fingers", aliases: ["fish sticks", "fish fingers"], unit: "g", servingSize: 100, kcal: 250, protein_g: 11, carbs_g: 20, fat_g: 14, category: "frozen" },
  { id: "burrito", name: "Bean & cheese burrito", aliases: ["burrito"], unit: "each", servingSize: 1, kcal: 390, protein_g: 14, carbs_g: 55, fat_g: 13, gramsPerUnit: 200, category: "other" },
  { id: "taco", name: "Beef taco (hard shell)", aliases: ["taco"], unit: "each", servingSize: 1, kcal: 170, protein_g: 8, carbs_g: 13, fat_g: 10, gramsPerUnit: 70, category: "other" },
  { id: "sushi-roll", name: "Sushi roll (6–8 pieces, typical)", aliases: ["sushi", "sushi roll", "california roll"], unit: "each", servingSize: 1, kcal: 300, protein_g: 9, carbs_g: 45, fat_g: 8, gramsPerUnit: 180, category: "other" },
  { id: "ramen-bowl", name: "Ramen bowl restaurant-style", aliases: ["ramen bowl"], unit: "each", servingSize: 1, kcal: 500, protein_g: 18, carbs_g: 65, fat_g: 18, gramsPerUnit: 500, category: "other" },
  { id: "pad-thai", name: "Pad Thai (typical plate)", aliases: ["pad thai"], unit: "g", servingSize: 100, kcal: 170, protein_g: 7, carbs_g: 22, fat_g: 6, category: "other" },
  { id: "curry-chicken", name: "Chicken curry with sauce", aliases: ["curry", "chicken curry"], unit: "g", servingSize: 100, kcal: 140, protein_g: 12, carbs_g: 6, fat_g: 8, category: "other" },
  { id: "chili", name: "Chili with beans & beef", aliases: ["chili", "chilli"], unit: "g", servingSize: 100, kcal: 110, protein_g: 8, carbs_g: 10, fat_g: 4, category: "other" },
  { id: "soup-chicken-noodle", name: "Chicken noodle soup", aliases: ["chicken noodle", "chicken soup"], unit: "g", servingSize: 100, kcal: 35, protein_g: 2.5, carbs_g: 4, fat_g: 1, category: "other" },
  { id: "soup-tomato", name: "Tomato soup", aliases: ["tomato soup"], unit: "g", servingSize: 100, kcal: 55, protein_g: 1.5, carbs_g: 10, fat_g: 1, category: "other" },
  { id: "mac-cheese", name: "Mac and cheese", aliases: ["mac and cheese", "macaroni cheese"], unit: "g", servingSize: 100, kcal: 164, protein_g: 6.5, carbs_g: 20, fat_g: 6.5, category: "other" },
  { id: "lasagna", name: "Lasagna meat", aliases: ["lasagna", "lasagne"], unit: "g", servingSize: 100, kcal: 135, protein_g: 8, carbs_g: 12, fat_g: 6, category: "other" },
  { id: "sandwich-turkey", name: "Turkey sandwich", aliases: ["turkey sandwich"], unit: "each", servingSize: 1, kcal: 320, protein_g: 22, carbs_g: 35, fat_g: 10, gramsPerUnit: 200, category: "other" },
  { id: "pbj", name: "PB&J sandwich", aliases: ["pbj", "peanut butter jelly"], unit: "each", servingSize: 1, kcal: 370, protein_g: 12, carbs_g: 48, fat_g: 15, gramsPerUnit: 100, category: "other" },
  { id: "oatmeal-cookie", name: "Oatmeal cookie", aliases: ["oatmeal cookie", "cookie"], unit: "each", servingSize: 1, kcal: 113, protein_g: 1.6, carbs_g: 17, fat_g: 4.5, gramsPerUnit: 25, category: "other" },
  { id: "brownie", name: "Brownie", aliases: ["brownie"], unit: "each", servingSize: 1, kcal: 243, protein_g: 3, carbs_g: 35, fat_g: 11, gramsPerUnit: 56, category: "other" },
  { id: "donut", name: "Glazed donut", aliases: ["donut", "doughnut"], unit: "each", servingSize: 1, kcal: 260, protein_g: 3, carbs_g: 31, fat_g: 14, gramsPerUnit: 60, category: "other" },
  { id: "muffin-blueberry", name: "Blueberry muffin", aliases: ["muffin", "blueberry muffin"], unit: "each", servingSize: 1, kcal: 385, protein_g: 5, carbs_g: 54, fat_g: 16, gramsPerUnit: 113, category: "other" },
  { id: "pancake", name: "Pancake (medium, plain)", aliases: ["pancake", "pancakes"], unit: "each", servingSize: 1, kcal: 86, protein_g: 2.4, carbs_g: 15, fat_g: 1.7, gramsPerUnit: 38, category: "other" },
  { id: "waffle", name: "Waffle (plain, square)", aliases: ["waffle"], unit: "each", servingSize: 1, kcal: 103, protein_g: 2.7, carbs_g: 16, fat_g: 3.3, gramsPerUnit: 35, category: "other" },
  { id: "french-toast", name: "French toast (1 slice)", aliases: ["french toast"], unit: "slice", servingSize: 1, kcal: 149, protein_g: 5, carbs_g: 16, fat_g: 7, gramsPerUnit: 65, category: "other" },
  { id: "protein-bar", name: "Protein bar (typical)", aliases: ["protein bar", "quest bar", "rxbar"], unit: "each", servingSize: 1, kcal: 200, protein_g: 20, carbs_g: 22, fat_g: 7, gramsPerUnit: 60, category: "pantry" },
  { id: "granola-bar", name: "Granola bar", aliases: ["granola bar", "cereal bar"], unit: "each", servingSize: 1, kcal: 120, protein_g: 2, carbs_g: 20, fat_g: 4, gramsPerUnit: 28, category: "pantry" },
  { id: "popcorn", name: "Popcorn air-popped", aliases: ["popcorn"], unit: "g", servingSize: 100, kcal: 387, protein_g: 13, carbs_g: 78, fat_g: 4.5, category: "pantry" },
  { id: "chips-potato", name: "Potato chips", aliases: ["potato chips", "crisps", "lays"], unit: "g", servingSize: 100, kcal: 536, protein_g: 7, carbs_g: 53, fat_g: 35, category: "pantry" },
  { id: "pretzels", name: "Pretzels", aliases: ["pretzel", "pretzels"], unit: "g", servingSize: 100, kcal: 380, protein_g: 10, carbs_g: 80, fat_g: 3, category: "pantry" },
  { id: "tortilla-chips", name: "Tortilla chips", aliases: ["tortilla chips", "nacho chips"], unit: "g", servingSize: 100, kcal: 500, protein_g: 7, carbs_g: 65, fat_g: 24, category: "pantry" },
  { id: "guacamole", name: "Guacamole", aliases: ["guac", "guacamole"], unit: "g", servingSize: 100, kcal: 150, protein_g: 2, carbs_g: 8, fat_g: 14, category: "produce" },
];

export const SHOPPING_CATEGORY_LABELS: Record<ShoppingCategory, string> = {
  produce: "Produce",
  protein: "Meat, fish & protein",
  dairy: "Dairy & eggs",
  grains: "Grains & bread",
  pantry: "Pantry & dry goods",
  frozen: "Frozen",
  other: "Other",
};

export const SHOPPING_CATEGORY_ORDER: ShoppingCategory[] = [
  "produce",
  "protein",
  "dairy",
  "grains",
  "pantry",
  "frozen",
  "other",
];

export type MacroTotals = {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export function searchFoods(query: string, limit = 12): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return FOOD_DB.slice(0, limit);

  const scored = FOOD_DB.map((f) => {
    const name = f.name.toLowerCase();
    const aliasHit = f.aliases.some(
      (a) => a === q || a.includes(q) || q.includes(a)
    );
    let score = 0;
    if (name === q || f.aliases.includes(q)) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (aliasHit) score = 70;
    else if (name.includes(q)) score = 50;
    else if (f.aliases.some((a) => a.includes(q))) score = 40;
    return { f, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.f);
}

export function findFoodById(id: string): FoodItem | undefined {
  return FOOD_DB.find((f) => f.id === id);
}

/** Scale macros by amount in the food's native unit */
export function scaleFood(food: FoodItem, amount: number): MacroTotals {
  if (!amount || amount <= 0) {
    return { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  }
  const factor = amount / food.servingSize;
  return {
    kcal: Math.round(food.kcal * factor),
    protein_g: Math.round(food.protein_g * factor * 10) / 10,
    carbs_g: Math.round(food.carbs_g * factor * 10) / 10,
    fat_g: Math.round(food.fat_g * factor * 10) / 10,
  };
}

export function sumMacros(items: MacroTotals[]): MacroTotals {
  return items.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein_g: Math.round((acc.protein_g + m.protein_g) * 10) / 10,
      carbs_g: Math.round((acc.carbs_g + m.carbs_g) * 10) / 10,
      fat_g: Math.round((acc.fat_g + m.fat_g) * 10) / 10,
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

export function unitLabel(unit: FoodUnit): string {
  switch (unit) {
    case "g":
      return "g";
    case "ml":
      return "ml";
    case "each":
      return "piece(s)";
    case "cup":
      return "cup(s)";
    case "tbsp":
      return "tbsp";
    case "tsp":
      return "tsp";
    case "slice":
      return "slice(s)";
    case "oz":
      return "oz";
    default:
      return unit;
  }
}

/** Parse free text like "200g chicken" or "2 eggs" */
export function parseQuickLine(line: string): {
  amount: number;
  unitHint?: string;
  query: string;
} | null {
  const s = line.trim();
  if (!s) return null;

  // "2 eggs", "200g chicken", "1.5 cups rice", "1 tbsp olive oil"
  const m = s.match(
    /^(\d+(?:\.\d+)?)\s*(g|kg|ml|oz|tbsp|tsp|cup|cups|slice|slices|x)?\s*(.+)$/i
  );
  if (m) {
    let amount = parseFloat(m[1]);
    let unitHint = (m[2] || "").toLowerCase();
    let query = m[3].trim();
    if (unitHint === "kg") {
      amount *= 1000;
      unitHint = "g";
    }
    if (unitHint === "cups") unitHint = "cup";
    if (unitHint === "slices") unitHint = "slice";
    if (unitHint === "x" || !unitHint) unitHint = "";
    return { amount, unitHint: unitHint || undefined, query };
  }

  // "chicken 200g"
  const m2 = s.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(g|kg|ml|oz)?$/i);
  if (m2) {
    let amount = parseFloat(m2[2]);
    let unitHint = (m2[3] || "g").toLowerCase();
    if (unitHint === "kg") {
      amount *= 1000;
      unitHint = "g";
    }
    return { amount, unitHint, query: m2[1].trim() };
  }

  return { amount: 100, unitHint: "g", query: s };
}

/**
 * Resolve a quick line against the DB.
 * For piece foods, amount is count; for g foods, amount is grams.
 */
export function resolveQuickLine(line: string): {
  food: FoodItem;
  amount: number;
  macros: MacroTotals;
} | null {
  const parsed = parseQuickLine(line);
  if (!parsed) return null;
  const hits = searchFoods(parsed.query, 5);
  if (!hits.length) return null;

  const food = hits[0];
  let amount = parsed.amount;

  // If user said "2" for eggs (each), keep 2. If user said "200" for chicken, 200g.
  // If unit hint is g/ml and food is each, convert roughly via gramsPerUnit
  if (parsed.unitHint === "g" || parsed.unitHint === "ml") {
    if (food.unit === "each" || food.unit === "slice") {
      if (food.gramsPerUnit) {
        amount = amount / food.gramsPerUnit;
      }
    } else if (food.unit === "tbsp" && food.gramsPerUnit) {
      amount = amount / food.gramsPerUnit;
    } else if (food.unit === "g" || food.unit === "ml") {
      amount = parsed.amount;
    }
  } else if (!parsed.unitHint) {
    // bare number: if food is each/slice use count; else assume grams
    if (food.unit === "g" || food.unit === "ml") {
      // "chicken 150" style often grams if large number
      if (parsed.amount >= 20) amount = parsed.amount;
      else amount = parsed.amount * (food.servingSize || 100);
    }
  }

  return { food, amount, macros: scaleFood(food, amount) };
}
