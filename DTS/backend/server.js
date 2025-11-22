// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const cookieParser = require('cookie-parser');
import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch'
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { YoutubeTranscript } from "youtube-transcript";
import axios from 'axios'
// require('dotenv').config();

// const authRoutes = require('./routes/authRoutes.js').default || require('./routes/authRoutes.js');
import authRoutes from './routes/authRoutes.js';
import courseRouter from './routes/CourseRouter.js';
import calendarRouter from './routes/CalendarRoutes.js';
import QuizRouter from './routes/QuizRouter.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import assignmentRouter from './routes/AssignmentRouter.js';
import BattleRouter from './routes/BattleRoutes.js';
import StoreRouter from './routes/storeRoutes.js';
import RoadMapRouter from './routes/RoadMapRoutes.js';
import lessonNotesRoutes from './routes/lessonNotesRoutes.js';
import personalNotesRoutes from './routes/personalNotesRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
// import aiRoutes from './routes/AiRoutes.js';
const app = express();
const PORT = process.env.PORT || 5000;

const DEFAULT_JWT_SECRET = 'novalearn_dev_secret_key';
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set. Using fallback development secret. Please set JWT_SECRET in your environment for production.');
  process.env.JWT_SECRET = DEFAULT_JWT_SECRET;
}

app.use(cors({ origin: true,
     credentials: true,
    withCredentials: true}));
app.use(express.json());
app.use(cookieParser());

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/learn_novar', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

app.use("/api/battle",BattleRouter)
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/quiz', QuizRouter);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/assignments', assignmentRouter);
app.use("/api/store",StoreRouter)
app.use("/api/roadmap",RoadMapRouter)
app.use('/api/notes', lessonNotesRoutes);
app.use('/api/personal-notes', personalNotesRoutes);
app.use('/api/questions', questionRoutes);

app.post("/trans", async (req, res) => {
  res.send({})
});

const db = mongoose.connection;
db.on('error', (err) => console.error('MongoDB connection error:', err));
db.once('open', () => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => {
        console.log(`Nova Learn backend server running on http://localhost:${PORT}`);
    });
});

app.get('/', (req, res) => {
    res.send('Nova Learn backend server is running!');
});
