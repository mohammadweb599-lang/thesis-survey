import { Survey, SurveyResponse } from '../types';

// آدرس سرور بکند شما (در حالت لوکال معمولا پورت 5000 یا 3000 است)
// وقتی سایت را آپلود کنید، این آدرس باید آدرس دامنه شما باشد.
const API_BASE_URL = 'https://my-survey-api.onrender.com/api';

export const fetchSurveys = async (): Promise<Survey[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/surveys`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error("Error fetching surveys:", error);
    return [];
  }
};

export const saveSurvey = async (survey: Survey): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/surveys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(survey),
    });
    if (!response.ok) throw new Error('Error saving survey');
  } catch (error) {
    console.error("Error saving survey:", error);
    alert("خطا در ارتباط با سرور. آیا بکند را اجرا کرده‌اید؟");
  }
};

export const deleteSurvey = async (id: string): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/surveys/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error("Error deleting survey:", error);
  }
};

export const fetchResponses = async (surveyId: string): Promise<SurveyResponse[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/responses/${surveyId}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error("Error fetching responses:", error);
    return [];
  }
};

export const submitResponse = async (surveyId: string, answers: any[]): Promise<void> => {
  const payload = {
    surveyId,
    answers,
    submittedAt: Date.now()
  };

  try {
    const response = await fetch(`${API_BASE_URL}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Error submitting response');
  } catch (error) {
    console.error("Error submitting response:", error);
    alert("خطا در ثبت پاسخ. لطفاً اتصال اینترنت را بررسی کنید.");
  }
};

// --- DATA GENERATOR (VIA BACKEND) ---
// برای تولید دیتای فیک، ما این درخواست را به بکند می‌فرستیم تا آنجا پردازش شود
// یا می‌توانیم همینجا تولید کنیم و دانه‌دانه بفرستیم (روش دوم برای تست بهتر است)
export const generateMockData = async (surveyId: string, count: number = 200) => {
    // Generate data locally then send to server in bulk or one by one
    // For simplicity in this demo, we will use the existing logic but post to API
    const surveys = await fetchSurveys();
    const survey = surveys.find(s => s.id === surveyId);
    if (!survey) return;

    // We will generate 50 at a time to not overload browser
    const BATCH_SIZE = 50;
    const batches = Math.ceil(count / BATCH_SIZE);
    
    // Import types locally to avoid circular dependency issues in generation logic logic if needed,
    // but here we just reuse the structure.
    
    for (let b = 0; b < batches; b++) {
        const promises = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
             // Re-using the random logic from before
             const answers = survey.questions.map(q => {
                if (q.type === 'MULTIPLE_CHOICE' && q.options) {
                    const bias = Math.random();
                    let index = 0;
                    if (bias < 0.5) index = 0;
                    else if (bias < 0.8) index = 1;
                    else index = Math.floor(Math.random() * q.options.length);
                    return { questionId: q.id, choiceIndex: index };
                } else if (q.type === 'HEATMAP') {
                    const numPoints = Math.floor(Math.random() * 5) + 1;
                    const points = [];
                    for(let j=0; j<numPoints; j++) {
                        const clusterRoll = Math.random();
                        let xBase, yBase;
                        if (clusterRoll < 0.4) { xBase = 30; yBase = 40; } 
                        else if (clusterRoll < 0.7) { xBase = 70; yBase = 60; } 
                        else { xBase = 50; yBase = 20; }
                        const spread = 8;
                        const x = xBase + (Math.random() * spread * 2 - spread);
                        const y = yBase + (Math.random() * spread * 2 - spread);
                        points.push({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
                    }
                    return { questionId: q.id, heatmapPoints: points };
                } else {
                    return { questionId: q.id, textAnswer: `کاربر تستی ${i + (b*BATCH_SIZE)}` };
                }
            });

            const payload = { surveyId, answers, submittedAt: Date.now() };
            
            promises.push(fetch(`${API_BASE_URL}/responses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }));
        }
        await Promise.all(promises);
    }
};
