import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['like','follow','accept'],
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    username: {type: String, required: true},
    message: String,
    imageUrl: String,
    userProfileImageUrl: {type: String},
    createdAt: {
        type: Date,
        default: Date.now,
    },
    read: {
        type: Boolean,
        default: false,
    },
}, {
    collection: "Notifications", // Use a specific collection name (optional)
});

export const Notification = mongoose.model("Notification", NotificationSchema);

const photoSchema = new mongoose.Schema({
    UserID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserInfo",
        required: true,
    },
    username: String,
    content: String,
    image: String,
    url: String,
    createdAt: { type: Date, default: Date.now }
}, {
    collection: "Photos"
});

export const Photo = mongoose.model("Photo", photoSchema);

const PostSchema = new mongoose.Schema({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserInfo",
        required: true,
    },
    username: String,
    content: String,
    imageUrl: String,
    userProfileImageUrl: String,
    createdAt: { type: Date, default: Date.now },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ]
},
    {collection: 'Post'
});
export const Post = mongoose.model("Post", PostSchema);