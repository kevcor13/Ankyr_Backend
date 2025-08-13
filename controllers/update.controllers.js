import { User, GameSystem } from "../models/userInfo.models.js";
import { WorkoutLog } from "../models/workout.model.js";

export const updateTheme = async(req, res)=>{
    const{userId, askedThemeQuestion, defaultTheme} = req.body;

    if (userId === undefined || askedThemeQuestion === undefined || defaultTheme === undefined) {
        return res.status(400).json({ message: "Missing required fields: userId, askedThemeQuestion, and defaultTheme." });
    }
    try {
        // --- Database Update Logic ---
        // Find the user by their ID and update the specified fields.
        // The { new: true } option ensures that the updated document is returned.
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    askedThemeQuestion: askedThemeQuestion,
                    defaultTheme: defaultTheme
                }
            },
            { new: true } // This option returns the document after the update has been applied.
        );

        // --- Handle Not Found Case ---
        // If findByIdAndUpdate returns null, it means no user with that ID was found.
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }

        // --- Success Response ---
        // Send a success response back to the client with the updated user data.
        console.log(`Successfully updated theme settings for user: ${userId}`);
        res.status(200).json({ 
            message: "Theme settings updated successfully.",
            user: updatedUser 
        });

    } catch (error) {
        // --- Error Handling ---
        // Log the error for debugging and send a generic server error message.
        console.error("Error updating theme settings:", error);
        res.status(500).json({ message: "An error occurred while updating theme settings." });
    }
};

export const updateBadge = async (req, res) => {
    const {UserID, league} = req.body;
    console.log("UserID: ", UserID, "League: ", league);
    try {
        if (!UserID) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID'
            });
        }
        const updateGameSystem = await GameSystem.updateOne(
            {UserID: UserID},
            {
                league: league
            }
        )
        console.log("its done");
        if (!updateGameSystem) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
    } catch (error) {
        console.error('Error updating Game system:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update game System'
        });
    }
}
export const updatePointsAndStreak = async (req, res) => {
    const {UserID, points, streak, league} = req.body;
    console.log("UserID: ", UserID, "Points: ", points, "Streak: ", streak);
    try {
        if (!UserID) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID'
            });
        }
        const updateGameSystem = await GameSystem.updateOne(
            {UserID: UserID},
            {
                streak: streak,
                points: points,
                league: league
            }
        )
        if (!updateGameSystem) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        res.json({
            status: 'success',
            data: {
                streak: streak,
                points: points
            }
        });
    } catch (error) {
        console.error('Error updating Game system:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update game System'
        });
    }

};

export const logWorkout = async (req, res) => {
    try {
        // 2. Get the workout data from the request body sent by your React Native app
        const { workoutName, durationSeconds, exercises, userId, points} = req.body;
        //console.log(workoutName, durationSeconds, exercises, userId, points);

        // 3. Basic Validation
        if (!workoutName || !exercises || exercises.length === 0) {
            return res.status(400).json({ message: "Workout name and exercises are required." });
        }  
        //console.log("Validation passed");
        // 4. Create a new document using your WorkoutLog model
        const newLog = new WorkoutLog({
            userId, // from auth
            workoutName,
            durationSeconds,
            exercises,
            points // The array of exercises with sets, reps, and weight
        });

        // 5. Save the document to the database
        await newLog.save();
        //console.log("Workout log saved:", newLog);
        // 6. Send a success response
        res.status(201).json({ message: "Workout logged successfully!", log: newLog });

    } catch (error) {
        console.error("Error logging workout:", error);
        res.status(500).json({ message: "Server error while logging workout." });
    }
};

export const recordWorkoutCompletion = async (req, res) => {
    const {UserID} = req.body;
    console.log(UserID);
    
    if( !UserID) {
        return res.status(400).json({ status: "error", data: "User ID is required." });
    }
    try{
        const result = await User.findByIdAndUpdate({
            _id: UserID
        }, {
            $set: {lastWorkoutCompletionData: new Date()} 
        })
        if(result.matchedCount === 0) {
            return res.status(404).json({ status: "error", data: "User not found." });
        }
        
        res.status(200).json({ status: "success", data: "Workout completion recorded successfully." });
    } catch (error) {
        console.error("Error recording workout completion:", error);
        return res.status(500).json({ status: "error", data: "An error occurred while recording the workout completion." });
    }
};

export const getLoggedWorkouts = async (req, res) => {
    const { UserID } = req.body; 

    // It's good practice to check if the UserId was provided
    if (!UserID) {
        return res.status(400).json({ message: "UserId is required" });
    }

    try {
        // The logic from the function can be used directly here
        const workoutLogs = await WorkoutLog.find({ userId: UserID }).sort({ date: -1 }).exec();
        console.log(`Found ${workoutLogs.length} logs for user ${UserID}`);
        
        // Send the found logs back to the client with a 200 OK status
        res.status(200).json(workoutLogs);
        
    } catch (error) {
        // Log the error for debugging purposes
        console.error("Error fetching workout logs:", error);

        // Send a 500 Internal Server Error response to the client
        res.status(500).json({ message: "Failed to fetch workout logs.", error: error.message });
    }
};