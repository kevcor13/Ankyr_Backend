import axios from 'axios';
import e from 'express';

// --- Configuration ---

const YOUR_SERVER_URL = ' https://d93d5f728b2d.ngrok-free.app';

// This function sends a single exercise to YOUR server to be saved in the database
// Assume this is your existing function

function slugify(text) {
  if (!text) return '';
  return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-');        // Replace multiple - with single -
}

function generateRandomNutrition() {
  return {
      calories: Math.floor(Math.random() * (800 - 300 + 1)) + 300, // 300-800
      protein_g: Math.floor(Math.random() * (50 - 20 + 1)) + 20,    // 20-50
      carbs_g: Math.floor(Math.random() * (70 - 20 + 1)) + 20,      // 20-70
      fat_g: Math.floor(Math.random() * (40 - 10 + 1)) + 10,        // 10-40
      sugar_g: Math.floor(Math.random() * (25 - 5 + 1)) + 5,        // 5-25
  };
}

async function addRecipeToYourDb(recipeData) {
  try {
      // Format the data to match your RecipeSchema
      const formattedData = {
          title: recipeData.title,
          imageUrl: recipeData.imageUrl,
          timeMinutes: recipeData.timeMinutes,

          // These tags are already in the correct format in our custom data
          goals: recipeData.goals,
          ingredientsTags: recipeData.ingredientsTags,
          dietary: recipeData.dietary,
          
          // The schema requires an array of objects, so we map the strings.
          ingredients: recipeData.ingredients.map(item => ({ text: item })),
          instructions: recipeData.instructions.map(step => ({ step: step })),
          
          // For this example, we generate random nutrition data.
          // You could also add a 'nutrition' object directly to your customRecipes data.
          nutrition: generateRandomNutrition(),
          
          // These will use their default values (false and 0) as defined in the schema
          // featured: false, 
          // favoriteCount: 0,
      };

      console.log(`Sending "${formattedData.title}" to your server...`);
      // IMPORTANT: Make sure this endpoint matches your server's route for adding a recipe.
      const response = await axios.post(`${YOUR_SERVER_URL}/api/add-recipe`, formattedData);
      
      console.log(`Server Response: ${response.data.message}`);

  } catch (error) {
      // Handle case where a recipe with the same slug already exists (HTTP 409 Conflict)
      if (error.response && error.response.status === 409) {
           console.warn(`Skipped: ${recipeData.title} - already exists (duplicate slug).`);
      } else {
           console.error(`Error sending "${recipeData.title}" to your server:`, error.response?.data?.message || error.message);
      }
  }
}


async function addExerciseToYourDb(exerciseData) {
    try {
        // The API provides an array, so we can use it directly.
        // We'll map through the array to capitalize each equipment item.
        const equipmentArray = exerciseData.equipment.map(capitalize);

        // The 'category' is already a good fit.
        const category = capitalize(exerciseData.category);
        
        // Format the data to match your ExerciseLibrarySchema
        const formattedData = {
            name: exerciseData.name,
            description: exerciseData.description,
            videoUrl: "https://example.com/placeholder.mp4",
            category: category,
            equipment: equipmentArray,
            difficulty: capitalize(exerciseData.difficulty),
            // These fields are already present in the custom data.
            recommendedSets: exerciseData.recommendedSets,
            recommendedReps: exerciseData.recommendedReps,
            isWarmupExercise: exerciseData.isWarmupExercise,
            isCooldownExercise: exerciseData.isCooldownExercise,
            isMainWorkoutExercise: exerciseData.isMainWorkoutExercise,
            tags: [category, ...equipmentArray]
        };

        console.log(`Sending "${formattedData.name}" to your server...`);
        const response = await axios.post(`${YOUR_SERVER_URL}/api/add-recipe`, formattedData);
        
        console.log(`Server Response: ${response.data.message}`);

    } catch (error) {
        if (error.response && error.response.status === 409) {
             console.warn(`Skipped: ${exerciseData.name} - already exists.`);
        } else {
             console.error(`Error sending "${exerciseData.name}" to your server:`, error.response?.data?.message || error.message);
        }
    }
}

