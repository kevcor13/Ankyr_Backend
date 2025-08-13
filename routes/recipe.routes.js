import express from 'express';
import { getFeaturedRecipes, getFilteredRecipes, getMealById, addFavoriteMeal } from '../controllers/recipe.controllers.js';

const router = express.Router();
router.post('/getFeaturedRecipes', getFeaturedRecipes);
router.post('/getFilteredRecipes', getFilteredRecipes); // Assuming this is the same controller for filtering recipes
router.post('/getMealById', getMealById);
router.post('/addFavoriteMeal', addFavoriteMeal);

export default router;