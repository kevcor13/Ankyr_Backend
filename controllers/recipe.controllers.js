import {Recipe} from "../models/recipe.models.js";


export const getFeaturedRecipes = async (req, res) => {
  try {
      // Correctly query for documents where the 'featured' field is true.
      const recipes = await Recipe.find({ featured: true }).lean();
      // Handle the case where no featured recipes are found.
      if (!recipes || recipes.length === 0) {
          return res.status(200).json({
              status: "success",
              message: "No featured recipes found.",
              data: []
          });
      }

      // Return the array of featured recipes.
      return res.status(200).json({
          status: "success",
          message: "Successfully retrieved featured recipes.",
          data: recipes
      });

  } catch (error) {
      // Handle potential server errors.
      console.error("Error fetching featured recipes:", error);
      res.status(500).json({
          status: "error",
          message: "An internal server error occurred while fetching recipes."
      });
  }
};

export const getFilteredRecipes = async (req, res) => {
  try {
      const { filterType, filterValue } = req.body;
      console.log("Filter Type:", filterType);
      console.log("Filter Value:", filterValue);

      const query = { [filterType]: filterValue };
      console.log("Query:", query);
      // 4. Execute the query
      const recipes = await Recipe.find(query).lean();

      // 5. Handle the case where no recipes match the filter
      if (!recipes || recipes.length === 0) {
          return res.status(200).json({
              status: "success",
              message: `No recipes found for filter: ${filterValue}`,
              data: []
          });
      }

      // 6. Return the found recipes
      return res.status(200).json({
          status: "success",
          message: `Successfully retrieved recipes for filter: ${filterValue}`,
          data: recipes
      });

  } catch (error) {
      console.error("Error fetching filtered recipes:", error);
      res.status(500).json({
          status: "error",
          message: "An internal server error occurred while fetching recipes."
      });
  }
};

export const getMealById = async (req, res) => {
  try {
      const { mealId } = req.body;
      console.log("Meal ID:", mealId);

      // 2. Validate the mealId
      if (!mealId) {
          return res.status(400).json({
              status: "error",
              message: "Meal ID is required."
          });
      }

      // 3. Query the database for the meal by ID
      const meal = await Recipe.findById({_id: mealId}).lean();

      // 4. Handle the case where no meal is found
      if (!meal) {
          return res.status(404).json({
              status: "error",
              message: `No meal found with ID: ${mealId}`
          });
      }

      // 5. Return the found meal
      return res.status(200).json({
          status: "success",
          message: `Successfully retrieved meal with ID: ${mealId}`,
          data: meal
      });

  } catch (error) {
      console.error("Error fetching meal by ID:", error);
      res.status(500).json({
          status: "error",
          message: "An internal server error occurred while fetching the meal."
      });
  }
}

export const addFavoriteMeal = async (req, res) => {
  try {
      const { userId, mealId } = req.body;
      console.log("Meal ID to favorite:", mealId);

      // 2. Validate the mealId
      if (!mealId) {
          return res.status(400).json({
              status: "error",
              message: "Meal ID is required."
          });
      }

      // 3. Increment the favoriteCount for the specified meal
       await Recipe.findByIdAndUpdate(userId,
        { $addToSet: { mealId: mealId } 
      });

      console.log("Successfully added favorite to meal:", mealId);

  } catch (error) {
      console.error("Error adding favorite to meal:", error);
      res.status(500).json({
          status: "error",
          message: "An internal server error occurred while favoriting the meal."
      });
  }
}