// --- Helper function for capitalization (assumed to exist in your original script) ---
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// --- Main Execution ---
async function main() {
    // 1. Define your exercises in a JSON array here.
    // This is the data you would have received from API Ninjas.
    {/** 
    const customExercises = [
        {
          "name": "Hamstring Stretch",
          "description": "Lie on your back and lift one leg towards your chest, grasping your thigh with both hands. Gently pull the leg closer to your body until you feel a stretch in your hamstring. Hold for 20-30 seconds per leg.",
          "category": "Lower Body",
          "equipment": [
            "Bodyweight"
          ],
          "difficulty": "Beginner",
          "recommendedSets": "2-3",
          "recommendedReps": "20-30 seconds per leg",
          "isWarmupExercise": false,
          "isCooldownExercise": true,
          "isMainWorkoutExercise": false,
          "tags": [
            "Lower Body",
            "Cooldown",
            "Stretch"
          ]
        },
        {
          "name": "Quad Stretch",
          "description": "Stand on one leg, holding onto a wall for balance if needed. Grab your other ankle and pull your heel towards your glute until you feel a stretch in the front of your thigh. Hold for 20-30 seconds per leg.",
          "category": "Lower Body",
          "equipment": [
            "Bodyweight"
          ],
          "difficulty": "Beginner",
          "recommendedSets": "2-3",
          "recommendedReps": "20-30 seconds per leg",
          "isWarmupExercise": false,
          "isCooldownExercise": true,
          "isMainWorkoutExercise": false,
          "tags": [
            "Lower Body",
            "Cooldown",
            "Stretch"
          ]
        },
        {
          "name": "Triceps Stretch",
          "description": "Reach one arm overhead and bend it at the elbow, letting your hand fall behind your neck. Use your other hand to gently pull your elbow back until you feel a stretch in your triceps. Hold for 20-30 seconds per arm.",
          "category": "Upper Body",
          "equipment": [
            "Bodyweight"
          ],
          "difficulty": "Beginner",
          "recommendedSets": "2-3",
          "recommendedReps": "20-30 seconds per arm",
          "isWarmupExercise": false,
          "isCooldownExercise": true,
          "isMainWorkoutExercise": false,
          "tags": [
            "Upper Body",
            "Cooldown",
            "Stretch"
          ]
        },
        {
          "name": "Chest Stretch",
          "description": "Stand in a doorway and place your forearms on the doorframe. Step one foot forward, gently leaning your chest through the doorway until you feel a stretch across your chest and shoulders. Hold for 20-30 seconds.",
          "category": "Upper Body",
          "equipment": [
            "Doorway"
          ],
          "difficulty": "Beginner",
          "recommendedSets": "2-3",
          "recommendedReps": "20-30 seconds",
          "isWarmupExercise": false,
          "isCooldownExercise": true,
          "isMainWorkoutExercise": false,
          "tags": [
            "Upper Body",
            "Cooldown",
            "Stretch"
          ]
        },
        {
          "name": "Pigeon Pose",
          "description": "From a high plank, bring one knee forward to your wrist, placing your foot towards your opposite wrist. Lower your hips and extend your back leg, leaning forward to stretch your glutes and hips. Hold for 30-60 seconds per leg.",
          "category": "Lower Body",
          "equipment": [
            "Bodyweight"
          ],
          "difficulty": "Intermediate",
          "recommendedSets": "1-2",
          "recommendedReps": "30-60 seconds per leg",
          "isWarmupExercise": false,
          "isCooldownExercise": true,
          "isMainWorkoutExercise": false,
          "tags": [
            "Lower Body",
            "Cooldown",
            "Stretch"
          ]
        },
        {
          "name": "Cobra Stretch",
          "description": "Lie on your stomach with your hands under your shoulders. Push up, straightening your arms and lifting your chest off the floor, keeping your hips down. Look up to the ceiling. Hold for 30 seconds.",
          "category": "Core",
          "equipment": [
            "Bodyweight"
          ],
          "difficulty": "Intermediate",
          "recommendedSets": "1-2",
          "recommendedReps": "30-60 seconds",
          "isWarmupExercise": false,
          "isCooldownExercise": true,
          "isMainWorkoutExercise": false,
          "tags": [
            "Core",
            "Cooldown",
            "Stretch"
          ]
        },
        {
          "name": "Seated Forward Fold",
          "description": "Sit on the floor with your legs extended in front of you. Hinge at your hips and reach towards your feet. Keep your back straight and avoid rounding. Hold for 30-60 seconds.",
          "category": "Lower Body",
          "equipment": [
            "Bodyweight"
          ],
          "difficulty": "Intermediate",
          "recommendedSets": "1-2",
          "recommendedReps": "30-60 seconds",
          "isWarmupExercise": false,
          "isCooldownExercise": true,
          "isMainWorkoutExercise": false,
          "tags": [
            "Lower Body",
            "Cooldown",
            "Stretch"
          ]
        },
        {
          "name": "Quads Foam Rolling",
          "description": "Lie face down with a foam roller under your quads. Roll slowly from your hips to your knees, pausing on any tight spots for 30 seconds. This is a form of self-myofascial release.",
          "category": "Lower Body",
          "equipment": [
            "Foam Roller"
          ],
          "difficulty": "Advanced",
          "recommendedSets": "1-2",
          "recommendedReps": "30-60 seconds per leg",
          "isWarmupExercise": false,
          "isCooldownExercise": true,
          "isMainWorkoutExercise": false,
          "tags": [
            "Lower Body",
            "Cooldown",
            "Foam Roller"
          ]
        },
        {
          "name": "Back Foam Rolling",
          "description": "Lie with a foam roller under your upper back, with your hands behind your head for support. Slowly roll from your mid-back to your shoulders, focusing on releasing tension in your thoracic spine.",
          "category": "Back",
          "equipment": [
            "Foam Roller"
          ],
          "difficulty": "Advanced",
          "recommendedSets": "1-2",
          "recommendedReps": "30-60 seconds",
          "isWarmupExercise": false,
          "isCooldownExercise": true,
          "isMainWorkoutExercise": false,
          "tags": [
            "Back",
            "Cooldown",
            "Foam Roller"
          ]
        },
        {
          "name": "90/90 Stretch",
          "description": "Sit on the floor with both knees bent at 90-degree angles, one leg in front of you and one to the side. Gently lean forward over the front leg to stretch the glute. Hold for 30-60 seconds per side.",
          "category": "Lower Body",
          "equipment": [
            "Bodyweight"
          ],
          "difficulty": "Advanced",
          "recommendedSets": "1-2",
          "recommendedReps": "30-60 seconds per side",
          "isWarmupExercise": false,
          "isCooldownExercise": true,
          "isMainWorkoutExercise": false,
          "tags": [
            "Lower Body",
            "Cooldown",
            "Stretch"
          ]
        }
      ]

    if (customExercises.length === 0) {
        console.log("No exercises to process. Exiting.");
        return;
    }

    console.log(`\nStarting to populate ${customExercises.length} exercises into your database...`);
    // 2. Process each exercise from your custom array one by one.
    for (const exercise of customExercises) {
        await addExerciseToYourDb(exercise);
        // Add a small delay to avoid overwhelming your server
        await new Promise(resolve => setTimeout(resolve, 200)); 
    }
*/}
const customRecipes = [
  {
      "title": "High-Protein Chicken & Quinoa Bowl",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop",
      "timeMinutes": 35,
      "goals": ["Build Muscle", "Weight Loss"],
      "ingredientsTags": ["Poultry"],
      "dietary": ["Gluten-Free"],
      "ingredients": [
          "1 cup quinoa, rinsed",
          "2 cups chicken broth",
          "2 boneless, skinless chicken breasts, cubed",
          "1 tbsp olive oil",
          "1 red bell pepper, chopped",
          "1 cup black beans, rinsed",
          "1 cup corn kernels",
          "1/2 red onion, finely chopped",
          "1/4 cup cilantro, chopped",
          "Lime wedges for serving"
      ],
      "instructions": [
          "Cook quinoa in chicken broth according to package directions. Fluff with a fork.",
          "While quinoa cooks, heat olive oil in a skillet over medium-high heat. Add chicken and cook until browned and cooked through. Season with salt and pepper.",
          "In a large bowl, combine the cooked quinoa, chicken, bell pepper, black beans, corn, red onion, and cilantro.",
          "Toss to combine. Serve warm with lime wedges."
      ]
  },
  {
      "title": "Vegan Lentil Shepherd's Pie",
      "imageUrl": "https://images.unsplash.com/photo-1607349914247-536754c8a2a7?q=80&w=2070&auto=format&fit=crop",
      "timeMinutes": 60,
      "goals": ["Energy"],
      "ingredientsTags": ["Vegan"],
      "dietary": ["Vegan", "Vegetarian", "Dairy-Free", "Gluten-Free"],
      "ingredients": [
          "1 tbsp olive oil",
          "1 large onion, chopped",
          "2 carrots, diced",
          "2 celery stalks, diced",
          "1 cup brown or green lentils, rinsed",
          "4 cups vegetable broth",
          "1 tsp dried thyme",
          "2 tbsp tomato paste",
          "4 large potatoes, peeled and cubed",
          "1/4 cup unsweetened almond milk",
          "Salt and pepper to taste"
      ],
      "instructions": [
          "For the filling, heat olive oil in a large pot. Add onion, carrots, and celery and cook until softened, about 5-7 minutes.",
          "Add lentils, vegetable broth, and thyme. Bring to a boil, then reduce heat and simmer for 30-40 minutes, until lentils are tender.",
          "Stir in tomato paste and season with salt and pepper.",
          "Meanwhile, for the topping, boil potatoes until very tender. Drain and mash with almond milk, salt, and pepper until smooth.",
          "Preheat oven to 400°F (200°C). Pour the lentil filling into a baking dish. Spread the mashed potato topping evenly over the filling.",
          "Bake for 20-25 minutes, or until the topping is golden and the filling is bubbly."
      ]
  },
  {
      "title": "Quick & Easy Salmon with Asparagus",
      "imageUrl": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=1974&auto=format&fit=crop",
      "timeMinutes": 20,
      "goals": ["Weight Loss", "Energy"],
      "ingredientsTags": ["Seafood"],
      "dietary": ["Dairy-Free", "Gluten-Free"],
      "ingredients": [
          "2 salmon fillets (6 oz each)",
          "1 bunch asparagus, trimmed",
          "2 tbsp olive oil, divided",
          "1 lemon, sliced",
          "2 cloves garlic, minced",
          "Salt and freshly ground black pepper"
      ],
      "instructions": [
          "Preheat oven to 400°F (200°C).",
          "On a baking sheet, toss asparagus with 1 tbsp olive oil, salt, and pepper. Arrange in a single layer.",
          "Pat salmon fillets dry. Rub with remaining olive oil, minced garlic, salt, and pepper.",
          "Place salmon fillets on the baking sheet alongside the asparagus. Top each fillet with lemon slices.",
          "Bake for 12-15 minutes, or until salmon is cooked through and flakes easily with a fork, and asparagus is tender-crisp.",
          "Serve immediately."
      ]
  }
];

if (customRecipes.length === 0) {
  console.log("No recipes to process. Exiting.");
  return;
}

console.log(`\nStarting to populate ${customRecipes.length} recipes into your database...`);

// 2. Process each recipe from your custom array one by one.
for (const recipe of customRecipes) {
  await addRecipeToYourDb(recipe);
  // Add a small delay to avoid overwhelming your server
  await new Promise(resolve => setTimeout(resolve, 300)); 
}

console.log("\nPopulation script finished!");
}

// 3. Call the main function to start the process.
main();
