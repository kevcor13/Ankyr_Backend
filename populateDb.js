import axios from 'axios';
import e from 'express';

// --- Configuration ---
const API_NINJAS_KEY = 'jNEdefI3DIPf4qNLPQS1Sw==ISksUY0TFAgEhQeD'; // <--- IMPORTANT: REPLACE WITH YOUR KEY
const YOUR_SERVER_URL = 'https://35ee8c7c5af3.ngrok-free.app';



// This function fetches data from API Ninjas
async function fetchExercisesFromApiNinjas() {
    try {
        console.log("Fetching exercises from API Ninjas...");
        const response = await axios.get('https://api.api-ninjas.com/v1/exercises', {
            params: {
                // You can specify a muscle to get more exercises, as the API returns 10 at a time
                // e.g., muscle: 'biceps', 'chest', 'abdominals', etc.
                 muscle: 'middle_back',
            },
            headers: {
                'X-Api-Key': API_NINJAS_KEY,
            },
        });
        console.log(`Successfully fetched ${response.data.length} exercises.`);
        return response.data;
    } catch (error) {
        console.error("Error fetching from API Ninjas:", error.response?.data || error.message);
        return []; // Return empty array on error
    }
}

// This function sends a single exercise to YOUR server to be saved in the database
// Assume this is your existing function
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
        const response = await axios.post(`${YOUR_SERVER_URL}/test/add-exercise`, formattedData);
        
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

    console.log("\nPopulation script finished!");
}

// 3. Call the main function to start the process.
main();
