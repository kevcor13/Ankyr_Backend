import bcrypt from "bcrypt";
import {Codes, User} from '../models/userInfo.models.js';
import dotenv from 'dotenv';
import jwt from "jsonwebtoken";


dotenv.config();

export const checkCodeMatch =  async (req, res) => {
    try {
        const { documentId, code } = req.body;
        console.log('Checking code3:', documentId, code);

        if (!documentId || code === undefined) {
            return res
                .status(400)
                .json({ status: 'error', message: 'Missing documentId or code' });
        }

        // Coerce to number
        const numCode = Number(code);
        if (Number.isNaN(numCode)) {
            return res
                .status(400)
                .json({ status: 'error', message: 'Code must be numeric' });
        }
        console.log("this is numCode " + numCode);

        // Find the document, selecting only the `codes` array
        const doc = await Codes.findById(documentId)
            .select('Codes')
            .lean();

        console.log(doc)
        if (!doc) {
            return res
                .status(404)
                .json({ status: 'error', message: 'Document not found' });
        }

        // Make sure doc.codes is an array
        const arr = Array.isArray(doc.Codes) ? doc.Codes : [];
        console.log(arr)
        // Check for membership
        const exists = arr.includes(numCode);

        return res.json({
            status: 'success',
            found: exists
        });

    } catch (error) {
        console.error('Error checking code match:', error);
        return res
            .status(500)
            .json({ status: 'error', message: error.message });
    }
};

export const register = async(req,res) =>{
    
    const {username,email, password, profile, name} =req.body;
    console.log(username,email,password, profile);
    const oldUser = await User.findOne({email: email});
    if(oldUser){
        return res.send({data: "User already exists"});
    }
    const encryptedPassword = await bcrypt.hash(password, 12);
    try {
        await User.create({
            name,
            username,
            email: email,
            password: encryptedPassword,
            profileImage: profile
        })
        const token = jwt.sign({email: email}, process.env.JWT_SECRET)
        res.send({status: "success", data: token})
    } catch (error){
        res.send({status:"error", data: error})
    }
}

export const login = async(req,res) =>{
    const {email, password} = req.body;
    console.log(process.env.JWT_SECRET);
    const oldUser = await User.findOne({email: email});
    if(!oldUser){
        return res.send({status:"error", data:"User not found"})
    }
    if(await bcrypt.compare(password, oldUser.password)){
        const token = jwt.sign({email:oldUser.email}, process.env.JWT_SECRET);

        if(res.status(201)){
            return res.send({status:"success", data:token})
        } else {
            return res.send({status:"error"})
        }
    }
}