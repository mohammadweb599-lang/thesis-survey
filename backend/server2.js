// server.js (این فایل را در پوشه بکند خود بسازید)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

const DB_URI = 'mongodb+srv://Ratingbot:13213822Rt@cluster0.ngt46.mongodb.net';
mongoose.connect(DB_URI)
  .then(() => console.log('Database connected successfully!'))
  .catch(err => console.error('Database connection error:', err));

  

// Middleware
app.use(cors());
// افزایش حجم مجاز برای آپلود عکس‌های هیت‌مپ
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// --- Schemas ---

const QuestionSchema = new mongoose.Schema({
  id: String,
  type: String,
  title: String,
  options: [String],
  imageUrl: String // Base64 Image
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

// --- Routes ---

// دریافت همه پرسشنامه‌ها
app.get('/api/surveys', async (req, res) => {
  const surveys = await Survey.find();
  res.json(surveys);
});

// ذخیره پرسشنامه جدید
app.post('/api/surveys', async (req, res) => {
  const newSurvey = new Survey(req.body);
  await newSurvey.save();
  res.json({ message: "Survey saved", id: newSurvey.id });
});

// حذف پرسشنامه
app.delete('/api/surveys/:id', async (req, res) => {
  await Survey.deleteOne({ id: req.params.id });
  // پاک کردن پاسخ‌های مربوطه
  await Response.deleteMany({ surveyId: req.params.id });
  res.json({ message: "Deleted" });
});

// ثبت پاسخ کاربر
app.post('/api/responses', async (req, res) => {
  const newResponse = new Response({
    ...req.body,
    id: Math.random().toString(36).substr(2, 9) // تولید ID در سرور
  });
  await newResponse.save();
  res.json({ message: "Response saved" });
});

// دریافت پاسخ‌های یک پرسشنامه خاص برای ادمین
app.get('/api/responses/:surveyId', async (req, res) => {
  const responses = await Response.find({ surveyId: req.params.surveyId });
  res.json(responses);
});

// اجرای سرور
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});