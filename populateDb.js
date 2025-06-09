import axios from 'axios';

// --- Configuration ---
const API_NINJAS_KEY = 'jNEdefI3DIPf4qNLPQS1Sw==ISksUY0TFAgEhQeD'; // <--- IMPORTANT: REPLACE WITH YOUR KEY
const YOUR_SERVER_URL = 'https://6225-173-8-115-9.ngrok-free.app';

// Helper function to capitalize the first letter (e.g., 'beginner' -> 'Beginner')
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

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
async function addExerciseToYourDb(exerciseData) {
    try {
        // Your schema expects equipment to be an array.
        // The API provides a string, so we wrap it.
        const equipmentArray = [exerciseData.equipment.replace(/_/g, ' ').split(' ').map(capitalize).join(' ')];

        // The API Ninjas 'type' is a good fit for your 'category' field.
        const category = capitalize(exerciseData.type.replace(/_/g, ' '));
        
        // Format the data to match your ExerciseLibrarySchema
        const formattedData = {
            name: exerciseData.name,
            description: exerciseData.instructions,
            // IMPORTANT: API Ninjas does NOT provide a video URL.
            // You must add this manually later or use a placeholder.
            videoUrl: "https://example.com/placeholder.mp4",
            category: category,
            equipment: equipmentArray,
            difficulty: capitalize(exerciseData.difficulty),
            // These fields are not in the API response, so we set defaults.
            recommendedSets: "3-4",
            recommendedReps: "8-12",
            isWarmupExercise: false,
            isCooldownExercise: false,
            tags: [category, ...equipmentArray]
        };

        console.log(`Sending "${formattedData.name}" to your server...`);
        const response = await axios.post(`${YOUR_SERVER_URL}/test/add-exercise`, formattedData);
        
        console.log(`Server Response: ${response.data.message}`);

    } catch (error) {
        // It's common for an exercise to already exist, so we log it differently.
        if (error.response && error.response.status === 409) {
             console.warn(`Skipped: ${exerciseData.name} - already exists.`);
        } else {
             console.error(`Error sending "${exerciseData.name}" to your server:`, error.response?.data?.message || error.message);
        }
    }
}

// --- Main Execution ---
async function main() {
    const exercises = await fetchExercisesFromApiNinjas();

    if (exercises.length === 0) {
        console.log("No exercises to process. Exiting.");
        return;
    }

    console.log(`\nStarting to populate ${exercises.length} exercises into your database...`);
    // Process each exercise one by one
    for (const exercise of exercises) {
        await addExerciseToYourDb(exercise);
        // Add a small delay to avoid overwhelming your server
        await new Promise(resolve => setTimeout(resolve, 200)); 
    }

    console.log("\nPopulation script finished!");
}

main();