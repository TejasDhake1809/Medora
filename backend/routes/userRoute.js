import express from 'express';
import { getProfile, loginUser, registerUser, updateProfile, bookAppointment, listAppointments, cancelAppointment, paymentRazorpay, verifyRazorpay } from '../controllers/userController.js';
import authUser from '../middleware/authUser.js';
import upload from '../middleware/multer.js';
const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);

userRouter.post('/get-profile', authUser, getProfile);
userRouter.post('/update-profile', upload.single('image'), authUser, updateProfile);
userRouter.post('/book-appointment', authUser, bookAppointment);
userRouter.get('/list-appointments', authUser, listAppointments);
userRouter.post('/cancel-appointment', authUser, cancelAppointment);
userRouter.post('/payment-razorpay', authUser, paymentRazorpay);
userRouter.post('/verifyRazorpay', authUser, verifyRazorpay);

export default userRouter;