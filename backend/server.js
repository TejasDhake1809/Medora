import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js';
import adminRouter from './routes/adminRoute.js';
import doctorRouter from './routes/doctorRoute.js';
import userRouter from './routes/userRoute.js';

dotenv.config();

//app config
const app = express();
const port = process.env.port|| 4000;
connectDB();
connectCloudinary();
// middleware
app.use(express.json())
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

// api endpoints
app.use('/api/admin', adminRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/user', userRouter);

app.get('/', (req,res) => {
    res.send("api working");
})

app.listen(port, () => console.log("Server is listening to port", port));