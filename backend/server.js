const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;  // تغییر مهم: برای Render

// ---------- CORS تنظیمات ----------
app.use(cors({
  origin: [
    'https://mohammadweb599-lang.github.io',  // ✅ دامنه اصلی GitHub Pages شما
    'https://thesis-survey-trzp.vercel.app',
    'https://thesis-survey.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));

// افزایش حجم مجاز برای آپلود عکس‌های هیت‌مپ
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// ---------- اتصال به MongoDB ----------
const DB_URI = process.env.MONGO_URI || 'mongodb+srv://Ratingbot:13213822Rt@cluster0.ngt46.mongodb.net/surveyDB?retryWrites=true&w=majority';

mongoose.connect(DB_URI)
  .then(() => console.log('✅ Database connected successfully!'))
  .catch(err => console.error('❌ Database connection error:', err));

// ---------- Schemas ----------
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

// ---------- Routes ----------

// تست سرور
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Backend is running!',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// دریافت همه پرسشنامه‌ها
app.get('/api/surveys', async (req, res) => {
  try {
    const surveys = await Survey.find();
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ذخیره پرسشنامه جدید
app.post('/api/surveys', async (req, res) => {
  try {
    const newSurvey = new Survey(req.body);
    await newSurvey.save();
    res.json({ 
      message: "✅ Survey saved successfully", 
      id: newSurvey.id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// حذف پرسشنامه
app.delete('/api/surveys/:id', async (req, res) => {
  try {
    await Survey.deleteOne({ id: req.params.id });
    // پاک کردن پاسخ‌های مربوطه
    await Response.deleteMany({ surveyId: req.params.id });
    res.json({ message: "🗑️ Survey and responses deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ثبت پاسخ کاربر
app.post('/api/responses', async (req, res) => {
  try {
    const newResponse = new Response({
      ...req.body,
      id: Math.random().toString(36).substr(2, 9), // تولید ID در سرور
      submittedAt: Date.now()
    });
    await newResponse.save();
    res.json({ message: "✅ Response saved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// دریافت پاسخ‌های یک پرسشنامه خاص برای ادمین
app.get('/api/responses/:surveyId', async (req, res) => {
  try {
    const responses = await Response.find({ surveyId: req.params.surveyId });
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- اجرای سرور ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Local: http://localhost:${PORT}`);
  console.log(`🌐 Test: http://localhost:${PORT}/api/surveys`);
});