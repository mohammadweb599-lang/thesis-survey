// server2.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connection String
const DB_URI = 'mongodb+srv://Ratingbot:13213822Rt@cluster0.ngt46.mongodb.net/survey_app?retryWrites=true&w=majority';

// اتصال به دیتابیس (نسخه ساده‌تر برای Mongoose 6+)
mongoose.connect(DB_URI)
.then(() => {
  console.log('✅ Database connected successfully!');
  console.log('🎯 Ready to accept requests...');
})
.catch(err => {
  console.error('❌ Database connection error:', err.message);
  console.log('\n🔍 بررسی مشکل:');
  console.log('1. اینترنت وصل هست؟');
  console.log('2. آیپی شما در Atlas اضافه شده؟');
  console.log('3. Connection String درست هست؟');
  console.log('\n💡 راه‌حل سریع:');
  console.log('• آیپی خود را در MongoDB Atlas وایت‌لیست کنید');
  console.log('• برای تست: در Atlas آیپی 0.0.0.0/0 اضافه کنید');
});

// Schemas
const QuestionSchema = new mongoose.Schema({
  id: String,
  type: String,
  title: String,
  options: [String],
  imageUrl: String
});

const SurveySchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  questions: [QuestionSchema],
  createdAt: Number,
  isPublished: Boolean
});

const ResponseSchema = new mongoose.Schema({
  id: String,
  surveyId: String,
  answers: Array,
  submittedAt: Number
});

const Survey = mongoose.model('Survey', SurveySchema);
const Response = mongoose.model('Response', ResponseSchema);

// Routes
app.get('/api/surveys', async (req, res) => {
  try {
    const surveys = await Survey.find();
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/surveys', async (req, res) => {
  try {
    const newSurvey = new Survey(req.body);
    await newSurvey.save();
    res.json({ message: "Survey saved", id: newSurvey.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/surveys/:id', async (req, res) => {
  try {
    await Survey.deleteOne({ id: req.params.id });
    await Response.deleteMany({ surveyId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/responses', async (req, res) => {
  try {
    const newResponse = new Response({
      ...req.body,
      id: Math.random().toString(36).substr(2, 9)
    });
    await newResponse.save();
    res.json({ message: "Response saved" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/responses/:surveyId', async (req, res) => {
  try {
    const responses = await Response.find({ surveyId: req.params.surveyId });
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Testing connection to MongoDB Atlas...`);
  
  // تست اتصال پس از 3 ثانیه
  setTimeout(() => {
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB Atlas connection: SUCCESS');
    } else {
      console.log('❌ MongoDB Atlas connection: FAILED');
      console.log('   Please add your IP to Atlas whitelist');
    }
  }, 3000);
});