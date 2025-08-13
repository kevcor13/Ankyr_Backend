import mongoose from "mongoose";


const NutritionSchema = new mongoose.Schema({
  calories: Number,
  protein_g: Number,
  carbs_g: Number,
  fat_g: Number,
  sugar_g: Number,
}, { _id: false });

const RecipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: String,
  timeMinutes: Number,


  // tags drive your chips (“By Goal”, “By Ingredient”, “Dietary Preferences”)
  goals: [{ type: String, enum: ['Build Muscle','Weight Loss','Energy','Pre-Workout','Snacks'] }],
  ingredient: [{ type: String, enum: ['Poultry','Beef','Seafood','Vegan'] }],
  dietary: [{ type: String, enum: ['Dairy-Free','Gluten-Free','Vegetarian','Vegan'] }],
  
  // content
  ingredients: [{ text: String }],
  instructions: [{ step: String }],
  
  nutrition: NutritionSchema,
  featured: { type: Boolean, default: false },
  favoriteCount: { type: Number, default: 0 },


}, {collection: 'Recipe'});

export const Recipe = mongoose.model('Recipe', RecipeSchema);


const savedMeals = new mongoose.Schema({
  userId: { type: String, required: true },
  mealId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true }],
}, { collection: 'SavedMeals' });

export const SavedMeals = mongoose.model('SavedMeals', savedMeals);
