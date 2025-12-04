import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  PlusCircle, LayoutDashboard, FileText, Share2, Trash2, ArrowLeft, BarChart2, CheckCircle, Map, Upload, Image as ImageIcon, RotateCcw, X, Server 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { Question, QuestionType, Survey, SurveyResponse, HeatmapPoint } from './types';
import * as API from './services/storageService'; // Renamed to API to reflect backend nature
import * as GeminiService from './services/geminiService';
import HeatmapVisualizer from './components/HeatmapVisualizer';

// --- Components ---

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }> = ({ variant = 'primary', className, ...props }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
  };
  return <button className={`${baseStyle} ${variants[variant]} ${className || ''}`} {...props} />;
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow" {...props} />
);

// --- PAGES ---

// 1. DASHBOARD
const Dashboard = ({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    setLoading(true);
    const data = await API.fetchSurveys();
    setSurveys(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('آیا از حذف این پرسشنامه و تمام داده‌های آن از دیتابیس اطمینان دارید؟')) {
      await API.deleteSurvey(id);
      loadSurveys();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">پنل مدیریت پروژه</h2>
        <Button onClick={() => onNavigate('create')}>
          <PlusCircle size={20} />
          پروژه جدید
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {surveys.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                <LayoutDashboard size={48} className="mx-auto mb-4 opacity-50" />
                <p>هنوز پرسشنامه‌ای در سیستم ثبت نشده است.</p>
            </div>
            )}
            {surveys.map(survey => (
            <div key={survey.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-800 line-clamp-1">{survey.title}</h3>
                    <span className="text-xs font-mono bg-blue-50 text-blue-600 px-2 py-1 rounded">ID: {survey.id.substring(0,4)}</span>
                </div>
                <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10">{survey.description}</p>
                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-50">
                <Button variant="primary" onClick={() => onNavigate('analyze', survey.id)} className="text-sm flex-1">
                    <BarChart2 size={16} />
                    تحلیل داده‌ها
                </Button>
                <Button variant="secondary" onClick={() => onNavigate('respond', survey.id)} className="text-sm">
                    <Share2 size={16} />
                </Button>
                <Button variant="danger" onClick={() => handleDelete(survey.id)} className="text-sm">
                    <Trash2 size={16} />
                </Button>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};

// 2. CREATE SURVEY
const CreateSurvey = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const addQuestion = (type: QuestionType) => {
    const newQ: Question = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: '',
      options: type === QuestionType.MULTIPLE_CHOICE ? ['گزینه ۱', 'گزینه ۲'] : undefined,
      imageUrl: type === QuestionType.HEATMAP ? '' : undefined
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateQuestion(id, 'imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const save = async () => {
    if (!title) return alert('عنوان الزامی است');
    setIsSaving(true);
    const newSurvey: Survey = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description: desc,
      questions,
      createdAt: Date.now(),
      isPublished: true
    };
    await API.saveSurvey(newSurvey);
    setIsSaving(false);
    onNavigate('dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="secondary" onClick={() => onNavigate('dashboard')}>
          <ArrowLeft size={16} />
          بازگشت
        </Button>
        <h2 className="text-2xl font-bold">طراحی پرسشنامه جدید</h2>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">عنوان پایان‌نامه / پژوهش</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: ارزیابی فضاهای شهری..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات تکمیلی</label>
          <textarea 
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
            rows={3}
            value={desc} 
            onChange={e => setDesc(e.target.value)} 
          />
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative group transition-all hover:border-blue-300">
            <button 
              onClick={() => setQuestions(questions.filter(qi => qi.id !== q.id))}
              className="absolute top-4 left-4 text-gray-400 hover:text-red-600 transition-colors"
              title="حذف سوال"
            >
              <Trash2 size={18} />
            </button>
            
            <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-700 text-xs font-bold">{idx + 1}</span>
                <span className="text-xs font-bold text-gray-500 uppercase">
                {q.type === 'TEXT' ? 'سوال متنی (تشریحی)' : q.type === 'MULTIPLE_CHOICE' ? 'چند گزینه‌ای' : 'نقشه حرارتی (Heatmap)'}
                </span>
            </div>

            <Input 
              value={q.title} 
              onChange={e => updateQuestion(q.id, 'title', e.target.value)} 
              placeholder="متن سوال را وارد کنید..."
              className="font-bold text-lg border-x-0 border-t-0 border-b border-gray-200 rounded-none focus:ring-0 px-0 placeholder-gray-300 mb-4 bg-transparent"
            />
            
            {q.type === QuestionType.MULTIPLE_CHOICE && (
              <div className="space-y-2 pl-4 border-r-2 border-gray-100">
                {q.options?.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-gray-300" />
                    <Input 
                      value={opt} 
                      onChange={e => {
                        const newOpts = [...(q.options || [])];
                        newOpts[optIdx] = e.target.value;
                        updateQuestion(q.id, 'options', newOpts);
                      }}
                      className="text-sm py-1 bg-gray-50"
                    />
                  </div>
                ))}
                <button 
                  onClick={() => updateQuestion(q.id, 'options', [...(q.options || []), `گزینه ${q.options!.length + 1}`])}
                  className="text-blue-500 text-sm hover:underline mt-2 flex items-center gap-1 font-medium"
                >
                  <PlusCircle size={14} /> افزودن گزینه جدید
                </button>
              </div>
            )}

            {q.type === QuestionType.HEATMAP && (
              <div className="space-y-4 mt-4 bg-slate-50 p-4 rounded-lg">
                <div className="flex flex-col gap-2">
                   <label className="block text-sm font-medium text-gray-700">تصویر زمینه نقشه / پلان / محیط:</label>
                   <p className="text-xs text-gray-500">شرکت‌کنندگان روی این تصویر نقاط مورد نظر خود را مشخص می‌کنند.</p>
                   
                   {!q.imageUrl ? (
                        <label className="flex flex-col items-center justify-center gap-2 w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-white hover:border-blue-400 transition-colors">
                            <Upload size={24} className="text-gray-400" />
                            <span className="text-sm text-gray-600">آپلود تصویر (JPG, PNG)</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(q.id, e)} />
                        </label>
                   ) : (
                       <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-white group-image">
                           <img src={q.imageUrl} alt="Heatmap base" className="w-full h-auto max-h-64 object-contain" />
                           <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-image-hover:opacity-100 transition-opacity">
                               <button 
                                    onClick={() => updateQuestion(q.id, 'imageUrl', '')}
                                    className="bg-white text-red-600 px-4 py-2 rounded-full font-bold shadow-lg"
                               >
                                   تغییر تصویر
                               </button>
                           </div>
                       </div>
                   )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20">
         <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex gap-2">
                <Button variant="secondary" onClick={() => addQuestion(QuestionType.TEXT)}>+ متن</Button>
                <Button variant="secondary" onClick={() => addQuestion(QuestionType.MULTIPLE_CHOICE)}>+ گزینه‌ای</Button>
                <Button variant="secondary" onClick={() => addQuestion(QuestionType.HEATMAP)}>+ هیت‌مپ</Button>
            </div>
            <Button onClick={save} disabled={isSaving} className="px-8 shadow-blue-200 shadow-lg min-w-[120px]">
                {isSaving ? 'در حال ذخیره...' : 'ذخیره و انتشار'}
            </Button>
         </div>
      </div>
    </div>
  );
};

// 3. USER RESPONSE VIEW
const UserResponse = ({ surveyId, onNavigate }: { surveyId: string, onNavigate: (page: string) => void }) => {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSurvey();
  }, [surveyId]);

  const loadSurvey = async () => {
    setLoading(true);
    const surveys = await API.fetchSurveys();
    const s = surveys.find(x => x.id === surveyId);
    if (s) setSurvey(s);
    setLoading(false);
  };

  if (loading) return <div className="p-10 text-center">در حال بارگذاری پرسشنامه...</div>;
  if (!survey) return <div className="p-10 text-center">پرسشنامه یافت نشد.</div>;

  const handleTextOrChoice = (questionId: string, field: string, val: any) => {
    const newAnswers = answers.filter(a => a.questionId !== questionId);
    newAnswers.push({ questionId, [field]: val });
    setAnswers(newAnswers);
  };

  const handleHeatmapClick = (questionId: string, point: HeatmapPoint) => {
    const existing = answers.find(a => a.questionId === questionId);
    let points = existing?.heatmapPoints ? [...existing.heatmapPoints] : [];
    points.push(point);

    const newAnswers = answers.filter(a => a.questionId !== questionId);
    newAnswers.push({ questionId, heatmapPoints: points });
    setAnswers(newAnswers);
  };

  const clearLastPoint = (questionId: string) => {
    const existing = answers.find(a => a.questionId === questionId);
    if (!existing?.heatmapPoints || existing.heatmapPoints.length === 0) return;

    const points = [...existing.heatmapPoints];
    points.pop();

    const newAnswers = answers.filter(a => a.questionId !== questionId);
    newAnswers.push({ questionId, heatmapPoints: points });
    setAnswers(newAnswers);
  };

  const clearAllPoints = (questionId: string) => {
    const newAnswers = answers.filter(a => a.questionId !== questionId);
    newAnswers.push({ questionId, heatmapPoints: [] });
    setAnswers(newAnswers);
  };

  const next = async () => {
    if (currentStep < survey.questions.length - 1) {
        setCurrentStep(c => c + 1);
    } else {
        setSubmitting(true);
        await API.submitResponse(survey.id, answers);
        setSubmitting(false);
        alert('پاسخ شما در دیتابیس ثبت شد. با تشکر از شرکت شما.');
        onNavigate('dashboard');
    }
  };

  const q = survey.questions[currentStep];
  const currentAnswer = answers.find(a => a.questionId === q.id);

  const canProceed = () => {
      if (q.type === QuestionType.HEATMAP) {
          return currentAnswer?.heatmapPoints && currentAnswer.heatmapPoints.length > 0;
      }
      return !!currentAnswer;
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 text-center md:text-right">{survey.title}</h1>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentStep) / survey.questions.length) * 100}%` }}></div>
        </div>
        <p className="text-right text-sm text-gray-500 mt-2">سوال {currentStep + 1} از {survey.questions.length}</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl min-h-[400px] flex flex-col border border-gray-100">
        <h3 className="text-xl font-bold mb-6 text-gray-800 leading-relaxed">{q.title}</h3>
        
        <div className="flex-grow">
            {q.type === QuestionType.TEXT && (
            <textarea 
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 h-40 resize-none text-lg"
                placeholder="نظر خود را بنویسید..."
                value={currentAnswer?.textAnswer || ''}
                onChange={e => handleTextOrChoice(q.id, 'textAnswer', e.target.value)}
            />
            )}

            {q.type === QuestionType.MULTIPLE_CHOICE && (
            <div className="space-y-3">
                {q.options?.map((opt, idx) => (
                <button
                    key={idx}
                    onClick={() => handleTextOrChoice(q.id, 'choiceIndex', idx)}
                    className={`w-full p-4 rounded-xl border-2 text-right transition-all flex items-center justify-between group ${
                    currentAnswer?.choiceIndex === idx 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                >
                    <span>{opt}</span>
                    {currentAnswer?.choiceIndex === idx && <CheckCircle size={20} className="text-blue-500" />}
                </button>
                ))}
            </div>
            )}

            {q.type === QuestionType.HEATMAP && (
            <div className="space-y-3">
                <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
                    <p>روی نقاط مهم کلیک کنید (چند انتخابی):</p>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => clearLastPoint(q.id)}
                            disabled={!currentAnswer?.heatmapPoints?.length}
                            className="text-gray-500 hover:text-gray-800 disabled:opacity-30 bg-gray-100 p-1.5 rounded"
                            title="حذف آخرین نقطه"
                         >
                             <RotateCcw size={16} />
                         </button>
                         <button 
                            onClick={() => clearAllPoints(q.id)}
                            disabled={!currentAnswer?.heatmapPoints?.length}
                            className="text-red-400 hover:text-red-600 disabled:opacity-30 bg-red-50 p-1.5 rounded"
                            title="پاک کردن همه"
                         >
                             <Trash2 size={16} />
                         </button>
                    </div>
                </div>
                
                <div className="flex justify-center bg-gray-50 rounded-lg p-2 border border-gray-200">
                    <HeatmapVisualizer 
                        imageUrl={q.imageUrl || ''} 
                        points={currentAnswer?.heatmapPoints || []}
                        interactive={true}
                        onPointClick={(point) => handleHeatmapClick(q.id, point)}
                        className="shadow-sm"
                    />
                </div>
                <p className="text-center text-xs text-gray-400">تعداد نقاط انتخاب شده: <span className="font-bold text-black">{currentAnswer?.heatmapPoints?.length || 0}</span></p>
            </div>
            )}
        </div>

        <div className="mt-8 flex justify-end">
            <Button onClick={next} disabled={!canProceed() || submitting} className="w-full justify-center md:w-auto px-8 py-3 text-lg shadow-blue-200 min-w-[140px]">
                {submitting ? 'در حال ارسال...' : (currentStep === survey.questions.length - 1 ? 'ثبت نهایی در سیستم' : 'مرحله بعد')}
            </Button>
        </div>
      </div>
    </div>
  );
};

// 4. ANALYTICS & THESIS VIEW
const Analytics = ({ surveyId, onNavigate }: { surveyId: string, onNavigate: (page: string) => void }) => {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [generatingData, setGeneratingData] = useState(false);

  useEffect(() => {
    loadData();
  }, [surveyId]);

  const loadData = async () => {
    setLoading(true);
    const surveys = await API.fetchSurveys();
    const s = surveys.find(x => x.id === surveyId);
    if (s) {
      setSurvey(s);
      const res = await API.fetchResponses(s.id);
      setResponses(res);
    }
    setLoading(false);
  };

  const generateData = async () => {
    setGeneratingData(true);
    await API.generateMockData(surveyId, 200);
    await loadData();
    setGeneratingData(false);
  };

  const runAnalysis = async () => {
    if (!survey) return;
    setLoadingAnalysis(true);
    const text = await GeminiService.generateThesisAnalysis(survey, responses);
    setAnalysis(text);
    setLoadingAnalysis(false);
  };

  const getAllHeatmapPoints = (questionId: string) => {
      return responses.flatMap(r => {
          const ans = r.answers.find(a => a.questionId === questionId);
          return ans?.heatmapPoints || [];
      });
  };

  if (loading || !survey) return <div className="p-20 text-center text-gray-400">در حال دریافت اطلاعات از سرور...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-200">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <Button variant="secondary" onClick={() => onNavigate('dashboard')} className="px-2 py-1 text-xs">
                <ArrowLeft size={14} />
             </Button>
             <h1 className="text-2xl font-bold text-gray-800">نتایج پروژه: {survey.title}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
             <span>تعداد کل پاسخ‌دهندگان: <span className="font-bold text-black text-lg">{responses.length}</span></span>
             <span className="h-4 w-px bg-gray-300"></span>
             <span className="flex items-center gap-1 text-green-600 font-medium"><Server size={14}/> متصل به دیتابیس</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="secondary" onClick={generateData} disabled={generatingData} title="شبیه‌سازی دیتای ۲۰۰ کاربر" className="text-xs">
                {generatingData ? 'در حال تولید...' : 'تولید ۲۰۰ نمونه داده تستی'}
            </Button>
            <Button onClick={runAnalysis} disabled={loadingAnalysis || responses.length === 0} className="flex-1 sm:flex-none">
                {loadingAnalysis ? 'در حال پردازش...' : 'تحلیل هوشمند پایان‌نامه'}
            </Button>
        </div>
      </div>

      {responses.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="text-gray-400 mb-2">هنوز داده‌ای در دیتابیس ثبت نشده است.</div>
            <p className="text-sm text-gray-400">لینک پرسشنامه را با کاربران به اشتراک بگذارید یا از دکمه تولید داده تستی استفاده کنید.</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
            {/* Visualizations */}
            <div className="space-y-8">
                {survey.questions.map((q, idx) => (
                    <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold mb-4 text-gray-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                            <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-sm">Q{idx + 1}</span>
                            {q.title}
                        </h3>
                        
                        {q.type === QuestionType.MULTIPLE_CHOICE && (
                            <div className="h-72 ltr">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={q.options!.map((opt, i) => ({
                                        name: opt,
                                        count: responses.filter(r => r.answers.find(a => a.questionId === q.id)?.choiceIndex === i).length
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <YAxis allowDecimals={false} tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40}>
                                            {q.options!.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {q.type === QuestionType.HEATMAP && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">نقشه تراکم (Weather Map Style)</span>
                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">دیتای پردازش شده: {getAllHeatmapPoints(q.id).length} نقطه</span>
                                </div>
                                <div className="rounded-xl overflow-hidden border border-gray-300 shadow-inner bg-slate-200">
                                    <HeatmapVisualizer 
                                        imageUrl={q.imageUrl || ''}
                                        points={getAllHeatmapPoints(q.id)}
                                    />
                                </div>
                                <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 px-1 font-mono">
                                    <div className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-blue-400/50 block"></span>
                                        <span>کم (Low)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-green-500 block"></span>
                                        <span>متوسط</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-yellow-400 block"></span>
                                        <span>زیاد</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-red-600 block"></span>
                                        <span>بحرانی (High)</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {q.type === QuestionType.TEXT && (
                            <div className="h-48 overflow-y-auto bg-gray-50 p-4 rounded-lg space-y-3 custom-scrollbar">
                                {responses.slice(0, 15).map((r, i) => {
                                    const txt = r.answers.find(a => a.questionId === q.id)?.textAnswer;
                                    return txt ? (
                                        <div key={i} className="text-sm bg-white p-3 rounded shadow-sm border border-gray-100 text-gray-600">
                                            {txt}
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* AI Analysis Panel */}
            <div className="lg:sticky lg:top-6 h-fit space-y-4">
                <div className="bg-slate-900 text-white p-6 rounded-xl shadow-xl min-h-[600px] flex flex-col border border-slate-700">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                            <FileText size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">تحلیل هوشمند پایان‌نامه</h3>
                            <p className="text-slate-400 text-xs">موتور: Gemini 2.5 Flash</p>
                        </div>
                    </div>
                    
                    <div className="prose prose-invert prose-sm max-w-none flex-grow overflow-y-auto custom-scrollbar leading-loose text-gray-300">
                        {analysis ? (
                             <ReactMarkdown>{analysis}</ReactMarkdown>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-6 opacity-60">
                                <div className="w-16 h-16 rounded-full border-4 border-slate-700 flex items-center justify-center">
                                    <BarChart2 size={32} />
                                </div>
                                <div className="text-center max-w-xs">
                                    <p className="mb-2 font-bold">آماده تحلیل</p>
                                    <p className="text-xs">سیستم با دسترسی به دیتابیس، {responses.length} رکورد را واکشی و تحلیل خواهد کرد.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [activeSurveyId, setActiveSurveyId] = useState<string | undefined>();

  const navigate = (p: string, id?: string) => {
    setPage(p);
    if (id) setActiveSurveyId(id);
    window.scrollTo(0,0);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
        <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('dashboard')}>
                    <div className="bg-blue-600 text-white p-1.5 rounded-lg font-bold">
                        <Map size={24} />
                    </div>
                    <div>
                        <span className="font-bold text-lg block leading-none">GeoSurvey</span>
                        <span className="text-[10px] text-gray-500 font-normal">سامانه تحلیل فضایی پایان‌نامه</span>
                    </div>
                </div>
                <div className="flex gap-4 text-sm text-gray-600 items-center bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   <span>وضعیت سرور: آنلاین</span>
                </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 md:p-8">
            {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
            {page === 'create' && <CreateSurvey onNavigate={navigate} />}
            {page === 'respond' && activeSurveyId && <UserResponse surveyId={activeSurveyId} onNavigate={navigate} />}
            {page === 'analyze' && activeSurveyId && <Analytics surveyId={activeSurveyId} onNavigate={navigate} />}
        </main>
    </div>
  );
}