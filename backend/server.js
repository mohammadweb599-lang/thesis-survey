const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- 🔥 CORS تنظیمات COMPLETE ----------
app.use(cors({
  origin: [
    'https://mohammadweb599-lang.github.io',
    'https://thesis-survey-trzp.vercel.app',
    'https://thesis-survey.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',  // برای React dev server
    'https://your-site.netlify.app'  // اگر از Netlify هم استفاده می‌کنید
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // 🔥 این خط رو اضافه کنید
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']  // 🔥 این خط رو اضافه کنید
}));

// 🔥 این middleware رو برای OPTIONS requests اضافه کنید
app.options('*', cors());  // 🔥 این خط رو اضافه کنید

// افزایش حجم مجاز برای آپلود عکس‌های هیت‌مپ
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// ---------- اتصال به MongoDB ----------
const DB_URI = process.env.MONGO_URI || 'mongodb+srv://Ratingbot:13213822Rt@cluster0.ngt46.mongodb.net/surveyDB?retryWrites=true&w=majority';

mongoose.connect(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000
})
  .then(() => console.log('✅ Database connected successfully!'))
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    console.log('💡 Tip: Check your IP address in MongoDB Atlas Network Access');
  });

// ---------- Schemas ----------
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
  createdAt: { type: Number, default: () => Date.now() },
  isPublished: { type: Boolean, default: false }
});

const ResponseSchema = new mongoose.Schema({
  id: String,
  surveyId: String,
  answers: Array,
  submittedAt: { type: Number, default: () => Date.now() }
});

const Survey = mongoose.model('Survey', SurveySchema);
const Response = mongoose.model('Response', ResponseSchema);

// ---------- Routes ----------

// تست سرور
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Backend is running!',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET  /api/surveys',
      'POST /api/surveys',
      'POST /api/responses',
      'GET  /api/responses/:surveyId'
    ]
  });
});

// دریافت همه پرسشنامه‌ها
app.get('/api/surveys', async (req, res) => {
  try {
    console.log('📥 GET /api/surveys from:', req.headers.origin);
    const surveys = await Survey.find();
    res.json(surveys);
  } catch (error) {
    console.error('❌ Error GET /api/surveys:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// ذخیره پرسشنامه جدید
app.post('/api/surveys', async (req, res) => {
  try {
    console.log('📥 POST /api/surveys from:', req.headers.origin);
    
    if (!req.body.id || !req.body.title) {
      return res.status(400).json({ error: 'ID and Title are required' });
    }
    
    const newSurvey = new Survey({
      ...req.body,
      createdAt: Date.now()
    });
    
    await newSurvey.save();
    
    res.json({ 
      success: true,
      message: "✅ Survey saved successfully", 
      id: newSurvey.id 
    });
    
  } catch (error) {
    console.error('❌ Error POST /api/surveys:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save survey' 
    });
  }
});

// حذف پرسشنامه
app.delete('/api/surveys/:id', async (req, res) => {
  try {
    console.log('🗑️ DELETE /api/surveys/', req.params.id);
    
    await Survey.deleteOne({ id: req.params.id });
    await Response.deleteMany({ surveyId: req.params.id });
    
    res.json({ 
      success: true,
      message: "🗑️ Survey and responses deleted" 
    });
    
  } catch (error) {
    console.error('❌ Error DELETE /api/surveys:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete survey' 
    });
  }
});

// ثبت پاسخ کاربر
app.post('/api/responses', async (req, res) => {
  try {
    console.log('📥 POST /api/responses from:', req.headers.origin);
    
    if (!req.body.surveyId || !req.body.answers) {
      return res.status(400).json({ error: 'Survey ID and answers are required' });
    }
    
    const newResponse = new Response({
      ...req.body,
      id: Math.random().toString(36).substr(2, 9),
      submittedAt: Date.now()
    });
    
    await newResponse.save();
    
    res.json({ 
      success: true,
      message: "✅ Response saved successfully" 
    });
    
  } catch (error) {
    console.error('❌ Error POST /api/responses:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save response' 
    });
  }
});

// دریافت پاسخ‌های یک پرسشنامه
app.get('/api/responses/:surveyId', async (req, res) => {
  try {
    console.log('📥 GET /api/responses/', req.params.surveyId);
    
    const responses = await Response.find({ surveyId: req.params.surveyId });
    
    res.json({ 
      success: true,
      count: responses.length,
      data: responses 
    });
    
  } catch (error) {
    console.error('❌ Error GET /api/responses:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch responses' 
    });
  }
});

// 🔥 Health Check برای Render
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    status: 'healthy',
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    cors: {
      enabled: true,
      allowedOrigins: [
        'https://mohammadweb599-lang.github.io',
        'https://thesis-survey-trzp.vercel.app',
        'http://localhost:5173'
      ]
    }
  });
});

// ---------- اجرای سرور ----------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Local: http://localhost:${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 CORS enabled for:`);
  console.log(`   - https://mohammadweb599-lang.github.io`);
  console.log(`   - https://thesis-survey-trzp.vercel.app`);
  console.log(`   - http://localhost:5173`);
});
