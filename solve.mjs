const allowed = new Set(["study", "farming", "career"]);
export default async (req) => {
  if (req.method !== "POST") return new Response(JSON.stringify({error:"केवल POST अनुरोध स्वीकार है।"}), {status:405,headers:{"content-type":"application/json; charset=utf-8"}});
  const key = Netlify.env.get("GEMINI_API_KEY");
  if (!key) return new Response(JSON.stringify({error:"AI अभी सेटअप नहीं हुआ है। Netlify में GEMINI_API_KEY जोड़ना बाकी है।"}), {status:503,headers:{"content-type":"application/json; charset=utf-8"}});
  let body; try { body = await req.json(); } catch { return new Response(JSON.stringify({error:"कृपया सही फ़ॉर्म भरें।"}),{status:400,headers:{"content-type":"application/json; charset=utf-8"}}); }
  const category=String(body.category||""), problem=String(body.problem||"").trim();
  if(!allowed.has(category)||!problem||problem.length>2000) return new Response(JSON.stringify({error:"विभाग चुनें और समस्या 1–2000 अक्षरों में लिखें।"}),{status:400,headers:{"content-type":"application/json; charset=utf-8"}});
  const labels={study:"पढ़ाई",farming:"खेती",career:"करियर और स्किल्स"};
  const prompt=`आप SolveMate के सरल हिंदी/अंग्रेज़ी सहायक हैं। विभाग: ${labels[category]}। यूज़र की समस्या: ${problem}
यूज़र की भाषा में सम्मानपूर्वक जवाब दें और 3-5 व्यावहारिक अगले कदम सुझाएँ। जानकारी कम हो तो सवाल पूछें, तथ्य न गढ़ें। पढ़ाई में सीखने में मदद करें। खेती के रोग, कीटनाशक या मंडी भाव पर निश्चित दावा न करें; स्थानीय कृषि विशेषज्ञ/आधिकारिक स्रोत से पुष्टि की सलाह दें। करियर में आय की गारंटी न दें। निजी जानकारी न माँगें।`;
  try {
    const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{method:"POST",headers:{"x-goog-api-key":key,"content-type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.4,maxOutputTokens:700}})});
    const d=await r.json(); if(!r.ok) return new Response(JSON.stringify({error:"AI सेवा ने अनुरोध स्वीकार नहीं किया। API सेटिंग और उपलब्धता जाँचें।"}),{status:502,headers:{"content-type":"application/json; charset=utf-8"}});
    const answer=d?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("\n").trim(); if(!answer) throw Error("empty");
    return new Response(JSON.stringify({answer}),{status:200,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
  } catch { return new Response(JSON.stringify({error:"AI से कनेक्ट नहीं हो पाया। बाद में फिर कोशिश करें।"}),{status:502,headers:{"content-type":"application/json; charset=utf-8"}}); }
};