import { User} from "../models/userInfo.models.js";

export const follow =  async (req, res) => {
    const { userId, targetId } = req.body;
    console.log("Follow request from", userId, "to", targetId);
    try {
        await User.findByIdAndUpdate(userId, {
            $addToSet: { friends: { user: targetId, request: null} }
        });

        await User.findByIdAndUpdate(targetId, {
            $addToSet: { friends: { user: userId, request: null} }
        });

        res.json({ status: "success", data: "Follow request sent", request: null });
    } catch (error) {
        res.status(500).json({ status: "error", data: error.message });
    }
};
