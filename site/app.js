"use strict";
(() => {
  // ===================== state =====================
  const KEY = "apexTracker.v3";
  const dprofile = () => ({ startKg:98, goalKg:78, heightCm:165, age:32, sex:"male",
    activity:1.45, deficit:750, proteinPerKg:1.9, pace:1.0, startDate:todayKey(), examDate:"2026-11-01" });
  const fresh = () => ({ profile:dprofile(), days:{}, weights:[], waist:[],
    study:{ nextTask:"", comps:{}, milestones:{} }, settings:{ stepGoal:9000, waterGoal:8, lang:"en", city:"riyadh" } });

  const state = load();
  function load(){
    for (const k of [KEY, "apexTracker.v2"]) {
      try { const s = JSON.parse(localStorage.getItem(k)); if (s && s.profile) return migrate(s); } catch(e){}
    }
    try { const v1 = JSON.parse(localStorage.getItem("ricsTracker.v1"));
      if (v1 && v1.profile){ const s = fresh(); s.days=v1.days||{}; s.weights=v1.weights||[]; s.study=Object.assign(s.study,v1.study||{}); return s; }
    } catch(e){}
    return fresh();
  }
  function migrate(s){
    s.profile = Object.assign(dprofile(), s.profile);
    s.settings = Object.assign({ stepGoal:9000, waterGoal:8, lang:"en", city:"riyadh" }, s.settings||{});
    s.study = s.study || { nextTask:"", comps:{}, milestones:{} };
    s.weights = s.weights||[]; s.waist = s.waist||[]; s.days = s.days||{};
    return s;
  }
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));

  // ===================== i18n =====================
  let L = state.settings.lang === "ar" ? "ar" : "en";
  const t = (en, ar) => (L === "ar" ? ar : en);          // inline UI strings
  const P = (pair) => pair[L === "ar" ? 1 : 0];          // bilingual data [en, ar]
  function applyDir(){
    document.documentElement.lang = L;
    document.documentElement.dir = L === "ar" ? "rtl" : "ltr";
    const lb = $("langBtn"); if (lb) lb.textContent = L === "ar" ? "English" : "العربية";
    const navmap = { home:["Home","الرئيسية"], train:["Train","التمرين"], fuel:["Fuel","التغذية"], study:["Study","الدراسة"], progress:["Progress","التقدم"] };
    document.querySelectorAll("[data-nav]").forEach(el => { const p = navmap[el.dataset.nav]; if (p) el.textContent = P(p); });
    $("eyebrow").textContent = t("Apex - your daily system", "أبيكس - نظامك اليومي");
  }

  // ===================== dates =====================
  function todayKey(d){ d = d || new Date(); return d.toLocaleDateString("en-CA"); }
  function addDaysKey(k,n){ const p=k.split("-"); const d=new Date(+p[0],+p[1]-1,+p[2]); d.setDate(d.getDate()+n); return todayKey(d); }
  function weekdayOf(k){ const p=k.split("-"); return new Date(+p[0],+p[1]-1,+p[2]).getDay(); }
  const DOW = [["Sunday","الأحد"],["Monday","الاثنين"],["Tuesday","الثلاثاء"],["Wednesday","الأربعاء"],["Thursday","الخميس"],["Friday","الجمعة"],["Saturday","السبت"]];
  const MONN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const MONA = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const prettyDate = k => { const p=k.split("-"); return `${+p[2]} ${(L==="ar"?MONA:MONN)[+p[1]-1]} ${p[0]}`; };
  const prettyMonth = d => `${(L==="ar"?MONA:MONN)[d.getMonth()]} ${d.getFullYear()}`;

  function day(k){ k = k || todayKey();
    if (!state.days[k]) state.days[k] = { check:{}, steps:0, water:0, focus:0, workout:{done:false,feel:"",note:""}, exDone:{}, sets:{} };
    const d = state.days[k];
    d.check=d.check||{}; d.workout=d.workout||{done:false,feel:"",note:""}; d.exDone=d.exDone||{}; d.sets=d.sets||{};
    if (d.steps==null) d.steps=0; if (d.water==null) d.water=0; if (d.focus==null) d.focus=0;
    return d;
  }

  // ===================== prayer times (PrayTimes algorithm, Umm al-Qura) =====================
  const CITIES = {
    riyadh:{ n:["Riyadh","الرياض"], lat:24.7136, lng:46.6753, tz:3 },
    jeddah:{ n:["Jeddah","جدة"], lat:21.4858, lng:39.1925, tz:3 },
    mecca:{ n:["Makkah","مكة"], lat:21.3891, lng:39.8579, tz:3 },
    medina:{ n:["Madinah","المدينة"], lat:24.5247, lng:39.5692, tz:3 },
    dammam:{ n:["Dammam","الدمام"], lat:26.4207, lng:50.0888, tz:3 }
  };
  function prayerTimes(date, lat, lng, tz){
    const R = Math.PI/180;
    const sin=x=>Math.sin(x*R), cos=x=>Math.cos(x*R), tan=x=>Math.tan(x*R);
    const asin=x=>Math.asin(x)/R, acos=x=>Math.acos(x)/R, atan2=(y,x)=>Math.atan2(y,x)/R, acot=x=>Math.atan(1/x)/R;
    const fix=(a,b)=>{ a-=b*Math.floor(a/b); return a<0?a+b:a; };
    const fixh=a=>fix(a,24);
    function julian(y,m,d){ if (m<=2){ y--; m+=12; } const a=Math.floor(y/100), b=2-a+Math.floor(a/4);
      return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+b-1524.5; }
    const jd = julian(date.getFullYear(), date.getMonth()+1, date.getDate()) - lng/(15*24);
    function sun(j){ const d=j-2451545.0;
      const g=fix(357.529+0.98560028*d,360), q=fix(280.459+0.98564736*d,360);
      const l=fix(q+1.915*sin(g)+0.020*sin(2*g),360);
      const e=23.439-0.00000036*d;
      const decl=asin(sin(e)*sin(l));
      let ra=atan2(cos(e)*sin(l),cos(l))/15; ra=fixh(ra);
      return { decl, eqt:q/15-ra };
    }
    const mid = t0 => fixh(12 - sun(jd+t0).eqt);
    const ang = (t0, angle, ccw) => { const decl=sun(jd+t0).decl;
      const x=(-sin(angle)-sin(decl)*sin(lat))/(cos(decl)*cos(lat));
      if (x>1||x<-1) return NaN;
      const w=acos(x)/15; return mid(t0)+(ccw?-w:w);
    };
    const asr = t0 => { const decl=sun(jd+t0).decl; return ang(t0, -acot(1+tan(Math.abs(lat-decl))), false); };
    let T = { fajr:5, sunrise:6, dhuhr:12, asr:13, maghrib:18, isha:18 };
    for (let i=0;i<3;i++){
      const f={}; for (const k in T) f[k]=T[k]/24;
      T = { fajr:ang(f.fajr,18.5,true), sunrise:ang(f.sunrise,0.833,true), dhuhr:mid(f.dhuhr),
            asr:asr(f.asr), maghrib:ang(f.maghrib,0.833,false), isha:0 };
      T.isha = T.maghrib + 90/60;
    }
    const adj = h => fixh(h + tz - lng/15);
    const fmt = h => { if (!isFinite(h)) return "--:--"; h=adj(h); let m=Math.round((h%1)*60), hr=Math.floor(h);
      if (m===60){ m=0; hr++; } hr=(hr+24)%24; return `${String(hr).padStart(2,"0")}:${String(m).padStart(2,"0")}`; };
    return { fajr:fmt(T.fajr), sunrise:fmt(T.sunrise), dhuhr:fmt(T.dhuhr), asr:fmt(T.asr), maghrib:fmt(T.maghrib), isha:fmt(T.isha) };
  }
  const toMin = hm => { const p=hm.split(":"); return +p[0]*60 + +p[1]; };

  // ===================== content =====================
  const QUOTES = [
    ["Discipline is choosing what you want most over what you want now.","الانضباط هو أن تختار ما تريده أكثر على ما تريده الآن."],
    ["You do not need a perfect day. You need a finished one.","لا تحتاج يومًا مثاليًا، بل يومًا مكتملًا."],
    ["The gym is one hour. The other twenty-three decide the result.","النادي ساعة واحدة، والثلاث والعشرون الباقية هي من تحدد النتيجة."],
    ["Slow is smooth, and smooth is fast.","البطء سلاسة، والسلاسة سرعة."],
    ["Every rep you log is a vote for the person you are becoming.","كل تكرار تسجله هو صوت للشخص الذي تصير إليه."],
    ["You will not always feel motivated. Be consistent instead.","لن تشعر دائمًا بالحماس، فكن ثابتًا بدلًا من ذلك."],
    ["A thirty-minute walk beats a perfect plan you skipped.","مشي ثلاثين دقيقة خير من خطة مثالية تجاوزتها."],
    ["Protein first. Panic never.","البروتين أولًا، والقلق أبدًا."],
    ["The scale measures one thing. Your habits measure everything.","الميزان يقيس شيئًا واحدًا، وعاداتك تقيس كل شيء."],
    ["Show up tired. Leave proud.","احضر متعبًا، وارحل فخورًا."],
    ["Your health and your APC are built the same way: daily and quietly.","صحتك وامتحانك يُبنيان بالطريقة ذاتها: يوميًا وبهدوء."],
    ["The only benchmark that matters is you, last week.","المعيار الوحيد المهم هو أنت في الأسبوع الماضي."],
    ["Steady beats dramatic. Every time.","الثبات يتفوق على الاندفاع في كل مرة."],
    ["Hard days count double.","الأيام الصعبة تُحتسب مرتين."]
  ];
  const quoteToday = () => { const d=new Date(); const n=Math.floor((d-new Date(d.getFullYear(),0,0))/86400000); return P(QUOTES[n % QUOTES.length]); };

  const CHECK = [
    { id:"protein", l:["Protein breakfast","فطور غني بالبروتين"], h:["Eggs, yogurt or oats with whey","بيض أو زبادي أو شوفان مع بروتين"] },
    { id:"water",   l:["Water through the day","ماء على مدار اليوم"], h:["Aim for about 8 glasses","استهدف نحو 8 أكواب"] },
    { id:"move",    l:["Training or walk done","أكملت التمرين أو المشي"], h:["Movement counts, even short","الحركة تُحتسب ولو قليلة"] },
    { id:"study",   l:["Study blocks done","أنجزت فترات الدراسة"], h:["One focused block is a win","فترة تركيز واحدة إنجاز"] },
    { id:"noSnack", l:["No late-night snacks","لا وجبات متأخرة في الليل"], h:["Kitchen closed after dinner","المطبخ مغلق بعد العشاء"] },
    { id:"sleep",   l:["Sleep by 11","النوم قبل الحادية عشرة"], h:["Wind down, screens away","استرخِ وابعد الشاشات"] }
  ];
  const GOOD_MIN = 4;

  // schedule activities per day type [time, en, ar]
  const SCHED = {
    work:[ ["06:50","Wake. Two glasses of water before anything else","الاستيقاظ. كوبا ماء قبل أي شيء"],
      ["07:10","Protein breakfast, about 35 g protein","فطور بروتيني، نحو 35 جم بروتين"],
      ["07:45","Commute. Audio notes or a podcast","التنقل. ملاحظات صوتية أو بودكاست"],
      ["10:30","Office snack: yogurt or a few nuts","وجبة خفيفة: زبادي أو قليل من المكسرات"],
      ["12:30","Lunch: plate rule, grilled never fried","الغداء: قاعدة الطبق، مشوي وليس مقلي"],
      ["16:00","Snack and a 10-minute walk","وجبة خفيفة ومشي عشر دقائق"],
      ["18:15","Home. Change straight into gym clothes","البيت. غيّر ملابسك للنادي مباشرة"],
      ["18:45","Training session","حصة التمرين"],
      ["20:00","Dinner: protein and vegetables, light carb","العشاء: بروتين وخضار، نشويات قليلة"],
      ["21:00","Study: one or two focus blocks","الدراسة: فترة أو فترتان للتركيز"],
      ["22:40","Wind down, no screens or caffeine","استرخاء، بلا شاشات أو كافيين"],
      ["23:00","Sleep","النوم"] ],
    sunday:[ ["06:50","Wake. Two glasses of water","الاستيقاظ. كوبا ماء"],
      ["07:10","Protein breakfast","فطور بروتيني"],
      ["10:30","Office snack","وجبة خفيفة"],
      ["12:30","Lunch: plate rule","الغداء: قاعدة الطبق"],
      ["16:00","Snack and a short walk","وجبة خفيفة ومشي قصير"],
      ["18:15","Home. Light early dinner","البيت. عشاء مبكر خفيف"],
      ["19:00","CPD class until 9 pm","حصة التطوير المهني حتى التاسعة"],
      ["21:15","Optional easy walk, then wind down","مشي خفيف اختياري ثم استرخاء"],
      ["23:00","Sleep","النوم"] ],
    friday:[ ["08:00","Wake gently. Water first","استيقاظ هادئ. الماء أولًا"],
      ["08:30","Protein breakfast","فطور بروتيني"],
      ["09:30","Gym: lower body plus easy cardio","النادي: الجزء السفلي وكارديو خفيف"],
      ["14:30","Lunch: plate rule","الغداء: قاعدة الطبق"],
      ["16:00","Study: two focus blocks, case study first","الدراسة: فترتان، دراسة الحالة أولًا"],
      ["19:30","Dinner","العشاء"],
      ["22:40","Wind down","استرخاء"],
      ["23:00","Sleep","النوم"] ],
    saturday:[ ["08:00","Wake. Water first","الاستيقاظ. الماء أولًا"],
      ["08:30","Protein breakfast","فطور بروتيني"],
      ["09:30","Conditioning: cardio, core and mobility","لياقة: كارديو وبطن ومرونة"],
      ["12:30","Lunch","الغداء"],
      ["15:00","Study: two focus blocks","الدراسة: فترتان"],
      ["17:00","Meal prep for the week","تحضير وجبات الأسبوع"],
      ["19:30","Dinner","العشاء"],
      ["22:40","Wind down","استرخاء"],
      ["23:00","Sleep","النوم"] ]
  };
  const schedFor = wd => wd===0 ? SCHED.sunday : wd===5 ? SCHED.friday : wd===6 ? SCHED.saturday : SCHED.work;
  const PRAYER_LABELS = { fajr:["Fajr","الفجر"], dhuhr:["Dhuhr","الظهر"], jumua:["Jumu'ah","الجمعة"], asr:["Asr","العصر"], maghrib:["Maghrib","المغرب"], isha:["Isha","العشاء"], sunrise:["Sunrise","الشروق"] };

  // exercise library: n=[en,ar], c=cues [[en],[ar]], m=mistakes [[en],[ar]], yt=video search
  const EX = {
    bench:{ n:["Barbell bench press","الضغط بالبار على المسطح"], yt:"barbell bench press",
      c:[["Shoulder blades pinned back and down","Bar touches mid-chest","Drive feet into the floor","Press up and slightly back"],["اسحب لوحي الكتف للخلف وللأسفل","لمس البار منتصف الصدر","ادفع قدميك في الأرض","ادفع للأعلى وقليلًا للخلف"]],
      m:[["Bouncing the bar off the chest","Flaring the elbows wide"],["ارتداد البار عن الصدر","تباعد المرفقين بشكل مفرط"]] },
    incdb:{ n:["Incline dumbbell press","الضغط بالدمبل على المائل"], yt:"incline dumbbell press",
      c:[["Bench at about 30 degrees","Lower until you feel the chest stretch","Press up and slightly inward","Control every part of the way down"],["المقعد بزاوية 30 درجة تقريبًا","انزل حتى تشعر بتمدد الصدر","ادفع للأعلى وقليلًا للداخل","تحكم في النزول بالكامل"]],
      m:[["Arching the lower back off the bench","Clanging the dumbbells at the top"],["تقويس الظهر عن المقعد","اصطدام الدمبلين في الأعلى"]] },
    ohp:{ n:["Seated dumbbell shoulder press","ضغط الكتف بالدمبل جالسًا"], yt:"seated dumbbell shoulder press",
      c:[["Ribs down, core braced","Press straight up, no arching","Lower to ear height","Exhale as you press"],["اخفض الأضلاع وشد البطن","ادفع للأعلى مباشرة دون تقويس","انزل إلى مستوى الأذن","ازفر أثناء الدفع"]],
      m:[["Leaning back to lift the weight","Locking the elbows hard"],["الميل للخلف لرفع الوزن","قفل المرفقين بقوة"]] },
    machsh:{ n:["Machine shoulder press","ضغط الكتف على الجهاز"], yt:"machine shoulder press",
      c:[["Stop just short of full lockout","Keep tension on the shoulders","Even pace up and down"],["توقف قبل القفل الكامل","أبقِ الشد على الكتفين","سرعة ثابتة صعودًا ونزولًا"]],
      m:[["Shrugging into the press"],["رفع الكتفين أثناء الدفع"]] },
    latpull:{ n:["Lat pulldown","سحب أمامي عريض"], yt:"lat pulldown",
      c:[["Grip a little wider than shoulders","Pull the bar to the upper chest","Drive the elbows down and back","No leaning back for momentum"],["قبضة أوسع قليلًا من الكتفين","اسحب البار إلى أعلى الصدر","ادفع المرفقين لأسفل وللخلف","دون ميل للخلف لاكتساب زخم"]],
      m:[["Pulling behind the neck","Swinging the torso"],["السحب خلف الرقبة","تأرجح الجذع"]] },
    apullup:{ n:["Assisted pull-up","عقلة بمساعدة"], yt:"assisted pull up",
      c:[["Full hang at the bottom","Chin over or to the bar","Think elbows to pockets","Lower with full control"],["تعلق كامل في الأسفل","الذقن فوق البار أو إليه","فكّر بإنزال المرفقين للجيوب","انزل بتحكم تام"]],
      m:[["Swinging or kipping","Cutting the range short"],["التأرجح أو القفز","تقصير المدى"]] },
    cablerow:{ n:["Seated cable row","تجديف بالكابل جالسًا"], yt:"seated cable row",
      c:[["Chest tall, torso still","Pull the handle to your waist","Squeeze the shoulder blades","Let the arms reach fully forward"],["الصدر مرفوع والجذع ثابت","اسحب المقبض إلى الخصر","اعصر لوحي الكتف","مدّ الذراعين كاملًا للأمام"]],
      m:[["Rocking back and forth","Shrugging the shoulders"],["التأرجح للأمام والخلف","رفع الكتفين"]] },
    dbrow:{ n:["Chest-supported dumbbell row","تجديف بالدمبل بإسناد الصدر"], yt:"chest supported dumbbell row",
      c:[["Chest on the bench, no twisting","Row to the hip, elbow close","Pause one second at the top","Slow stretch at the bottom"],["الصدر على المقعد دون التواء","اسحب نحو الورك والمرفق قريب","توقف ثانية في الأعلى","تمدد بطيء في الأسفل"]],
      m:[["Yanking the weight","Lifting the chest off the pad"],["شدّ الوزن بعنف","رفع الصدر عن الوسادة"]] },
    facepull:{ n:["Cable face pull","سحب الوجه بالكابل"], yt:"cable face pull",
      c:[["Rope at upper-chest height","Pull toward the forehead","Rotate the hands back at the end","Light weight, perfect form"],["الحبل بارتفاع أعلى الصدر","اسحب نحو الجبهة","أدر اليدين للخلف في النهاية","وزن خفيف وأداء متقن"]],
      m:[["Going too heavy","Pulling to the chin"],["وزن ثقيل جدًا","السحب إلى الذقن"]] },
    lateral:{ n:["Dumbbell lateral raise","رفرفة جانبية بالدمبل"], yt:"dumbbell lateral raise",
      c:[["Soft bend in the elbows","Lift to shoulder height only","Lead with the elbows","Lower slower than you lift"],["ثني خفيف في المرفقين","ارفع حتى مستوى الكتف فقط","قُد الحركة بالمرفقين","انزل أبطأ من الرفع"]],
      m:[["Swinging the body","Shrugging the traps"],["تأرجح الجسم","رفع عضلة الترابيس"]] },
    curl:{ n:["Dumbbell curl","مرجحة الباي بالدمبل"], yt:"dumbbell biceps curl",
      c:[["Elbows pinned at your sides","Curl without swinging","Squeeze at the top","Three seconds down"],["المرفقان ملتصقان بالجانبين","ارفع دون تأرجح","اعصر في الأعلى","ثلاث ثوانٍ للنزول"]],
      m:[["Rocking the hips","Half range of motion"],["تأرجح الوركين","نصف المدى الحركي"]] },
    tripush:{ n:["Rope triceps pushdown","دفع الترايسبس بالحبل"], yt:"rope triceps pushdown",
      c:[["Elbows tucked to the ribs","Spread the rope at the bottom","Only the forearms move","Full stretch at the top"],["المرفقان ملتصقان بالأضلاع","افرد الحبل في الأسفل","يتحرك الساعدان فقط","تمدد كامل في الأعلى"]],
      m:[["Elbows drifting forward","Leaning over the cable"],["انجراف المرفقين للأمام","الانحناء فوق الكابل"]] },
    legpress:{ n:["Leg press","ضغط الأرجل"], yt:"leg press",
      c:[["Feet shoulder-width on the platform","Lower until the knees reach 90 degrees","Push through the whole foot","Never lock the knees hard"],["القدمان بعرض الكتفين على المنصة","انزل حتى تصل الركبتان 90 درجة","ادفع بكامل القدم","لا تقفل الركبتين بقوة"]],
      m:[["Lower back rounding off the pad","Shallow half reps"],["تقوس أسفل الظهر عن الوسادة","تكرارات نصفية قصيرة"]] },
    goblet:{ n:["Goblet squat","سكوات الكأس"], yt:"goblet squat",
      c:[["Hold the dumbbell at the chest","Sit down between the hips","Chest tall, heels planted","Drive up through the floor"],["امسك الدمبل عند الصدر","انزل بين الوركين","الصدر مرفوع والكعبان ثابتان","ادفع للأعلى من الأرض"]],
      m:[["Knees caving inward","Heels lifting"],["انهيار الركبتين للداخل","رفع الكعبين"]] },
    rdl:{ n:["Romanian deadlift","الرفعة الرومانية بالدمبل"], yt:"dumbbell romanian deadlift",
      c:[["Soft knees, hinge at the hips","Weights slide close to the legs","Feel the hamstring stretch","Stand tall and squeeze the glutes"],["ركبتان مرنتان وثني من الوركين","الأوزان قريبة من الساقين","اشعر بتمدد الخلفية","قف منتصبًا واعصر المؤخرة"]],
      m:[["Rounding the lower back","Turning it into a squat"],["تقوس أسفل الظهر","تحويلها إلى سكوات"]] },
    hipthr:{ n:["Hip thrust","دفع الورك"], yt:"barbell hip thrust",
      c:[["Upper back on the bench","Chin tucked, ribs down","Squeeze the glutes hard at the top","Pause one second up top"],["أعلى الظهر على المقعد","الذقن للداخل والأضلاع لأسفل","اعصر المؤخرة بقوة في الأعلى","توقف ثانية في الأعلى"]],
      m:[["Overarching the lower back","Pushing through the toes"],["إفراط في تقويس الظهر","الدفع من أطراف القدم"]] },
    lunge:{ n:["Walking lunge","الطعنات المتحركة"], yt:"walking lunge",
      c:[["Long step forward","Both knees to about 90 degrees","Front knee over the ankle","Push tall off the front heel"],["خطوة طويلة للأمام","الركبتان نحو 90 درجة","الركبة الأمامية فوق الكاحل","ادفع للأعلى من كعب الأمام"]],
      m:[["Short choppy steps","Knee slamming the floor"],["خطوات قصيرة متقطعة","اصطدام الركبة بالأرض"]] },
    legext:{ n:["Leg extension","تمديد الأرجل"], yt:"leg extension",
      c:[["Pause one second at the top","Lower in three seconds","Do not swing the weight"],["توقف ثانية في الأعلى","انزل في ثلاث ثوانٍ","لا تؤرجح الوزن"]],
      m:[["Kicking with momentum"],["الركل بالزخم"]] },
    legcurl:{ n:["Seated leg curl","ثني الأرجل جالسًا"], yt:"seated leg curl",
      c:[["Full squeeze at the bottom","Slow controlled release","Keep the hips down"],["عصر كامل في الأسفل","إطلاق بطيء متحكم","أبقِ الوركين لأسفل"]],
      m:[["Lifting the hips to cheat"],["رفع الوركين للغش"]] },
    calf:{ n:["Standing calf raise","رفع السمانة وقوفًا"], yt:"standing calf raise",
      c:[["Full stretch at the bottom","Rise all the way onto the toes","One-second pause at the top","No bouncing"],["تمدد كامل في الأسفل","ارتفع كاملًا على الأطراف","توقف ثانية في الأعلى","دون ارتداد"]],
      m:[["Fast bouncing reps"],["تكرارات سريعة مرتدة"]] },
    plank:{ n:["Plank","البلانك"], yt:"plank exercise proper form",
      c:[["Forearms under the shoulders","Straight line head to heels","Squeeze glutes and brace the stomach","Breathe steadily"],["الساعدان تحت الكتفين","خط مستقيم من الرأس للكعب","اعصر المؤخرة وشد البطن","تنفس بانتظام"]],
      m:[["Hips sagging or piking"],["تدلي الوركين أو رفعهما"]] },
    deadbug:{ n:["Dead bug","تمرين الحشرة الميتة"], yt:"dead bug exercise",
      c:[["Lower back pressed to the floor","Opposite arm and leg extend","Slow and controlled","Exhale as you extend"],["أسفل الظهر ملاصق للأرض","مدّ الذراع والساق المتقابلتين","ببطء وتحكم","ازفر عند المد"]],
      m:[["Arching the lower back"],["تقوس أسفل الظهر"]] },
    bike:{ n:["Bike (easy pace)","الدراجة (إيقاع هادئ)"], yt:"stationary bike cardio",
      c:[["A pace where you can still talk","Relaxed shoulders","Smooth circles, no mashing"],["إيقاع يمكنك الحديث خلاله","أكتاف مسترخية","دوائر سلسة دون ضغط عنيف"]], m:[[],[]] },
    rower:{ n:["Rowing machine","جهاز التجديف"], yt:"rowing machine technique",
      c:[["Legs push first, then lean, then pull","Long smooth strokes","Light grip on the handle"],["ادفع بالساقين ثم الميل ثم السحب","ضربات طويلة سلسة","قبضة خفيفة على المقبض"]],
      m:[["Pulling with the arms first"],["السحب بالذراعين أولًا"]] },
    incwalk:{ n:["Treadmill incline walk","مشي على الجري بميل"], yt:"treadmill incline walk",
      c:[["Incline 6-10 percent, easy speed","Do not hold the rails","Tall posture, steady breathing"],["ميل 6-10٪ وسرعة هادئة","لا تمسك المقابض","وقفة منتصبة وتنفس ثابت"]], m:[[],[]] },
    walk:{ n:["Brisk outdoor walk","مشي سريع في الخارج"], yt:"brisk walking",
      c:[["A pace you could keep for an hour","Relaxed shoulders, look ahead","Counts fully toward your steps"],["إيقاع تحافظ عليه لساعة","أكتاف مسترخية والنظر للأمام","يُحتسب كاملًا ضمن خطواتك"]], m:[[],[]] },
    stretch:{ n:["Mobility and stretching","مرونة وإطالة"], yt:"full body mobility stretch",
      c:[["Hips, hamstrings, chest, shoulders","Gentle 30-second holds","Never bounce or strain"],["الوركان والخلفية والصدر والكتفان","ثبات لطيف 30 ثانية","دون ارتداد أو إجهاد"]], m:[[],[]] }
  };
  const PROGRAM = {
    1:{ title:["Upper body A","الجزء العلوي أ"], tag:["Strength","قوة"], time:"6:45 pm", dur:"55 min",
        blurb:["Chest, back, shoulders and arms. Leave one or two reps in the tank on every set.","صدر وظهر وكتفان وذراعان. اترك تكرارًا أو اثنين في كل مجموعة."],
        items:[ {x:"incwalk",s:"1 x 5 min",rest:0},{x:"bench",s:"3 x 6-8",rest:120,rpe:"RPE 7-8"},{x:"cablerow",s:"3 x 10-12",rest:90,rpe:"RPE 7-8"},
                {x:"ohp",s:"3 x 8-10",rest:90,rpe:"RPE 7"},{x:"latpull",s:"3 x 10-12",rest:90,rpe:"RPE 7-8"},
                {x:"tripush",s:"2 x 12-15",rest:60,rpe:"RPE 8"},{x:"curl",s:"2 x 12-15",rest:60,rpe:"RPE 8"},{x:"incwalk",s:"1 x 10 min",rest:0} ] },
    2:{ title:["Lower body A + core","الجزء السفلي أ + بطن"], tag:["Strength","قوة"], time:"6:45 pm", dur:"55 min",
        blurb:["Legs and core. Lower body burns the most energy - this day matters.","أرجل وبطن. الجزء السفلي يحرق أكبر طاقة، فهذا اليوم مهم."],
        items:[ {x:"bike",s:"1 x 5 min",rest:0},{x:"legpress",s:"3 x 10-12",rest:120,rpe:"RPE 7-8"},{x:"rdl",s:"3 x 8-10",rest:90,rpe:"RPE 7"},
                {x:"lunge",s:"2 x 10",rest:75,rpe:"RPE 7"},{x:"legcurl",s:"2 x 12-15",rest:60,rpe:"RPE 8"},
                {x:"plank",s:"3 x 30-45 sec",rest:45},{x:"deadbug",s:"2 x 10",rest:45},{x:"bike",s:"1 x 8 min",rest:0} ] },
    3:{ title:["Active recovery walk","مشي استشفاء"], tag:["Recovery","استشفاء"], time:"6:45 pm", dur:"40 min",
        blurb:["A brisk walk and a stretch. Recovery is where the body changes.","مشي سريع وإطالة. الاستشفاء هو حيث يتغير الجسم."],
        items:[ {x:"walk",s:"1 x 35 min",rest:0},{x:"stretch",s:"1 x 10 min",rest:0} ] },
    4:{ title:["Upper body B","الجزء العلوي ب"], tag:["Strength","قوة"], time:"6:45 pm", dur:"55 min",
        blurb:["Same muscles, fresh angles. Try to add a rep or a small load versus Monday.","العضلات ذاتها بزوايا جديدة. أضف تكرارًا أو وزنًا بسيطًا عن الاثنين."],
        items:[ {x:"rower",s:"1 x 5 min",rest:0},{x:"incdb",s:"3 x 8-10",rest:90,rpe:"RPE 7-8"},{x:"apullup",s:"3 x 8-10",rest:90,rpe:"RPE 7-8"},
                {x:"machsh",s:"3 x 10-12",rest:75,rpe:"RPE 7"},{x:"dbrow",s:"3 x 10-12",rest:75,rpe:"RPE 7-8"},
                {x:"lateral",s:"2 x 12-15",rest:45,rpe:"RPE 8"},{x:"facepull",s:"2 x 15",rest:45},{x:"incwalk",s:"1 x 10 min",rest:0} ] },
    5:{ title:["Lower body B + cardio","الجزء السفلي ب + كارديو"], tag:["Strength","قوة"], time:"9:30 am", dur:"60 min",
        blurb:["Morning session on your day off, finished before Friday prayer.","حصة صباحية في يوم إجازتك، تنتهي قبل صلاة الجمعة."],
        items:[ {x:"bike",s:"1 x 5 min",rest:0},{x:"goblet",s:"3 x 10-12",rest:90,rpe:"RPE 7-8"},{x:"hipthr",s:"3 x 10-12",rest:90,rpe:"RPE 7-8"},
                {x:"legext",s:"2 x 12-15",rest:60,rpe:"RPE 8"},{x:"legcurl",s:"2 x 12-15",rest:60,rpe:"RPE 8"},
                {x:"calf",s:"3 x 15-20",rest:45},{x:"incwalk",s:"1 x 15 min",rest:0} ] },
    6:{ title:["Conditioning + core","لياقة + بطن"], tag:["Cardio","كارديو"], time:"9:30 am", dur:"50 min",
        blurb:["Your engine day. From week 5 swap 10 minutes for intervals: 30s brisk, 90s easy, eight rounds.","يوم محركك. من الأسبوع الخامس استبدل 10 دقائق بفترات: 30ث سريع و90ث هادئ، ثماني جولات."],
        items:[ {x:"bike",s:"1 x 5 min",rest:0},{x:"rower",s:"1 x 15 min",rest:0},{x:"incwalk",s:"1 x 15 min",rest:0},
                {x:"plank",s:"3 x 30-45 sec",rest:45},{x:"deadbug",s:"2 x 10",rest:45},{x:"stretch",s:"1 x 10 min",rest:0} ] },
    0:{ title:["Rest + class day","راحة ويوم الحصة"], tag:["Rest","راحة"], time:"-", dur:"20 min",
        blurb:["CPD class 7-9 pm. Rest is part of the program - your muscles grow today.","حصة التطوير 7-9 مساءً. الراحة جزء من البرنامج، عضلاتك تنمو اليوم."],
        items:[ {x:"walk",s:"1 x 15-20 min",rest:0},{x:"stretch",s:"1 x 10 min",rest:0} ] }
  };

  const RECIPES = [
    { name:["Vegetable masala omelette","أومليت الخضار بالبهارات"], tag:["Breakfast - 380 kcal, 30 g protein","فطور - 380 سعرة، 30 جم بروتين"], time:["10 min","10 دقائق"],
      ing:[["3 eggs or 2 eggs plus 3 whites","Onion, tomato, capsicum","A handful of spinach","Turmeric, chilli, salt","1 tsp olive oil"],["3 بيضات أو بيضتان مع 3 بياضات","بصل وطماطم وفلفل","حفنة سبانخ","كركم وفلفل حار وملح","ملعقة زيت زيتون"]],
      steps:[["Soften the vegetables in the oil for 2-3 minutes","Pour in the beaten eggs with the spices","Fold gently until just set","Pair with one small khubz or skip the bread"],["اطبخ الخضار في الزيت 2-3 دقائق","أضف البيض المخفوق مع البهارات","اطوِ برفق حتى ينضج","قدّمه مع خبز صغير أو دونه"]] },
    { name:["Overnight oats with whey or yogurt","شوفان منقوع مع بروتين أو زبادي"], tag:["Breakfast - 420 kcal, 35 g protein","فطور - 420 سعرة، 35 جم بروتين"], time:["5 min plus overnight","5 دقائق وليلة كاملة"],
      ing:[["60 g oats","1 scoop whey or 170 g Greek yogurt","Milk to cover","Cinnamon, berries or half a banana"],["60 جم شوفان","مكيال بروتين أو 170 جم زبادي يوناني","حليب للتغطية","قرفة وتوت أو نصف موزة"]],
      steps:[["Mix everything in a jar the night before","Refrigerate overnight","Grab and eat before the commute"],["اخلط الكل في برطمان في الليلة السابقة","ضعه في الثلاجة طوال الليل","تناوله قبل الخروج"]] },
    { name:["Yogurt grilled chicken, salad and small rice","دجاج مشوي بالزبادي مع سلطة وأرز قليل"], tag:["Lunch - 550 kcal, 50 g protein","غداء - 550 سعرة، 50 جم بروتين"], time:["25 min plus marinate","25 دقيقة مع التتبيل"],
      ing:[["200 g chicken breast","3 tbsp yogurt, garlic, ginger, lemon, paprika","Large mixed salad","One cupped palm of cooked rice"],["200 جم صدر دجاج","3 ملاعق زبادي وثوم وزنجبيل وليمون وبابريكا","سلطة مشكلة كبيرة","حفنة أرز مطبوخ"]],
      steps:[["Marinate the chicken 20 minutes or more","Grill or pan-cook until done","Half the plate salad, then chicken, then the small rice"],["تبّل الدجاج 20 دقيقة فأكثر","اشوِه أو اقليه قليلًا حتى ينضج","نصف الطبق سلطة ثم الدجاج ثم الأرز القليل"]] },
    { name:["Chicken and vegetable stir-fry","دجاج وخضار سوتيه"], tag:["Dinner - 480 kcal, 45 g protein","عشاء - 480 سعرة، 45 جم بروتين"], time:["20 min","20 دقيقة"],
      ing:[["200 g sliced chicken","Broccoli, carrot, capsicum, beans","Garlic and ginger","1 tbsp light soy, splash of vinegar","1 tsp oil"],["200 جم دجاج شرائح","بروكلي وجزر وفلفل وفاصوليا","ثوم وزنجبيل","ملعقة صويا خفيفة ورشة خل","ملعقة زيت"]],
      steps:[["Sear the chicken on high heat, set aside","Stir-fry the vegetables 3-4 minutes, keep them crunchy","Return the chicken with garlic, ginger and sauce for one minute"],["حمّر الدجاج على نار عالية وأبعده","اقلِ الخضار 3-4 دقائق مع بقائها مقرمشة","أعد الدجاج مع الثوم والزنجبيل والصلصة دقيقة"]] },
    { name:["Grilled fish, potato and salad","سمك مشوي مع بطاطس وسلطة"], tag:["Dinner - 470 kcal, 40 g protein","عشاء - 470 سعرة، 40 جم بروتين"], time:["25 min","25 دقيقة"],
      ing:[["200 g hammour or any white fish","Lemon, garlic, cumin, salt","1 medium boiled potato","Cucumber-tomato salad"],["200 جم هامور أو أي سمك أبيض","ليمون وثوم وكمون وملح","حبة بطاطس مسلوقة متوسطة","سلطة خيار وطماطم"]],
      steps:[["Season the fish and grill or bake until it flakes","Boil the potato and dress the salad with lemon","A light, filling plate for evenings"],["تبّل السمك واشوِه حتى يتفتت","اسلق البطاطس وتبّل السلطة بالليمون","طبق خفيف ومشبع للمساء"]] },
    { name:["Curd or yogurt with nuts and fruit","زبادي مع مكسرات وفاكهة"], tag:["Snack - 220 kcal, 15 g protein","وجبة خفيفة - 220 سعرة، 15 جم بروتين"], time:["3 min","3 دقائق"],
      ing:[["1 cup plain yogurt or laban","Small handful of nuts","Berries, apple or half a banana","Pinch of cinnamon"],["كوب زبادي أو لبن","حفنة صغيرة مكسرات","توت أو تفاح أو نصف موزة","رشة قرفة"]],
      steps:[["Spoon, top, eat","Your default office snack instead of anything fried or sugary"],["ضع وأضف وتناول","وجبتك المكتبية بدلًا من المقلي أو السكري"]] },
    { name:["Lentil soup and salad","شوربة عدس وسلطة"], tag:["Light dinner - 380 kcal, 20 g protein","عشاء خفيف - 380 سعرة، 20 جم بروتين"], time:["30 min","30 دقيقة"],
      ing:[["1 cup red lentils","Onion, carrot, cumin, stock","Lemon to finish","Side salad"],["كوب عدس أحمر","بصل وجزر وكمون ومرق","ليمون في النهاية","سلطة جانبية"]],
      steps:[["Simmer lentils with onion, carrot and cumin 20-25 minutes","Blend if you like, finish with lemon","Good for lighter evenings after big lunches"],["اطبخ العدس مع البصل والجزر والكمون 20-25 دقيقة","اخلطه إن أحببت وأضف الليمون","مناسب للمساء الخفيف بعد غداء كبير"]] }
  ];
  const EATOUT = [
    ["Grill restaurants: shish tawook or grilled half chicken, extra salad, small rice, skip the fries.","مطاعم المشويات: شيش طاووق أو نصف دجاجة مشوية، سلطة إضافية، أرز قليل، دون بطاطس مقلية."],
    ["Shawarma: plate over sandwich, grilled meat, no fries inside, light sauce.","الشاورما: صحن بدل الساندويتش، لحم مشوي، دون بطاطس بالداخل، صلصة خفيفة."],
    ["Broast places: ask for grilled, never broasted or fried.","مطاعم البروست: اطلب المشوي لا المقلي."],
    ["Office cafeteria: protein first, fill half the tray with salad before anything else.","كافتيريا العمل: البروتين أولًا، واملأ نصف الصينية سلطة قبل أي شيء."],
    ["Karak and sweet tea: switch to unsweetened or one sugar, none after 6 pm.","الكرك والشاي المحلى: بلا سكر أو ملعقة واحدة، ولا شيء بعد السادسة مساءً."]
  ];
  const COMPS = {
    "Mandatory":["Ethics, Rules of Conduct and professionalism","Client care","Communication and negotiation","Health and safety","Accounting principles and procedures","Business planning","Conflict avoidance, management and dispute resolution","Data management","Diversity, inclusion and teamworking","Sustainability"],
    "Technical (QS pathway)":["Quantification and costing of construction works","Design economics and cost planning","Commercial management of construction","Contract practice","Procurement and tendering","Project financial control and reporting","Construction technology and environmental services"]
  };
  const COMP_GROUP = { "Mandatory":["Mandatory","الكفاءات الإلزامية"], "Technical (QS pathway)":["Technical (QS pathway)","الكفاءات الفنية - مسار حساب الكميات"] };
  const MILESTONES = [
    { id:"m1", when:["Now","الآن"], t:["Case study + main technical competencies","دراسة الحالة والكفاءات الفنية الأساسية"], d:["Draft the case study and your strongest technical examples first.","ابدأ بدراسة الحالة وأقوى أمثلتك الفنية."] },
    { id:"m2", when:["By September","بحلول سبتمبر"], t:["Ethics and the rest","الأخلاقيات وبقية الكفاءات"], d:["Lock in ethics and round out the remaining competencies.","ثبّت الأخلاقيات وأكمل بقية الكفاءات."] },
    { id:"m3", when:["October","أكتوبر"], t:["Mock interviews and presentation","مقابلات تجريبية وعرض تقديمي"], d:["Practise the presentation and Q&A out loud, repeatedly.","تدرّب على العرض والأسئلة بصوت عالٍ مرارًا."] },
    { id:"m4", when:["Early November","أوائل نوفمبر"], t:["Light revision","مراجعة خفيفة"], d:["Gentle review and confidence. Sleep well before the day.","مراجعة هادئة وثقة، ونوم جيد قبل اليوم."] }
  ];

  // ===================== computed =====================
  const completion = k => { const c=day(k).check; let n=0; CHECK.forEach(it=>{ if (c[it.id]) n++; }); return { n, total:CHECK.length, pct:Math.round(n/CHECK.length*100) }; };
  const isGood = k => completion(k).n >= GOOD_MIN;
  function habitStreak(){ let k=todayKey(); if (!isGood(k)) k=addDaysKey(k,-1); let s=0; while (state.days[k]&&isGood(k)){ s++; k=addDaysKey(k,-1); } return s; }
  function studyStreak(){ let k=todayKey(); if (!(state.days[k]&&state.days[k].focus>0)) k=addDaysKey(k,-1); let s=0; while (state.days[k]&&state.days[k].focus>0){ s++; k=addDaysKey(k,-1); } return s; }
  function goodDaysThisWeek(){ const k=todayKey(), wd=weekdayOf(k), start=addDaysKey(k,-wd); let n=0; for (let i=0;i<=wd;i++){ const kk=addDaysKey(start,i); if (state.days[kk]&&isGood(kk)) n++; } return n; }
  const latestKg = () => state.weights.length ? state.weights[state.weights.length-1].kg : state.profile.startKg;
  function targets(){ const cur=latestKg(), p=state.profile;
    const bmr=10*cur+6.25*p.heightCm-5*p.age+(p.sex==="female"?-161:5);
    const tdee=bmr*p.activity;
    const kcal=Math.max(1500, Math.round((tdee-p.deficit)/10)*10);
    const protein=Math.round(p.proteinPerKg*cur);
    const fat=Math.round(kcal*0.25/9);
    const carbs=Math.max(0, Math.round((kcal-protein*4-fat*9)/4));
    return { bmr:Math.round(bmr), tdee:Math.round(tdee), kcal, protein, fat, carbs };
  }
  function projection(){ const cur=latestKg(), goal=state.profile.goalKg, pace=Math.min(1,Math.max(.5,state.profile.pace));
    const left=cur-goal; if (left<=0) return { reached:true };
    const weeks=left/pace; const d=new Date(); d.setDate(d.getDate()+Math.round(weeks*7));
    return { reached:false, weeks:Math.round(weeks), date:d, left };
  }
  function weeksSinceStart(){ return Math.max(0, Math.floor((new Date(todayKey())-new Date(state.profile.startDate))/604800000)); }
  function daysToExam(){ const d=Math.ceil((new Date(state.profile.examDate)-new Date(todayKey()))/86400000); return isFinite(d)?d:null; }
  // top of the rep range from a prescription like "3 x 6-8"
  function repTop(s){ const m=String(s).match(/(\d+)\s*-\s*(\d+)/); return m ? +m[2] : null; }
  function coachAdvice(sets, top, lower){
    if (!sets || !sets.length || top==null) return null;
    const allTop = sets.every(s => s.r >= top);
    const anyLow = sets.some(s => s.r < top - 3);
    const inc = lower ? 5 : 2.5;
    if (allTop) return { good:true, msg:t(`Strong - add ${inc} kg next session.`, `أداء قوي - أضف ${inc} كجم في الحصة القادمة.`) };
    if (anyLow) return { good:false, msg:t("Hold this weight until the reps come up.", "ثبّت الوزن حتى ترتفع التكرارات.") };
    return { good:false, msg:t("Good - push for the top of the range next time.", "جيد - استهدف أعلى المدى المرة القادمة.") };
  }

  // ===================== helpers =====================
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
  const TICK = `<svg class="tick" viewBox="0 0 24 24" fill="none" stroke="#04201b" stroke-width="3.5"><path d="M5 12l4 4L19 7"/></svg>`;
  function ringSVG(pct, color){ color=color||"var(--teal)"; const r=52, c=2*Math.PI*r, off=c*(1-Math.min(100,Math.max(0,pct))/100);
    return `<svg width="118" height="118" viewBox="0 0 118 118"><circle cx="59" cy="59" r="${r}" stroke="var(--track)" stroke-width="11" fill="none"/><circle cx="59" cy="59" r="${r}" stroke="${color}" stroke-width="11" fill="none" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 59 59)" style="transition:stroke-dashoffset .8s cubic-bezier(.2,.7,.3,1)"/></svg>`; }
  const meter = (pct, cls) => `<div class="meter ${cls||""}"><span style="width:${Math.max(0,Math.min(100,pct))}%"></span></div>`;

  // animated SVG exercise demos (SMIL, offline)
  const FIG="#9fb0c3", IMP="#2dd4bf";
  function demo(p){ const Ln=`stroke="${FIG}" stroke-width="3" fill="none" stroke-linecap="round"`, o=`<svg viewBox="0 0 100 80" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`;
    switch(p){
      case "press": return `${o}<g ${Ln}><line x1="30" y1="72" x2="70" y2="72"/><circle cx="50" cy="50" r="6"/><line x1="50" y1="56" x2="50" y2="68"/></g><rect x="32" y="42" width="36" height="5" rx="2.5" fill="${IMP}"><animate attributeName="y" values="42;20;42" dur="2.2s" repeatCount="indefinite"/></rect></svg>`;
      case "pull": return `${o}<g ${Ln}><line x1="30" y1="74" x2="70" y2="74"/><circle cx="50" cy="42" r="6"/><line x1="50" y1="48" x2="50" y2="66"/></g><rect x="30" y="14" width="40" height="5" rx="2.5" fill="${IMP}"><animate attributeName="y" values="14;32;14" dur="2.2s" repeatCount="indefinite"/></rect></svg>`;
      case "row": return `${o}<g ${Ln}><line x1="16" y1="70" x2="40" y2="70"/><circle cx="24" cy="34" r="6"/><line x1="24" y1="40" x2="24" y2="60"/><line x1="92" y1="30" x2="66" y2="47" stroke-width="1.5"/></g><rect x="64" y="40" width="5" height="14" rx="2" fill="${IMP}"><animate attributeName="x" values="64;38;64" dur="2s" repeatCount="indefinite"/></rect></svg>`;
      case "hinge": return `${o}<g ${Ln}><line x1="38" y1="74" x2="62" y2="74"/><line x1="50" y1="74" x2="50" y2="54"/></g><g ${Ln}><line x1="50" y1="54" x2="50" y2="28"/><circle cx="50" cy="22" r="6"/><animateTransform attributeName="transform" type="rotate" values="0 50 54;34 50 54;0 50 54" dur="2.6s" repeatCount="indefinite"/></g></svg>`;
      case "squat": return `${o}<g ${Ln}><line x1="34" y1="72" x2="66" y2="72"/><line x1="50" y1="60" x2="42" y2="72"/><line x1="50" y1="60" x2="58" y2="72"/></g><g><line x1="50" y1="44" x2="50" y2="60" ${Ln}/><circle cx="50" cy="38" r="6" ${Ln}/><rect x="30" y="41" width="40" height="5" rx="2.5" fill="${IMP}"/><animateTransform attributeName="transform" type="translate" values="0 0;0 12;0 0" dur="2.4s" repeatCount="indefinite"/></g></svg>`;
      case "lateral": return `${o}<g ${Ln}><line x1="36" y1="72" x2="64" y2="72"/><circle cx="50" cy="22" r="6"/><line x1="50" y1="28" x2="50" y2="48"/></g><g ${Ln}><line x1="47" y1="32" x2="45" y2="50"/><circle cx="45" cy="50" r="3" fill="${IMP}" stroke="none"/><animateTransform attributeName="transform" type="rotate" values="0 47 32;-78 47 32;0 47 32" dur="2.2s" repeatCount="indefinite"/></g><g ${Ln}><line x1="53" y1="32" x2="55" y2="50"/><circle cx="55" cy="50" r="3" fill="${IMP}" stroke="none"/><animateTransform attributeName="transform" type="rotate" values="0 53 32;78 53 32;0 53 32" dur="2.2s" repeatCount="indefinite"/></g></svg>`;
      case "curl": return `${o}<g ${Ln}><line x1="30" y1="74" x2="60" y2="74"/><circle cx="42" cy="22" r="6"/><line x1="42" y1="28" x2="40" y2="48"/></g><g ${Ln}><line x1="40" y1="48" x2="42" y2="66"/><circle cx="42" cy="66" r="3.5" fill="${IMP}" stroke="none"/><animateTransform attributeName="transform" type="rotate" values="0 40 48;-120 40 48;0 40 48" dur="1.8s" repeatCount="indefinite"/></g></svg>`;
      case "legext": return `${o}<g ${Ln}><line x1="18" y1="56" x2="50" y2="56"/><circle cx="26" cy="28" r="6"/><line x1="26" y1="34" x2="26" y2="52"/><line x1="26" y1="52" x2="50" y2="52"/></g><g ${Ln}><line x1="50" y1="52" x2="50" y2="70"/><circle cx="50" cy="70" r="3.5" fill="${IMP}" stroke="none"/><animateTransform attributeName="transform" type="rotate" values="0 50 52;-78 50 52;0 50 52" dur="2s" repeatCount="indefinite"/></g></svg>`;
      case "calf": return `${o}<g><g ${Ln}><circle cx="50" cy="30" r="6"/><line x1="50" y1="36" x2="50" y2="52"/><line x1="50" y1="52" x2="44" y2="66"/><line x1="50" y1="52" x2="56" y2="66"/></g><animateTransform attributeName="transform" type="translate" values="0 0;0 -7;0 0" dur="1.1s" repeatCount="indefinite"/></g><line x1="34" y1="70" x2="66" y2="70" stroke="${FIG}" stroke-width="3" opacity=".5"/></svg>`;
      case "plank": return `${o}<g ${Ln}><animateTransform attributeName="transform" type="translate" values="0 0;0 1.6;0 0" dur="3s" repeatCount="indefinite"/><circle cx="26" cy="48" r="5"/><line x1="30" y1="50" x2="74" y2="60"/><line x1="30" y1="50" x2="26" y2="62"/><line x1="26" y1="62" x2="36" y2="62"/><line x1="74" y1="60" x2="82" y2="70"/></g><line x1="20" y1="72" x2="86" y2="72" stroke="${FIG}" stroke-width="2" opacity=".5"/></svg>`;
      case "cardio": return `${o}<g ${Ln}><circle cx="50" cy="22" r="6"/><line x1="50" y1="28" x2="47" y2="44"/></g><circle cx="46" cy="56" r="12" stroke="${FIG}" stroke-width="2" fill="none"/><circle cx="46" cy="56" r="2" fill="${FIG}"/><g><circle cx="46" cy="44" r="4" fill="${IMP}"/><circle cx="46" cy="68" r="4" fill="${IMP}"/><animateTransform attributeName="transform" type="rotate" values="0 46 56;360 46 56" dur="2s" repeatCount="indefinite"/></g></svg>`;
      default: return `${o}<g ${Ln}><circle cx="50" cy="22" r="6"/><line x1="50" y1="28" x2="50" y2="52"/></g><g ${Ln}><line x1="50" y1="52" x2="44" y2="72"/><animateTransform attributeName="transform" type="rotate" values="16 50 52;-16 50 52;16 50 52" dur="1.1s" repeatCount="indefinite"/></g><g ${Ln}><line x1="50" y1="52" x2="56" y2="72"/><animateTransform attributeName="transform" type="rotate" values="-16 50 52;16 50 52;-16 50 52" dur="1.1s" repeatCount="indefinite"/></g><line x1="28" y1="74" x2="72" y2="74" stroke="${FIG}" stroke-width="2" opacity=".5"/></svg>`;
    }
  }
  const patternOf = ex => {
    const id = Object.keys(EX).find(k => EX[k]===ex);
    const map = { bench:"press",incdb:"press",ohp:"press",machsh:"press",mpress:"press",latpull:"pull",apullup:"pull",cablerow:"row",dbrow:"row",facepull:"row",lateral:"lateral",curl:"curl",tripush:"curl",legpress:"squat",goblet:"squat",lunge:"squat",rdl:"hinge",hipthr:"hinge",legext:"legext",legcurl:"legext",calf:"calf",plank:"plank",deadbug:"plank",bike:"cardio",rower:"cardio",incwalk:"walk",walk:"walk",stretch:"walk" };
    return map[id] || "walk";
  };

  // ===================== renderers =====================
  function prayerCard(wd){
    const c = CITIES[state.settings.city] || CITIES.riyadh;
    const pt = prayerTimes(new Date(), c.lat, c.lng, c.tz);
    const order = ["fajr","dhuhr","asr","maghrib","isha"];
    const cells = order.map(k => {
      const lbl = (wd===5 && k==="dhuhr") ? PRAYER_LABELS.jumua : PRAYER_LABELS[k];
      return `<div class="prayer"><div class="pn">${P(lbl)}</div><div class="pt">${pt[k]}</div></div>`;
    }).join("");
    const cityOpts = Object.keys(CITIES).map(key => `<option value="${key}" ${key===state.settings.city?"selected":""}>${P(CITIES[key].n)}</option>`).join("");
    return `<div class="card"><div class="row between"><h3>${t("Prayer times","مواقيت الصلاة")}</h3>
        <select data-bind="city" style="width:auto;padding:6px 10px;font-size:13px">${cityOpts}</select></div>
      <div class="grid5" style="margin-top:10px">${cells}</div>
      <div class="small dim" style="margin-top:8px">${t("Approximate (Umm al-Qura). Confirm with your local mosque. Sunrise","تقريبية (أم القرى). تأكد من مسجدك. الشروق")} ${pt.sunrise}.</div></div>`;
  }
  function homeSchedule(wd){
    const c = CITIES[state.settings.city] || CITIES.riyadh;
    const pt = prayerTimes(new Date(), c.lat, c.lng, c.tz);
    const rows = schedFor(wd).map(r => ({ m:toMin(r[0]), time:r[0], text:P([r[1],r[2]]), pr:false }));
    ["fajr","dhuhr","asr","maghrib","isha"].forEach(k => {
      const lbl = (wd===5 && k==="dhuhr") ? PRAYER_LABELS.jumua : PRAYER_LABELS[k];
      rows.push({ m:toMin(pt[k]), time:pt[k], text:P(lbl), pr:true });
    });
    rows.sort((a,b)=>a.m-b.m);
    const now = new Date().getHours()*60 + new Date().getMinutes();
    let nowIdx=-1; rows.forEach((r,i)=>{ if (r.m<=now) nowIdx=i; });
    return rows.map((r,i)=>`<div class="srow ${i===nowIdx?"now":""} ${r.pr?"pr":""}"><div class="t">${r.time}</div><div class="w">${r.text}</div></div>`).join("");
  }

  function renderHome(){
    const k=todayKey(), d=day(k), comp=completion(k), wd=weekdayOf(k), prog=PROGRAM[wd], tg=targets(), pr=projection();
    const checks = CHECK.map(it=>{ const on=!!d.check[it.id];
      return `<button class="check ${on?"done":""}" data-action="toggleCheck" data-id="${it.id}"><span class="box">${on?TICK:""}</span><span class="grow"><div class="label">${P(it.l)}</div><div class="hint">${P(it.h)}</div></span></button>`; }).join("");
    const lost = state.profile.startKg - latestKg();
    $("p-home").innerHTML =
      `<div class="card"><div class="ring-wrap"><div class="ring">${ringSVG(comp.pct)}<div class="pct"><div class="center"><b>${comp.pct}%</b><div class="micro">${t("today","اليوم")}</div></div></div></div>
        <div class="grow"><div class="row between"><div class="micro">${t("Daily progress","تقدم اليوم")}</div><span class="pill teal">${habitStreak()} ${t("day streak","يوم متتابع")}</span></div>
        <div style="font-size:18px;font-weight:800;margin:4px 0">${comp.n} / ${comp.total}</div>
        <div class="small muted">${t("Four or five good days out of seven is success - not perfection.","أربعة أو خمسة أيام جيدة من سبعة هو النجاح، لا الكمال.")}</div>
        <div class="small" style="margin-top:6px">${t("Good days this week","الأيام الجيدة هذا الأسبوع")}: <b>${goodDaysThisWeek()}</b> / 7</div></div></div></div>

      <div class="card"><div class="row between"><h3>${P(DOW[wd])} - ${P(prog.title)}</h3><span class="pill dim">${P(prog.tag)}</span></div>
        <div class="small muted" style="margin:2px 0 8px">${prettyDate(k)} - ${t("about","نحو")} ${prog.dur}</div>
        <div class="grid4" style="margin:10px 0">
          <div class="stat center"><div class="n">${tg.kcal}</div><div class="l">${t("kcal","سعرة")}</div></div>
          <div class="stat center"><div class="n" style="color:var(--teal)">${tg.protein}</div><div class="l">${t("protein","بروتين")}</div></div>
          <div class="stat center"><div class="n">${d.steps>=1000?(d.steps/1000).toFixed(1)+"k":d.steps}</div><div class="l">${t("steps","خطوات")}</div></div>
          <div class="stat center"><div class="n" style="color:var(--sky)">${d.water}/${state.settings.waterGoal}</div><div class="l">${t("water","ماء")}</div></div></div>
        <div class="row" style="gap:8px"><button class="btn primary grow" data-action="go" data-tab="train">${t("Open training","افتح التمرين")}</button><button class="btn" data-action="go" data-tab="fuel">${t("Food plan","خطة الطعام")}</button></div></div>

      ${prayerCard(wd)}

      <div class="card"><h3>${t("Your day, hour by hour","يومك ساعة بساعة")}</h3>
        <div class="small muted" style="margin-bottom:10px">${t("Built around your routine and prayer times.","مبني حول روتينك ومواقيت الصلاة.")}</div>
        <div class="sched">${homeSchedule(wd)}</div></div>

      <h2 class="section">${t("Today's checklist","قائمة اليوم")}</h2><div class="card">${checks}</div>

      <div class="card"><div class="row between"><h3>${t("Mission: minus 20 kg","الهدف: -20 كجم")}</h3><span class="pill teal">${lost>0?"-"+lost.toFixed(1)+" "+t("kg so far","كجم حتى الآن"):t("day one","اليوم الأول")}</span></div>
        <div class="small muted" style="margin-top:6px">${pr.reached?t("Goal reached. Now we hold it.","تحقق الهدف. الآن نحافظ عليه."):
          t(`At the maximum safe pace (about 1 kg per week) you reach 78 kg around ${prettyMonth(pr.date)}. The first month often drops faster with water. We will not crash beyond this: crash pace burns muscle and rebounds.`,
            `بأقصى وتيرة آمنة (نحو 1 كجم أسبوعيًا) تصل إلى 78 كجم قرابة ${prettyMonth(pr.date)}. الشهر الأول غالبًا أسرع بسبب الماء. لن نتجاوز ذلك: الوتيرة القاسية تحرق العضل وترتد.`)}</div></div>

      <div class="note"><div class="micro">${t("Look after yourself","اعتنِ بنفسك")}</div><div class="small" style="margin-top:4px">${t("Never crash diets, fat-burner pills or skipped meals. If you feel faint or very tired, see a doctor and check vitamin D, iron, blood sugar and thyroid. No weight-loss medication without a doctor.","لا حميات قاسية أو حبوب حرق دهون أو تفويت وجبات. إن شعرت بدوار أو تعب شديد فراجع طبيبًا وافحص فيتامين د والحديد وسكر الدم والغدة. لا دواء تخسيس دون طبيب.")}</div></div>`;
  }

  let selDay = null;
  function renderTrain(){
    const k=todayKey(), today=weekdayOf(k); if (selDay===null) selDay=today;
    const d=day(k), prog=PROGRAM[selDay], wk=weeksSinceStart();
    const phase = wk<2
      ? `<div class="note"><div class="micro">${t("Weeks 1-2: adaptation","الأسبوعان 1-2: التأقلم")}</div><div class="small" style="margin-top:4px">${t("Go easier than you think: 2 working sets, weights you could do 4 extra reps with. You are teaching movement, not testing strength.","اجعلها أسهل مما تظن: مجموعتان فقط بأوزان تستطيع معها 4 تكرارات إضافية. أنت تتعلم الحركة لا تختبر القوة.")}</div></div>`
      : wk<6
      ? `<div class="note"><div class="micro">${t("Weeks 3-6: build","الأسابيع 3-6: البناء")}</div><div class="small" style="margin-top:4px">${t("Full sets now. When you hit the top of a rep range with clean form, add a small load next time.","المجموعات كاملة الآن. عند بلوغ أعلى المدى بأداء نظيف أضف وزنًا بسيطًا في المرة القادمة.")}</div></div>`
      : `<div class="note"><div class="micro">${t("Week","الأسبوع")} ${wk+1}</div><div class="small" style="margin-top:4px">${t("Keep adding small loads or reps. One or two reps in reserve on every set - grind, never strain.","استمر بإضافة أوزان أو تكرارات بسيطة. اترك تكرارًا أو اثنين احتياطيًا، اجتهد دون إجهاد.")}</div></div>`;
    const chips = [0,1,2,3,4,5,6].map(i=>`<button data-action="selDay" data-i="${i}" class="${i===selDay?"active":""}">${P(DOW[i]).slice(0,3)}${i===today?" *":""}</button>`).join("");
    const cards = prog.items.map((it,idx)=>{
      const ex=EX[it.x], id=`${selDay}-${idx}`, on=!!d.exDone[id], pat=patternOf(ex);
      const loggable = !["cardio","walk"].includes(pat) && it.x!=="plank" && it.x!=="deadbug";
      const sets = (d.sets[id]||[]).map((s,i)=>`<div class="setrow"><span class="pill dim">${t("Set","مجموعة")} ${i+1}</span><b class="grow">${s.w} ${t("kg","كجم")} x ${s.r}</b><button class="del" data-action="delSet" data-id="${id}" data-i="${i}">${t("remove","حذف")}</button></div>`).join("");
      const advice = loggable ? coachAdvice(d.sets[id], repTop(it.s), pat==="squat"||pat==="hinge"||pat==="legext") : null;
      const yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.yt + " proper form")}`;
      return `<div class="card"><div class="row" style="gap:12px;align-items:flex-start">
          <div class="exdemo">${demo(pat)}</div>
          <div class="grow"><div class="row between"><b>${P(ex.n)}</b><button class="exbox ${on?"on":""}" data-action="exDone" data-id="${id}">${on?TICK:""}</button></div>
            <div class="small" style="color:var(--teal);font-weight:800">${it.s}${it.rpe?" - "+it.rpe:""}${it.rest?" - "+t("rest","راحة")+" "+it.rest+"s":""}</div>
            <div class="row" style="gap:12px;flex-wrap:wrap"><button class="link" data-action="how" data-id="${id}">${t("How to do it","طريقة الأداء")}</button>
              <a class="link vid" href="${yt}" target="_blank" rel="noopener">${t("Watch video","شاهد فيديو")}</a>
              ${loggable?`<button class="link" data-action="logToggle" data-id="${id}">${t("Log sets","سجّل المجموعات")}</button>`:""}
              ${it.rest?`<button class="link" data-action="rest" data-n="${it.rest}">${t("Rest","راحة")} ${it.rest}s</button>`:""}</div>
            ${advice?`<div class="coach ${advice.good?"":"hold"}">${advice.msg}</div>`:""}</div></div>
        <div class="fold" id="how-${id}"><h4 style="margin:10px 0 4px;font-size:12px;color:var(--teal);text-transform:uppercase;letter-spacing:.08em">${t("Form","الأداء")}</h4>
          <ul style="margin:0;padding-inline-start:18px">${P(ex.c).map(cc=>`<li class="muted small" style="margin:3px 0">${cc}</li>`).join("")}</ul>
          ${P(ex.m).length?`<h4 style="margin:10px 0 4px;font-size:12px;color:var(--amber);text-transform:uppercase;letter-spacing:.08em">${t("Avoid","تجنّب")}</h4><ul style="margin:0;padding-inline-start:18px">${P(ex.m).map(cc=>`<li class="muted small" style="margin:3px 0">${cc}</li>`).join("")}</ul>`:""}</div>
        ${loggable?`<div class="fold" id="log-${id}"><div style="margin-top:10px">${sets||`<div class="small dim">${t("No sets logged yet.","لا مجموعات مسجلة بعد.")}</div>`}
          <div class="ins" style="margin-top:8px"><input type="number" inputmode="decimal" step="0.5" placeholder="${t("kg","كجم")}" id="w-${id}"/><input type="number" inputmode="numeric" placeholder="${t("reps","تكرار")}" id="r-${id}"/><button class="btn sm primary" data-action="addSet" data-id="${id}">${t("Add","أضف")}</button></div></div></div>`:""}</div>`;
    }).join("");
    const stepPct = Math.round(d.steps/state.settings.stepGoal*100);
    $("p-train").innerHTML = `${phase}<div class="daysel">${chips}</div>
      <div class="card"><div class="row between"><h3>${P(DOW[selDay])}: ${P(prog.title)}</h3>${selDay===today?`<span class="pill teal">${t("Today","اليوم")}</span>`:""}</div>
        <div class="small muted" style="margin:4px 0 10px">${P(prog.blurb)} ${t("About","نحو")} ${prog.dur}.</div>
        ${selDay===today?`<button class="btn ${d.workout.done?"primary":""} block" data-action="toggleWorkout">${d.workout.done?t("Session complete - well done","انتهت الحصة - أحسنت"):t("Mark session done","اعتمد إنهاء الحصة")}</button>`:`<div class="small dim">${t("Viewing another day. Switch to today to mark it done.","تعرض يومًا آخر. انتقل لليوم لاعتماده.")}</div>`}</div>
      ${cards}
      <div class="card"><div class="row between"><h3>${t("Steps today","خطوات اليوم")}</h3><div class="small muted">${t("target 8,000-10,000","الهدف 8,000-10,000")}</div></div>
        <div style="font-size:28px;font-weight:800;margin:6px 0">${d.steps.toLocaleString()}</div>${meter(stepPct,"steps")}
        <div class="row" style="margin-top:12px;gap:8px"><button class="btn" data-action="steps" data-n="-500">-500</button><button class="btn grow" data-action="steps" data-n="1000">+1,000</button><button class="btn" data-action="steps" data-n="500">+500</button></div></div>`;
  }

  function renderFuel(){
    const k=todayKey(), d=day(k), tg=targets(), wd=weekdayOf(k), wpct=Math.round(d.water/state.settings.waterGoal*100), isOff=wd===5||wd===6;
    const mealRows=[ ["07:10",["Breakfast","الفطور"],["Omelette or overnight oats","أومليت أو شوفان منقوع"]],
      ["10:30",["Snack","وجبة خفيفة"],["Yogurt or nuts at the office","زبادي أو مكسرات في العمل"]],
      ["12:30",["Lunch","الغداء"],["Plate rule: grilled protein, half salad, small rice","قاعدة الطبق: بروتين مشوي ونصف سلطة وأرز قليل"]],
      ["16:00",["Snack","وجبة خفيفة"],["Fruit or boiled eggs","فاكهة أو بيض مسلوق"]],
      [isOff?"19:30":"20:00",["Dinner","العشاء"],["After training: stir-fry, fish or lentil soup","بعد التمرين: سوتيه أو سمك أو شوربة عدس"]]
    ].map(r=>`<div class="srow"><div class="t">${r[0]}</div><div class="w grow"><b style="color:var(--text)">${P(r[1])}</b> - ${P(r[2])}</div></div>`).join("");
    const recipes=RECIPES.map((r,idx)=>`<div class="acc" id="acc${idx}"><button data-action="acc" data-i="${idx}"><span><div style="font-weight:800">${P(r.name)}</div><div class="small muted">${P(r.tag)} - ${P(r.time)}</div></span><span class="chev">v</span></button>
      <div class="body"><div class="inner"><h4>${t("Ingredients","المكونات")}</h4><ul>${P(r.ing).map(x=>`<li>${esc(x)}</li>`).join("")}</ul><h4>${t("Steps","الطريقة")}</h4><ul>${P(r.steps).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div></div></div>`).join("");
    $("p-fuel").innerHTML =
      `<div class="card"><h3>${t("Your daily targets","أهدافك اليومية")}</h3><div class="small muted" style="margin-bottom:10px">${t("Calculated for you at","محسوبة لك عند")} ${latestKg().toFixed(0)} ${t("kg - they update as your weight drops.","كجم - تتحدث مع نزول وزنك.")}</div>
        <div class="grid4"><div class="stat center"><div class="n">${tg.kcal}</div><div class="l">${t("kcal","سعرة")}</div></div><div class="stat center"><div class="n" style="color:var(--teal)">${tg.protein}</div><div class="l">${t("protein g","بروتين جم")}</div></div><div class="stat center"><div class="n">${tg.carbs}</div><div class="l">${t("carbs g","كارب جم")}</div></div><div class="stat center"><div class="n">${tg.fat}</div><div class="l">${t("fat g","دهون جم")}</div></div></div>
        <div class="small muted" style="margin-top:10px">${t("Maintenance is about","الحفاظ نحو")} ${tg.tdee} ${t("kcal; we hold a gentle deficit. Protein stays high to protect muscle while the fat goes.","سعرة؛ نُبقي عجزًا لطيفًا. البروتين مرتفع لحماية العضل أثناء فقد الدهون.")}</div></div>
      <div class="card"><h3>${t("Meal schedule","جدول الوجبات")}${isOff?t(" - day off"," - يوم إجازة"):t(" - workday"," - يوم عمل")}</h3><div class="small muted" style="margin-bottom:8px">${t("Timed around your day, training and class.","موقوتة حول يومك وتمرينك وحصتك.")}</div><div class="sched">${mealRows}</div></div>
      <div class="card center"><h3>${t("The plate rule","قاعدة الطبق")}</h3><div class="plate"></div>
        <div class="legend center" style="margin-top:8px"><span><i class="dot" style="background:var(--emerald)"></i>${t("Half vegetables / salad","نصف خضار / سلطة")}</span><span><i class="dot" style="background:var(--deep)"></i>${t("Palm-sized protein","بروتين بحجم الكف")}</span><span><i class="dot" style="background:var(--amber)"></i>${t("Smaller rice / roti","أرز / خبز أقل")}</span></div>
        <div class="small muted" style="margin-top:8px">${t("Protein at every meal. Water all day. Never skip meals.","بروتين في كل وجبة. ماء طوال اليوم. لا تفوّت الوجبات.")}</div></div>
      <div class="card"><div class="row between"><h3>${t("Water today","ماء اليوم")}</h3><div class="small muted">${d.water} / ${state.settings.waterGoal} ${t("glasses","أكواب")}</div></div>
        <div style="margin:8px 0">${meter(wpct,"water")}</div>
        <div class="row" style="gap:8px"><button class="btn" data-action="water" data-n="-1">-1</button><button class="btn primary grow" data-action="water" data-n="1">+1 ${t("glass","كوب")}</button></div></div>
      <h2 class="section">${t("Recipes","الوصفات")}</h2>${recipes}
      <div class="card"><h3>${t("Eating out in Saudi","الأكل خارجًا في السعودية")}</h3><ul style="margin:8px 0 0;padding-inline-start:18px">${EATOUT.map(x=>`<li class="muted small" style="margin:5px 0">${P(x)}</li>`).join("")}</ul></div>
      <div class="note"><div class="micro">${t("Kind nudges","تنبيهات لطيفة")}</div><div class="small" style="margin-top:4px">${t("Sugary karak, fried snacks and late noodles are the main blockers - swap them for fruit, nuts or yogurt. No caffeine after 6 pm.","الكرك المحلى والمقالي والنودلز المتأخرة أكبر العوائق - استبدلها بفاكهة أو مكسرات أو زبادي. لا كافيين بعد السادسة.")}</div></div>`;
  }

  function renderStudy(){
    const d=day(), dte=daysToExam();
    const comps=Object.keys(COMPS).map(g=>{ const items=COMPS[g].map(name=>{ const on=!!state.study.comps[name];
        return `<button class="check ${on?"done":""}" data-action="toggleComp" data-id="${esc(name)}" style="min-height:52px"><span class="box">${on?TICK:""}</span><span class="grow"><div class="label" style="font-size:14px">${esc(name)}</div></span></button>`;
      }).join(""); return `<h4 style="color:var(--teal);text-transform:uppercase;letter-spacing:.08em;font-size:12px;margin:8px 2px">${P(COMP_GROUP[g])}</h4>${items}`; }).join("");
    const tl=MILESTONES.map(m=>{ const on=!!state.study.milestones[m.id];
      return `<div class="node ${on?"done":""}"><button class="row between" data-action="toggleMs" data-id="${m.id}" style="width:100%;background:none;border:none;text-align:start;padding:0">
        <span><span class="pill ${on?"teal":"dim"}">${P(m.when)}</span><div style="font-weight:800;margin-top:4px">${P(m.t)}</div><div class="small muted">${P(m.d)}</div></span>
        <span style="width:24px;height:24px;border-radius:7px;border:2px solid ${on?"var(--teal)":"var(--line)"};background:${on?"var(--teal)":"transparent"};display:grid;place-items:center;flex:none">${on?TICK:""}</span></button></div>`;
    }).join("");
    $("p-study").innerHTML =
      `<div class="card"><div class="row between"><h3>${t("RICS APC","امتحان RICS APC")}</h3>${dte!=null&&dte>0?`<span class="pill violet">${dte} ${t("days to your window","يوم حتى موعدك")}</span>`:""}</div>
        <div class="small muted" style="margin-top:4px">${t("Study by doing: speak your answers out loud and write examples as situation, task, action, result. Rereading notes is the illusion of progress.","ادرس بالتطبيق: انطق إجاباتك بصوت عالٍ واكتب أمثلة كـ موقف ومهمة وإجراء ونتيجة. إعادة قراءة الملاحظات وهمُ تقدّم.")}</div></div>
      <div class="card center"><div class="micro" id="timerMode">${t("Focus","تركيز")}</div><div class="timer" id="timerDisp">25:00</div>
        <div class="row" style="gap:8px;justify-content:center;margin-top:6px"><button class="btn primary" data-action="timerStart" id="timerBtn">${t("Start","ابدأ")}</button><button class="btn" data-action="timerReset">${t("Reset","تصفير")}</button></div>
        <div class="small muted" style="margin-top:10px">${t("Focus blocks today","فترات التركيز اليوم")}: <b id="focusCount">${d.focus}</b> <span class="dim">- ${t("streak","سلسلة")} ${studyStreak()} ${t("days","يوم")}</span></div></div>
      <div class="card"><label class="field"><span class="micro">${t("The one task I will start with next","المهمة الأولى للجلسة القادمة")}</span><input type="text" data-bind="nextTask" value="${esc(state.study.nextTask)}" placeholder="${t("e.g. Case study - project background","مثال: دراسة الحالة - خلفية المشروع")}"/></label></div>
      <h2 class="section">${t("Milestones","المحطات")}</h2><div class="card"><div class="tl">${tl}</div></div>
      <h2 class="section">${t("Competencies","الكفاءات")}</h2><div class="card">${comps}</div>`;
    syncTimer();
  }

  function renderProgress(){
    const w=state.weights.slice().sort((a,b)=>a.date<b.date?-1:1);
    const cur=latestKg(), start=state.profile.startKg, goal=state.profile.goalKg, lost=start-cur;
    const weeks=w.length>1?Math.max(1,(new Date(w[w.length-1].date)-new Date(w[0].date))/604800000):1;
    const perWk=w.length>1?(w[w.length-1].kg-w[0].kg)/weeks:0, pr=projection();
    const bmi=cur/Math.pow(state.profile.heightCm/100,2), goalBmi=goal/Math.pow(state.profile.heightCm/100,2);
    const lastWaist=state.waist.length?state.waist[state.waist.length-1]:null;
    let good=0,sessions=0,steps=0,blocks=0,stepDays=0;
    for (let i=6;i>=0;i--){ const kk=addDaysKey(todayKey(),-i), dd=state.days[kk]; if (dd){ if (isGood(kk)) good++; if (dd.workout&&dd.workout.done) sessions++; if (dd.steps>0){steps+=dd.steps;stepDays++;} blocks+=dd.focus||0; } }
    const avgSteps=stepDays?Math.round(steps/stepDays):0;
    const review = good>=4
      ? t(`Last 7 days: ${good} good days, ${sessions} sessions, ${blocks} focus blocks. A winning week - same again.`,`آخر 7 أيام: ${good} أيام جيدة و${sessions} حصص و${blocks} فترات تركيز. أسبوع رابح - كرره.`)
      : t(`Last 7 days: ${good} good days, ${sessions} sessions, ${blocks} focus blocks. A fresh week starts the moment you tick one box.`,`آخر 7 أيام: ${good} أيام جيدة و${sessions} حصص و${blocks} فترات تركيز. يبدأ أسبوع جديد لحظة تعليم خانة واحدة.`);
    $("p-progress").innerHTML =
      `<div class="card"><div class="grid2">
        <div class="stat"><div class="n">${cur.toFixed(1)}<span class="small"> ${t("kg","كجم")}</span></div><div class="l">${t("Current","الحالي")}</div></div>
        <div class="stat"><div class="n" style="color:var(--emerald)">${lost>=0?"-":"+"}${Math.abs(lost).toFixed(1)}<span class="small"> ${t("kg","كجم")}</span></div><div class="l">${t("Since start","منذ البداية")} (${start})</div></div>
        <div class="stat"><div class="n">${perWk<=0?"":"+"}${perWk.toFixed(2)}<span class="small"> ${t("kg","كجم")}</span></div><div class="l">${t("Per week","أسبوعيًا")}</div></div>
        <div class="stat"><div class="n">${Math.max(0,cur-goal).toFixed(1)}<span class="small"> ${t("kg","كجم")}</span></div><div class="l">${t("To goal","حتى الهدف")} (${goal})</div></div></div>
        <div class="small muted" style="margin-top:10px">${t("BMI","مؤشر الكتلة")} ${bmi.toFixed(1)} ${t("now","الآن")}, ${goalBmi.toFixed(1)} ${t("at goal","عند الهدف")}. ${pr.reached?t("Goal reached.","تحقق الهدف."):t(`On the safe pace, around ${prettyMonth(pr.date)}.`,`بالوتيرة الآمنة، قرابة ${prettyMonth(pr.date)}.`)}</div></div>
      <div class="card"><div class="row between"><h3>${t("Weight trend","مسار الوزن")}</h3><span class="pill teal">${t("goal","الهدف")} ${goal} ${t("kg","كجم")}</span></div>${chart(w,goal)}
        <div class="row" style="gap:8px;margin-top:12px"><input type="number" id="wkg" inputmode="decimal" step="0.1" placeholder="${t("Today's weight (kg)","وزن اليوم (كجم)")}"/><button class="btn primary" data-action="addWeight">${t("Log","سجّل")}</button></div>
        <div class="small muted" style="margin-top:8px">${t("Weigh in the morning, before food. Judge the week, not the day.","قِس صباحًا قبل الطعام. احكم على الأسبوع لا اليوم.")}</div></div>
      <div class="card"><div class="row between"><h3>${t("Waist","الخصر")}</h3>${lastWaist?`<span class="pill dim">${lastWaist.cm} ${t("cm","سم")} - ${prettyDate(lastWaist.date)}</span>`:""}</div>
        <div class="small muted" style="margin:4px 0 10px">${t("Measure at the navel every Friday. When the scale stalls, the tape often still moves.","قِس عند السرّة كل جمعة. عند توقف الميزان غالبًا ما يستمر الشريط.")}</div>
        <div class="row" style="gap:8px"><input type="number" id="wcm" inputmode="decimal" step="0.5" placeholder="${t("Waist (cm)","الخصر (سم)")}"/><button class="btn" data-action="addWaist">${t("Log","سجّل")}</button></div></div>
      <div class="card"><h3>${t("Weekly review","المراجعة الأسبوعية")}</h3><div class="small muted" style="margin-top:6px">${review}${avgSteps?` ${t("About","نحو")} ${avgSteps.toLocaleString()} ${t("steps a day.","خطوة يوميًا.")}`:""}</div>
        <div class="grid2" style="margin-top:10px"><div class="stat"><div class="n" style="color:var(--teal)">${habitStreak()}</div><div class="l">${t("Habit streak","سلسلة العادات")}</div></div><div class="stat"><div class="n" style="color:var(--violet)">${studyStreak()}</div><div class="l">${t("Study streak","سلسلة الدراسة")}</div></div></div></div>
      <div class="card"><h3>${t("Your details","بياناتك")}</h3><div class="small muted" style="margin-bottom:10px">${t("Everything recalculates from these.","كل شيء يُحسب من هذه.")}</div>
        <div class="grid2">
          <label class="field"><span class="micro">${t("Start weight (kg)","وزن البداية (كجم)")}</span><input type="number" step="0.5" data-bind="startKg" value="${start}"/></label>
          <label class="field"><span class="micro">${t("Goal weight (kg)","الوزن الهدف (كجم)")}</span><input type="number" step="0.5" data-bind="goalKg" value="${goal}"/></label>
          <label class="field"><span class="micro">${t("Height (cm)","الطول (سم)")}</span><input type="number" data-bind="heightCm" value="${state.profile.heightCm}"/></label>
          <label class="field"><span class="micro">${t("Age","العمر")}</span><input type="number" data-bind="age" value="${state.profile.age}"/></label>
          <label class="field" style="grid-column:1/-1"><span class="micro">${t("APC date","تاريخ الامتحان")}</span><input type="date" data-bind="examDate" value="${state.profile.examDate}"/></label></div></div>
      <div class="card"><h3>${t("Your data","بياناتك")}</h3><div class="small muted" style="margin:4px 0 10px">${t("Everything lives on this device. Install the app for full-screen offline use, and export a backup any time.","كل شيء على هذا الجهاز. ثبّت التطبيق للاستخدام الكامل دون إنترنت، وصدّر نسخة احتياطية متى شئت.")}</div>
        <div class="row" style="gap:8px"><button class="btn grow" data-action="export">${t("Export backup","تصدير نسخة")}</button><button class="btn grow" id="installBtn" data-action="install" style="display:none">${t("Install app","تثبيت التطبيق")}</button></div></div>
      <div class="note"><div class="micro">${t("Look after yourself","اعتنِ بنفسك")}</div><div class="small" style="margin-top:4px">${t("Stalls for a week or two are normal - trust the habits. If you feel faint or unwell, see a doctor and get your bloods checked.","التوقف أسبوعًا أو اثنين طبيعي - ثق بالعادات. إن شعرت بدوار أو توعك فراجع طبيبًا وافحص دمك.")}</div></div>`;
    if (deferredPrompt){ const b=$("installBtn"); if (b) b.style.display=""; }
  }

  function chart(w, goal){ const W=480,H=180,pad=24;
    if (w.length<2) return `<div class="center muted small" style="padding:40px 10px">${t("Log your weight on two or more days and your trend line will draw itself here.","سجّل وزنك في يومين أو أكثر ليُرسم خط مسارك هنا.")}</div>`;
    const kgs=w.map(p=>p.kg).concat([goal]); const min=Math.min(...kgs)-1,max=Math.max(...kgs)+1,span=Math.max(1,max-min),n=w.length;
    const x=i=>pad+i/(n-1)*(W-2*pad), y=v=>pad+(1-(v-min)/span)*(H-2*pad);
    const pts=w.map((p,i)=>`${i?"L":"M"}${x(i).toFixed(1)} ${y(p.kg).toFixed(1)}`).join(" ");
    let len=0; for (let i=1;i<n;i++) len+=Math.hypot(x(i)-x(i-1),y(w[i].kg)-y(w[i-1].kg));
    const gy=y(goal).toFixed(1), dots=w.map((p,i)=>`<circle cx="${x(i).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="3" fill="var(--teal)"/>`).join("");
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#2dd4bf"/></linearGradient></defs>
      <line x1="${pad}" y1="${gy}" x2="${W-pad}" y2="${gy}" stroke="var(--emerald)" stroke-width="1.5" stroke-dasharray="3 6"/><path class="line" d="${pts}" style="--len:${len.toFixed(0)}"/>${dots}
      <text x="${pad}" y="14" fill="var(--dim)" font-size="11">${max.toFixed(0)}</text><text x="${pad}" y="${H-6}" fill="var(--dim)" font-size="11">${min.toFixed(0)}</text></svg>`;
  }

  // ===================== timer =====================
  const timer={ mode:"focus", remaining:1500, running:false, h:null };
  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  function syncTimer(){ const disp=$("timerDisp"); if (!disp) return;
    disp.textContent=fmt(timer.remaining); disp.classList.toggle("break",timer.mode==="break");
    const m=$("timerMode"); if (m) m.textContent=timer.mode==="break"?t("Short break","استراحة قصيرة"):t("Focus","تركيز");
    const b=$("timerBtn"); if (b) b.textContent=timer.running?t("Pause","إيقاف مؤقت"):(timer.remaining<(timer.mode==="break"?300:1500)?t("Resume","استئناف"):t("Start","ابدأ"));
    const fc=$("focusCount"); if (fc) fc.textContent=day().focus;
  }
  function tickTimer(){ if (!timer.running) return; timer.remaining--;
    if (timer.remaining<=0){ if (timer.mode==="focus"){ day().focus++; save(); vibrate(150); timer.mode="break"; timer.remaining=300; } else { timer.mode="focus"; timer.remaining=1500; } timer.running=false; clearInterval(timer.h); timer.h=null; }
    syncTimer();
  }
  function startTimer(){ if (timer.running){ timer.running=false; clearInterval(timer.h); timer.h=null; syncTimer(); return; } timer.running=true; timer.h=setInterval(tickTimer,1000); syncTimer(); }
  function resetTimer(){ timer.running=false; clearInterval(timer.h); timer.h=null; timer.mode="focus"; timer.remaining=1500; syncTimer(); }

  // ===================== rest timer + wake lock =====================
  let rest={ left:0, h:null }, wakeLock=null;
  const vibrate=ms=>{ try{ navigator.vibrate&&navigator.vibrate(ms); }catch(e){} };
  async function lockScreen(){ try{ if (navigator.wakeLock) wakeLock=await navigator.wakeLock.request("screen"); }catch(e){} }
  function unlockScreen(){ try{ wakeLock&&wakeLock.release(); }catch(e){} wakeLock=null; }
  function openRest(sec){ rest.left=sec; $("restTime").textContent=rest.left; $("restSheet").classList.add("open"); vibrate(40); lockScreen();
    clearInterval(rest.h); rest.h=setInterval(()=>{ rest.left--; $("restTime").textContent=Math.max(0,rest.left); if (rest.left<=0){ closeRest(); vibrate(250); } },1000);
  }
  function closeRest(){ clearInterval(rest.h); rest.h=null; $("restSheet").classList.remove("open"); unlockScreen(); }

  // ===================== routing =====================
  const R={ home:renderHome, train:renderTrain, fuel:renderFuel, study:renderStudy, progress:renderProgress };
  let current="home";
  function show(tab){ current=tab;
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active")); $("p-"+tab).classList.add("active");
    document.querySelectorAll(".nav .tab").forEach(t2=>t2.classList.toggle("active",t2.dataset.tab===tab));
    R[tab](); window.scrollTo({ top:0, behavior:"smooth" });
  }

  $("nav").addEventListener("click", e=>{ const t2=e.target.closest(".tab"); if (t2) show(t2.dataset.tab); });
  document.addEventListener("click", e=>{
    const b=e.target.closest("[data-action]"); if (!b) return;
    const a=b.dataset.action, k=todayKey(), d=day(k);
    if (a==="lang"){ L = L==="ar"?"en":"ar"; state.settings.lang=L; save(); applyDir(); boot(false); show(current); }
    else if (a==="toggleCheck"){ d.check[b.dataset.id]=!d.check[b.dataset.id]; vibrate(15); save(); renderHome(); }
    else if (a==="go"){ show(b.dataset.tab); }
    else if (a==="selDay"){ selDay=+b.dataset.i; renderTrain(); }
    else if (a==="toggleWorkout"){ d.workout.done=!d.workout.done; if (d.workout.done) d.check.move=true; vibrate(25); save(); renderTrain(); }
    else if (a==="exDone"){ d.exDone[b.dataset.id]=!d.exDone[b.dataset.id]; vibrate(15); save(); renderTrain(); }
    else if (a==="how"){ const h=$("how-"+b.dataset.id); if (h) h.classList.toggle("open"); }
    else if (a==="logToggle"){ const h=$("log-"+b.dataset.id); if (h) h.classList.toggle("open"); }
    else if (a==="addSet"){ const id=b.dataset.id, w=parseFloat(($("w-"+id)||{}).value), r=parseInt(($("r-"+id)||{}).value,10);
      if (isFinite(w)&&isFinite(r)&&r>0){ (d.sets[id]=d.sets[id]||[]).push({ w:Math.round(w*2)/2, r }); vibrate(20); save(); renderTrain(); const h=$("log-"+id); if (h) h.classList.add("open"); } }
    else if (a==="delSet"){ const id=b.dataset.id, i=+b.dataset.i; (d.sets[id]||[]).splice(i,1); save(); renderTrain(); const h=$("log-"+id); if (h) h.classList.add("open"); }
    else if (a==="rest"){ openRest(+b.dataset.n||90); }
    else if (a==="restAdd"){ rest.left+=30; $("restTime").textContent=rest.left; }
    else if (a==="restEnd"){ closeRest(); }
    else if (a==="steps"){ d.steps=Math.max(0,d.steps+(+b.dataset.n)); save(); renderTrain(); }
    else if (a==="water"){ d.water=Math.max(0,d.water+(+b.dataset.n)); if (d.water>=state.settings.waterGoal) d.check.water=true; vibrate(15); save(); renderFuel(); }
    else if (a==="acc"){ const ac=$("acc"+b.dataset.i); if (ac) ac.classList.toggle("open"); }
    else if (a==="toggleComp"){ state.study.comps[b.dataset.id]=!state.study.comps[b.dataset.id]; save(); renderStudy(); }
    else if (a==="toggleMs"){ state.study.milestones[b.dataset.id]=!state.study.milestones[b.dataset.id]; save(); renderStudy(); }
    else if (a==="timerStart"){ startTimer(); } else if (a==="timerReset"){ resetTimer(); }
    else if (a==="addWeight"){ const v=parseFloat((($("wkg")||{}).value||"").replace(",",".")); if (isFinite(v)&&v>30&&v<400){ state.weights=state.weights.filter(p=>p.date!==k); state.weights.push({date:k,kg:Math.round(v*10)/10}); state.weights.sort((x,y)=>x.date<y.date?-1:1); save(); renderProgress(); } }
    else if (a==="addWaist"){ const v=parseFloat((($("wcm")||{}).value||"").replace(",",".")); if (isFinite(v)&&v>40&&v<250){ state.waist=state.waist.filter(p=>p.date!==k); state.waist.push({date:k,cm:Math.round(v*2)/2}); state.waist.sort((x,y)=>x.date<y.date?-1:1); save(); renderProgress(); } }
    else if (a==="export"){ const blob=new Blob([JSON.stringify({app:"Apex",exportedAt:new Date().toISOString(),state},null,2)],{type:"application/json"}); const a2=document.createElement("a"); a2.href=URL.createObjectURL(blob); a2.download="apex-backup.json"; a2.click(); setTimeout(()=>URL.revokeObjectURL(a2.href),5000); }
    else if (a==="install"){ if (deferredPrompt){ deferredPrompt.prompt(); deferredPrompt=null; const btn=$("installBtn"); if (btn) btn.style.display="none"; } }
  });
  document.addEventListener("change", e=>{
    const b=e.target.closest("[data-bind]"); if (!b) return; const bind=b.dataset.bind;
    if (bind==="nextTask"){ state.study.nextTask=b.value; save(); return; }
    if (bind==="examDate"){ if (b.value){ state.profile.examDate=b.value; save(); renderStudy(); } return; }
    if (bind==="city"){ state.settings.city=b.value; save(); renderHome(); return; }
    if (["startKg","goalKg","heightCm","age"].includes(bind)){ const v=parseFloat(b.value); if (isFinite(v)&&v>0){ state.profile[bind]=v; save(); renderProgress(); } }
  });
  document.addEventListener("input", e=>{ const b=e.target.closest('[data-bind="nextTask"]'); if (b){ state.study.nextTask=b.value; save(); } });

  // ===================== PWA =====================
  let deferredPrompt=null;
  window.addEventListener("beforeinstallprompt", e=>{ e.preventDefault(); deferredPrompt=e; const b=$("installBtn"); if (b) b.style.display=""; });
  if ("serviceWorker" in navigator){ try{ navigator.serviceWorker.register("sw.js"); }catch(e){} }

  // ===================== boot =====================
  function boot(initial){
    applyDir();
    const h=new Date().getHours();
    $("heroTitle").textContent = h<12?t("Good morning","صباح الخير"):h<17?t("Good afternoon","مساء الخير"):t("Good evening","مساء الخير");
    const lost=state.profile.startKg-latestKg();
    $("heroSub").textContent = t(`98 kg to 78 kg, the APC in November, and a calmer, stronger you. ${lost>0?`Already ${lost.toFixed(1)} kg down.`:"Day one starts now."}`,
      `من 98 إلى 78 كجم، والامتحان في نوفمبر، ونسخة أهدأ وأقوى منك. ${lost>0?`نزلت ${lost.toFixed(1)} كجم.`:"اليوم الأول يبدأ الآن."}`);
    $("heroQuote").textContent = quoteToday();
    $("restLabel").textContent = t("Rest - breathe, then go again","راحة - تنفس ثم عُد");
    $("restDone").textContent = t("Done - next set","تم - المجموعة التالية");
    if (initial!==false) show("home");
  }
  boot(true);
})();
