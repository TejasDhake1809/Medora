import validator from 'validator';
import bcrypt from 'bcrypt';
import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import {v2 as cloudinary} from 'cloudinary';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();
//api to register user

const registerUser = async (req,res) => {
    try {
        const {name, email, password} = req.body
        if (!name || !email || !password) {
            return res.status(400).json({success:false, message: "Missing Fields"});
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({success:false, message: "Enter a valid email"});
        }

        if (password.length < 8) {
            return res.status(400).json({success:false, message: "Password cannot be lesser than 8 characters"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash( password,salt);
        const userData = {
            name,
            email,
            password : hashedPassword
        }

        const newUser = new userModel(userData);
        const user = await newUser.save();
        
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);

        res.status(201).json({success:true, token});

    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: error.message});
    }
}

//api for user login
const loginUser = async (req,res) => {
    
    try {
        const {email , password} = req.body;
        const user = await userModel.findOne({email});
        if (!user) {
            return res.status(400).json({success:false, message: "User does not exist, Please Register"});
        }

        const isMatch = await bcrypt.compare(password,user.password);
        if (isMatch) {
            const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);
            res.status(200).json({success:true, token});
        } else {
            res.status(400).json({success:false, message: "Invalid credentials"});
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: error.message});
    }
}

//api to get user profile
const getProfile = async (req,res) => {
    try {
       
        const {userId} = req.body;
        const userData = await userModel.findById(userId).select('-password');
        
        res.status(200).json({success:true, userData});

    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: error.message});
    }
}

//api to update user profile
const updateProfile = async (req,res) => {
    
    try {
        
        const {userId, name, phone, address, dob , gender} = req.body;
        const imageFile = req.file
        if (!name || !phone || !dob || !gender) {
            return res.status(400).json({success:false, message: "Incomplete Data"});
        }

        await userModel.findByIdAndUpdate(userId, {name, phone, address: JSON.parse(address), dob,gender });
        if (imageFile) {
            //upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type: 'image'});
            const imageUrl = imageUpload.secure_url;
            await userModel.findByIdAndUpdate(userId, {image:imageUrl});
        }

        res.status(201).json({success:true, message: "Profile Updated Successfully"});

    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: error.message});
    }
}

//api to book appointment
const bookAppointment = async (req,res) => {
    try {
        const {userId, docId, slotDate, slotTime} = req.body;

        const docData = await doctorModel.findById(docId).select('-password');

        if (!docData.available) {
            return res.status(400).json({success:false, message: "Doctor is not available"})
        }

        let slots_booked = docData.slots_booked;

        //checking if slot is available
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.status(409).json({success:false, message: "Slot Unavailable"});
            } else {
                slots_booked[slotDate].push(slotTime);
            }
        } else {
            slots_booked[slotDate] = [];
            slots_booked[slotDate].push(slotTime);
        }

        const userData = await userModel.findById(userId).select('-password');
        delete docData.slots_booked;
        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        //save new slots data in doctors data
        await doctorModel.findByIdAndUpdate(docId, {slots_booked});
        res.status(200).json({success:true, message: 'Appointment Booked'});


    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: error.message});
    }
}

//api to get appointments for my appointments page
const listAppointments = async (req,res) => {   
    try {
        const {userId} = req.body;
        const appointments = await appointmentModel.find({userId});

        res.status(200).json({success: true, appointments});

    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: error.message});
    }
}

//api to cancel appointment
const cancelAppointment = async (req,res) => {
    try {
        
        const {userId, appointmentId} = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);
        
        //verify appointment user
        if (appointmentData.userId !== userId) {
            return res.status(400).json({success:false, message: "Unauthorized Action"});
        }
        
        await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled : true});

        //releasing doctor slot after cancelling appointment
        const {docId, slotDate, slotTime} = appointmentData;
        const doctorData = await doctorModel.findById(docId);
        let slots_booked = doctorData.slots_booked;
        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
        await doctorModel.findByIdAndUpdate(docId, {slots_booked});

        res.status(201).json({success:true, message: "Appointment Cancelled"});

    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: error.message});
    }
}


const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})
//api for online payment
const paymentRazorpay = async (req,res) => {
    try {
        const {appointmentId }= req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData || appointmentData.cancelled) {
            return res.status(400).json({success:false, message: "Appointment cancelled or not found"});
        }

        //creating options for razorpay payment
        const options = {
            amount : appointmentData.amount*100,
            currency : process.env.CURRENCY,
            receipt : appointmentId,
        };

        //creation of an order with razorpay
        const order = await razorpayInstance.orders.create(options);
        res.status(201).json({success:true, order});
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: error.message});
    }
}

//api to verify razorpay payment 
const verifyRazorpay = async (req,res) => {
    try {
        const {razorpay_order_id} = req.body;
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

        console.log(orderInfo);
        if (orderInfo.status === 'paid') {
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt, {payment:true});
            res.status(201).json({success:true, message: "Payment Successful"});
        } else {
            res.status(201).json({success:false, message: "Payment Failed"});
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: error.message});
    }
}

export {registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointments, cancelAppointment, paymentRazorpay, verifyRazorpay};