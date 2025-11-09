
import express from 'express';
import connectDB from './config/db.js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

import authRoute from './routes/UserRoutes.js';
import cameraRoute from './routes/CameraRoutes.js';
import emotionRoute from './routes/EmotionRoutes.js';
import modelRoute from './routes/ModelRoutes.js';
import cookieParser from 'cookie-parser';

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth",authRoute);
app.use("/api/camera",cameraRoute);
app.use("/api/emotions",emotionRoute);
app.use("/api/models",modelRoute);

app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    await connectDB();
});
