import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://xozfbhmilefynqipdpvo.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_O_1pQ-PuFP6i4VJMa3YVeA_Mepk8KRI';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const modal = document.getElementById('modal');
const title = document.getElementById('modalTitle');
const hint = document.getElementById('authHint');
const form = document.getElementById('authForm');
const nameWrap = document.getElementById('displayNameWrap');
const nameInput = document.getElementById('displayNameInput');
const emailInput = document.getElementById('emailInput');
const emailWrap = document.getElementById('emailWrap');
const passwordWrap = document.getElementById('passwordWrap');
const passwordInput = document.getElementById('passwordInput');
const submitButton = document.getElementById('authSubmit');
const googleButton = document.getElementById('googleBtn');
const forgotButton = document.getElementById('forgotPasswordBtn');
const switchButton = document.getElementById('modeSwitch');
const message = document.getElementById('authMessage');
const accountPanel = document.getElementById('accountPanel');
const accountEmail = document.getElementById('accountEmail');
let mode = 'signup';

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('error', isError);
}

function setBusy(busy) {
  submitButton.disabled = busy;
  googleButton.disabled = busy;
  submitButton.textContent = busy ? 'يرجى الانتظار…' :
    mode === 'login' ? 'تسجيل الدخول' :
    mode === 'reset' ? 'إرسال رابط الاستعادة' :
    mode === 'updatePassword' ? 'حفظ كلمة المرور الجديدة' : 'إنشاء الحساب';
}

function setMode(nextMode) {
  mode = nextMode;
  accountPanel.hidden = nextMode !== 'account';
  form.hidden = nextMode === 'account';
  googleButton.hidden = ['reset', 'updatePassword', 'account'].includes(nextMode);
  forgotButton.hidden = nextMode !== 'login';
  switchButton.hidden = ['reset', 'updatePassword', 'account'].includes(nextMode);
  nameWrap.hidden = nextMode !== 'signup';
  emailWrap.hidden = nextMode === 'updatePassword';
  passwordWrap.hidden = nextMode === 'reset';
  emailInput.required = nextMode !== 'updatePassword';
  passwordInput.required = nextMode !== 'reset';
  passwordInput.autocomplete = ['signup', 'updatePassword'].includes(nextMode) ? 'new-password' : 'current-password';

  title.textContent = nextMode === 'login' ? 'سجّل الدخول إلى حسابك' :
    nextMode === 'reset' ? 'استعادة كلمة المرور' :
    nextMode === 'updatePassword' ? 'اختر كلمة مرور جديدة' :
    nextMode === 'account' ? 'حسابك في LEXORA' : 'أنشئ حسابك وابدأ التعلم';

  hint.textContent = nextMode === 'login' ? 'أدخل بياناتك للعودة إلى رحلتك التعليمية.' :
    nextMode === 'reset' ? 'سنرسل إلى بريدك رابطاً آمناً لإعادة تعيين كلمة المرور.' :
    nextMode === 'updatePassword' ? 'أدخل كلمة مرور جديدة لا تقل عن 8 أحرف.' :
    nextMode === 'account' ? 'أنت مسجل الدخول بهذا الحساب.' :
    'أنشئ حساباً مجانياً لحفظ تقدمك وكلماتك.';

  switchButton.textContent = nextMode === 'login' ? 'ليس لديك حساب؟ أنشئ حساباً' : 'لديك حساب؟ سجّل الدخول';
  showMessage('');
  setBusy(false);
}

function openModal(nextMode = 'signup') {
  setMode(nextMode);
  modal.classList.add('show');
  if (nextMode !== 'account') emailInput.focus();
}

function closeModal() {
  modal.classList.remove('show');
  showMessage('');
}

function updateAuthUI(user) {
  const signedIn = Boolean(user);
  document.getElementById('loginBtn').hidden = signedIn;
  document.getElementById('signupBtn').hidden = signedIn;
  document.getElementById('accountBtn').hidden = !signedIn;
  const isAdmin = user?.app_metadata?.role === 'admin';
  document.getElementById('adminOpenBtn').hidden = !isAdmin;
  if (!isAdmin && document.getElementById('lexoraAdmin')) document.getElementById('lexoraAdmin').hidden = true;
  document.getElementById('logoutBtn').hidden = !signedIn;
  if (user) accountEmail.textContent = user.email || 'حساب LEXORA';
  if (!signedIn && document.getElementById('learnerProfile')) {
    document.getElementById('learnerProfile').hidden = true;
    document.querySelector('main').hidden = false;
  }
}

document.querySelectorAll('[data-modal]').forEach(button => {
  button.addEventListener('click', () => openModal(button.dataset.modal));
});

document.getElementById('closeModal').addEventListener('click', closeModal);
modal.addEventListener('click', event => {
  if (event.target === modal) closeModal();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModal();
});

switchButton.addEventListener('click', () => setMode(mode === 'login' ? 'signup' : 'login'));
forgotButton.addEventListener('click', () => setMode('reset'));

form.addEventListener('submit', async event => {
  event.preventDefault();
  showMessage('');
  setBusy(true);
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  try {
    if (mode === 'signup') {
      const displayName = nameInput.value.trim();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://lexora-platform.pages.dev',
          data: { display_name: displayName || null }
        }
      });
      if (error) throw error;
      if (data.session) {
        closeModal();
      } else {
        showMessage('تم إرسال طلب التسجيل. افحص بريدك واضغط رابط التأكيد لتفعيل الحساب.');
      }
    } else if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      closeModal();
    } else if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://lexora-platform.pages.dev'
      });
      if (error) throw error;
      showMessage('إذا كان البريد مسجلاً، ستصلك رسالة تحتوي على رابط استعادة كلمة المرور.');
    } else if (mode === 'updatePassword') {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      closeModal();
      alert('تم تحديث كلمة المرور بنجاح.');
    }
  } catch (error) {
    const safeMessages = {
      'Invalid login credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      'Email not confirmed': 'يرجى تأكيد بريدك الإلكتروني أولاً من الرسالة التي وصلتك.',
      'User already registered': 'هذا البريد مسجل مسبقاً. سجّل الدخول بدلاً من إنشاء حساب جديد.',
      'Password should be at least 6 characters': 'كلمة المرور قصيرة جداً.'
    };
    showMessage(safeMessages[error.message] || error.message || 'تعذر إكمال العملية. حاول مرة أخرى.', true);
  } finally {
    setBusy(false);
  }
});

googleButton.addEventListener('click', async () => {
  showMessage('');
  googleButton.disabled = true;
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://lexora-platform.pages.dev' }
    });
    if (error) throw error;
  } catch (error) {
    showMessage('تسجيل Google يحتاج إلى تفعيل مزوّد Google وإضافة مفاتيحه في إعدادات Supabase.', true);
    googleButton.disabled = false;
  }
});

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    showMessage('تعذر تسجيل الخروج. حاول مرة أخرى.', true);
    return;
  }
  closeModal();
}

document.getElementById('logoutBtn').addEventListener('click', signOut);
document.getElementById('accountLogoutBtn').addEventListener('click', signOut);
document.getElementById('accountBtn').addEventListener('click', openLearnerProfile);

supabase.auth.onAuthStateChange((event, session) => {
  updateAuthUI(session?.user ?? null);
  if (session?.user) { loadLearnerProfile(session.user); if (session.user.app_metadata?.role === 'admin') loadAdminContent(); }
  if (event === 'PASSWORD_RECOVERY') openModal('updatePassword');
});

supabase.auth.getSession().then(({ data, error }) => {
  if (!error) {
    updateAuthUI(data.session?.user ?? null);
    if (data.session?.user) { loadLearnerProfile(data.session.user); if (data.session.user.app_metadata?.role === 'admin') loadAdminContent(); }
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get('type') === 'signup' && data.session) {
      openModal('account');
      showMessage('تم تأكيد بريدك الإلكتروني وتفعيل حسابك بنجاح.');
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
    if (params.get('error')) {
      openModal('login');
      showMessage('تعذر تأكيد البريد: ' + (params.get('error_description') || params.get('error')), true);
    }
  }
});

document.getElementById('playBtn').addEventListener('click', () => {
  openModal('signup');
  showMessage('الفيديو التعريفي الأصلي سيُضاف عند تجهيز المحتوى المرئي.');
});

document.getElementById('langBtn').addEventListener('click', () => {
  const english = document.documentElement.lang === 'ar';
  document.documentElement.lang = english ? 'en' : 'ar';
  document.documentElement.dir = english ? 'ltr' : 'rtl';
  document.getElementById('langBtn').textContent = english ? 'AR' : 'EN';
  document.querySelector('.hero-copy h1').innerHTML = english
    ? 'Don’t just memorize words,<br><em>live the language.</em>'
    : 'لا تحفظ الكلمات فقط،<br><em>عِش اللغة.</em>';
  document.querySelector('.hero-copy>p').textContent = english
    ? 'Your English journey starts from zero, with realistic scenes and interactive practice to build confidence.'
    : 'رحلتك لتعلّم الإنجليزية تبدأ من الصفر، عبر مشاهد واقعية وتمارين تفاعلية تساعدك على الفهم والاستماع والتحدث بثقة.';
});

document.getElementById('menuBtn').addEventListener('click', () => {
  document.querySelector('.topbar nav').classList.toggle('menu-panel');
});


// LEXORA learner profile
const profileSection = document.getElementById('learnerProfile');
const profileForm = document.getElementById('profileForm');
let activeProfileUser = null;

const levelNames = {
  zero: ['من الصفر', 'ابدأ بالحروف والأصوات والنطق الأول.'],
  A1: ['A1 · مبتدئ', 'كوّن جملاً بسيطة واستخدم عبارات الحياة اليومية.'],
  A2: ['A2 · أساسي', 'طوّر محادثاتك في المواقف المألوفة.'],
  B1: ['B1 · متوسط', 'عبّر عن أفكارك وتجاربك بثقة أكبر.'],
  B2: ['B2 · فوق المتوسط', 'وسّع فهمك وطلاقتك في المحادثات.'],
  C1: ['C1 · متقدم', 'استخدم الإنجليزية بمرونة ودقة.']
};

function openLearnerProfile() {
  if (!activeProfileUser) {
    openModal('login');
    showMessage('سجّل الدخول لفتح ملفك التعليمي.');
    return;
  }
  profileSection.hidden = false;
  document.querySelector('main').hidden = true;
  profileSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  loadLearnerProfile(activeProfileUser);
}
document.getElementById('closeProfileBtn').addEventListener('click', () => {
  profileSection.hidden = true;
  document.querySelector('main').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
document.getElementById('continueLearning').addEventListener('click', () => {
  profileSection.hidden = true;
  document.querySelector('main').hidden = false;
});
function setProfileMessage(text, error = false) {
  const el = document.getElementById('profileMessage');
  el.textContent = text;
  el.classList.toggle('error', error);
}
function fillProfile(profile, user) {
  document.getElementById('profileName').textContent = profile.display_name || 'متعلم LEXORA';
  document.getElementById('profileHandle').textContent = profile.username ? '@' + profile.username : 'أكمل اسم المستخدم الخاص بك';
  document.getElementById('profileBioPreview').textContent = profile.bio || 'ابدأ رحلتك في تعلم الإنجليزية خطوة بخطوة.';
  document.getElementById('profileDisplayName').value = profile.display_name || user.user_metadata?.display_name || '';
  document.getElementById('profileUsername').value = profile.username || '';
  document.getElementById('profileBio').value = profile.bio || '';
  document.getElementById('profileLevel').value = profile.current_level || 'zero';
  document.getElementById('profileCountry').value = profile.country || '';
  document.getElementById('profileGoal').value = profile.learning_goal || 'daily';
  document.getElementById('profileDailyGoal').value = String(profile.daily_goal_minutes || 15);
  document.getElementById('profileEmail').value = user.email || '';
  document.querySelectorAll('input[name="interest"]').forEach(input => {
    input.checked = (profile.interests || []).includes(input.value);
  });
  const avatar = document.getElementById('profileAvatar');
  const fallback = document.getElementById('profileAvatarFallback');
  if (profile.avatar_url) {
    avatar.src = profile.avatar_url;
    avatar.hidden = false;
    fallback.hidden = true;
  } else {
    avatar.hidden = true;
    fallback.hidden = false;
  }
  const level = levelNames[profile.current_level || 'zero'] || levelNames.zero;
  document.getElementById('currentLevelCard').innerHTML = '<strong></strong><p></p>';
  document.querySelector('#currentLevelCard strong').textContent = level[0];
  document.querySelector('#currentLevelCard p').textContent = level[1];
}
async function loadLearnerProfile(user) {
  activeProfileUser = user;
  try {
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw error;
    let record = profile;
    if (!record) {
      const { data, error: insertError } = await supabase.from('profiles')
        .insert({ id: user.id, display_name: user.user_metadata?.display_name || '', preferred_locale: 'ar' })
        .select('*').single();
      if (insertError) throw insertError;
      record = data;
    }
    fillProfile(record, user);
    const [lessons, words, streak, scores, subscription] = await Promise.all([
      supabase.from('learning_progress').select('id,is_completed,best_score', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('vocabulary').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('learning_streaks').select('current_streak').eq('user_id', user.id).maybeSingle(),
      supabase.from('learning_progress').select('best_score').eq('user_id', user.id).not('best_score', 'is', null),
      supabase.from('subscriptions').select('status,ends_at').eq('user_id', user.id).eq('status', 'active').order('ends_at', { ascending: false }).limit(1).maybeSingle()
    ]);
    if (lessons.error) throw lessons.error;
    if (words.error) throw words.error;
    const completed = (lessons.data || []).filter(item => item.is_completed).length;
    const best = (scores.data || []).reduce((max, item) => Math.max(max, item.best_score || 0), 0);
    document.getElementById('statLessons').textContent = String(completed);
    document.getElementById('statWords').textContent = String(words.count || 0);
    document.getElementById('statStreak').textContent = String(streak.data?.current_streak || 0);
    document.getElementById('statScore').textContent = best ? best + '%' : '—';
    document.getElementById('profilePlan').textContent = subscription.data ? 'PRO' : 'FREE';
  } catch (error) {
    console.error('LEXORA profile load:', error);
    setProfileMessage('تعذر تحميل بعض بيانات الملف. تحقق من اتصالك ثم أعد المحاولة.', true);
  }
}
profileForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!activeProfileUser) return;
  const button = document.getElementById('saveProfileBtn');
  button.disabled = true;
  setProfileMessage('جارٍ حفظ بياناتك…');
  const username = document.getElementById('profileUsername').value.trim().toLowerCase();
  const interests = [...document.querySelectorAll('input[name="interest"]:checked')].map(input => input.value);
  const updates = {
    id: activeProfileUser.id,
    display_name: document.getElementById('profileDisplayName').value.trim(),
    username: username || null,
    bio: document.getElementById('profileBio').value.trim(),
    current_level: document.getElementById('profileLevel').value,
    country: document.getElementById('profileCountry').value.trim(),
    learning_goal: document.getElementById('profileGoal').value,
    daily_goal_minutes: Number(document.getElementById('profileDailyGoal').value),
    interests,
    updated_at: new Date().toISOString()
  };
  try {
    const { data, error } = await supabase.from('profiles').upsert(updates).select('*').single();
    if (error) throw error;
    fillProfile(data, activeProfileUser);
    setProfileMessage('تم حفظ ملفك التعليمي بنجاح.');
  } catch (error) {
    console.error('LEXORA profile save:', error);
    const duplicate = error.code === '23505';
    setProfileMessage(duplicate ? 'اسم المستخدم مستخدم بالفعل. اختر اسماً آخر.' : 'تعذر حفظ التغييرات: ' + (error.message || 'حاول مرة أخرى.'), true);
  } finally {
    button.disabled = false;
  }
});
document.getElementById('avatarFile').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file || !activeProfileUser) return;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    setProfileMessage('اختر صورة JPG أو PNG أو WebP بحجم لا يتجاوز 5MB.', true);
    event.target.value = '';
    return;
  }
  setProfileMessage('جارٍ رفع الصورة…');
  try {
    const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = activeProfileUser.id + '/' + crypto.randomUUID() + '.' + ext;
    const { error: uploadError } = await supabase.storage.from('lexora-avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) throw uploadError;
    const { data: publicData } = supabase.storage.from('lexora-avatars').getPublicUrl(path);
    const { data, error } = await supabase.from('profiles')
      .update({ avatar_url: publicData.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', activeProfileUser.id).select('*').single();
    if (error) throw error;
    fillProfile(data, activeProfileUser);
    setProfileMessage('تم تحديث صورتك الشخصية.');
  } catch (error) {
    console.error('LEXORA avatar upload:', error);
    setProfileMessage('تعذر رفع الصورة. حاول مرة أخرى.', true);
  } finally {
    event.target.value = '';
  }
});


// Principal administrator content manager: authorization is enforced by JWT app_metadata + database RLS.
const adminSection = document.getElementById('lexoraAdmin');
const adminMessage = document.getElementById('adminMessage');
function adminNotice(text, error = false) {
  adminMessage.textContent = text;
  adminMessage.classList.toggle('error', error);
}
function requireAdmin() {
  return Boolean(activeProfileUser?.app_metadata?.role === 'admin');
}
document.getElementById('adminOpenBtn').addEventListener('click', () => {
  if (!requireAdmin()) return;
  window.location.href = '/admin.html';
});
async function loadAdminContent() {
  if (!requireAdmin()) return;
  try {
    const [{data: levels,error:le},{data:units,error:ue},{data:lessons,error:de}] = await Promise.all([
      supabase.from('course_levels').select('id,code,title_ar,title_en').order('sort_order'),
      supabase.from('course_units').select('id,level_id,title_ar,title_en').order('sort_order'),
      supabase.from('lessons').select('id,title_ar,title_en,status,access_plan,unit_id,duration_minutes').order('created_at',{ascending:false}).limit(50)
    ]);
    if(le) throw le; if(ue) throw ue; if(de) throw de;
    const levelSelect=document.getElementById('adminUnitLevel');
    const unitSelect=document.getElementById('adminLessonUnit');
    levelSelect.replaceChildren(); unitSelect.replaceChildren();
    (levels||[]).forEach(level=>levelSelect.add(new Option(level.title_ar+' · '+level.code,level.id)));
    (units||[]).forEach(unit=>unitSelect.add(new Option(unit.title_ar+' / '+unit.title_en,unit.id)));
    const list=document.getElementById('adminLessonsList');
    list.replaceChildren();
    if(!lessons?.length){list.textContent='لا توجد دروس بعد. ابدأ بإنشاء مستوى ووحدة ثم أضف أول درس.';}
    (lessons||[]).forEach(lesson=>{
      const item=document.createElement('article'); item.className='admin-lesson-row';
      const info=document.createElement('div'); const title=document.createElement('strong'); title.textContent=lesson.title_ar+' · '+lesson.title_en;
      const meta=document.createElement('small'); meta.textContent=(lesson.status==='published'?'منشور':'مسودة')+' · '+(lesson.access_plan==='pro'?'PRO':'مجاني')+' · '+lesson.duration_minutes+' دقائق';
      info.append(title,meta);
      const toggle=document.createElement('button'); toggle.type='button'; toggle.className='btn btn-ghost'; toggle.textContent=lesson.status==='published'?'إلغاء النشر':'نشر';
      toggle.addEventListener('click',()=>changeLessonStatus(lesson.id,lesson.status==='published'?'draft':'published'));
      item.append(info,toggle); list.append(item);
    });
  } catch(error) {
    console.error('Admin content load failed',error);
    adminNotice('تعذر تحميل لوحة المحتوى. تأكد من صلاحية المدير.',true);
  }
}
async function changeLessonStatus(id,status){
  if(!requireAdmin()) return;
  const {error}=await supabase.from('lessons').update({status,published_at:status==='published'?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq('id',id);
  if(error){adminNotice('تعذر تغيير حالة الدرس: '+error.message,true);return;}
  adminNotice(status==='published'?'تم نشر الدرس.':'أُعيد الدرس إلى المسودات.');
  await loadAdminContent();
}
document.getElementById('adminLevelForm').addEventListener('submit',async event=>{
  event.preventDefault(); if(!requireAdmin()) return;
  const code=document.getElementById('adminLevelCode').value;
  const row={code,title_ar:document.getElementById('adminLevelAr').value.trim(),title_en:document.getElementById('adminLevelEn').value.trim(),description_ar:document.getElementById('adminLevelDesc').value.trim(),sort_order:['zero','A1','A2','B1','B2','C1'].indexOf(code)};
  const {error}=await supabase.from('course_levels').insert(row);
  if(error){adminNotice('تعذر حفظ المستوى: '+error.message,true);return;}
  event.target.reset();adminNotice('تمت إضافة المستوى.');await loadAdminContent();
});
document.getElementById('adminUnitForm').addEventListener('submit',async event=>{
  event.preventDefault();if(!requireAdmin())return;
  const row={level_id:document.getElementById('adminUnitLevel').value,title_ar:document.getElementById('adminUnitAr').value.trim(),title_en:document.getElementById('adminUnitEn').value.trim()};
  if(!row.level_id){adminNotice('أضف مستوى أولاً.',true);return;}
  const {error}=await supabase.from('course_units').insert(row);
  if(error){adminNotice('تعذر حفظ الوحدة: '+error.message,true);return;}
  event.target.reset();adminNotice('تمت إضافة الوحدة.');await loadAdminContent();
});
document.getElementById('adminLessonForm').addEventListener('submit',async event=>{
  event.preventDefault();if(!requireAdmin())return;
  const row={unit_id:document.getElementById('adminLessonUnit').value,title_ar:document.getElementById('adminLessonAr').value.trim(),title_en:document.getElementById('adminLessonEn').value.trim(),summary_ar:document.getElementById('adminLessonSummary').value.trim(),duration_minutes:Number(document.getElementById('adminLessonDuration').value),access_plan:document.getElementById('adminLessonPlan').value,status:document.getElementById('adminLessonStatus').value,published_at:document.getElementById('adminLessonStatus').value==='published'?new Date().toISOString():null};
  if(!row.unit_id){adminNotice('أضف وحدة أولاً.',true);return;}
  const {error}=await supabase.from('lessons').insert(row);
  if(error){adminNotice('تعذر حفظ الدرس: '+error.message,true);return;}
  event.target.reset();adminNotice('تم إنشاء الدرس بنجاح.');await loadAdminContent();
});
document.getElementById('adminRefresh').addEventListener('click',loadAdminContent);


// LEXORA learner course catalog: only published levels, units and lessons are exposed by RLS.
const courseCatalog = document.getElementById('courseCatalog');
const courseFilters = document.getElementById('courseFilters');
const courseStatus = document.getElementById('courseStatus');
let courseCatalogData = [];
let selectedCourseLevel = 'all';

function courseNode(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined && value !== null) node.textContent = String(value);
  return node;
}

function renderInteractiveTranscript(panel, player, tokens, transcript) {
  const wrap = courseNode('div', 'interactive-transcript');
  const heading = courseNode('div', 'transcript-heading');
  heading.append(courseNode('strong', '', tokens?.length ? 'النص التفاعلي المتزامن' : 'تفريغ الحوار الكامل'));
  heading.append(courseNode('small', '', tokens?.length ? 'اضغط على أي كلمة لترى معناها' : 'النص الإنجليزي المطابق للفيديو'));
  const wordArea = courseNode('div', 'transcript-words');
  wrap.append(heading, wordArea);
  panel.append(wrap);

  if (!tokens?.length) {
    if (transcript?.transcript_text) {
      const transcriptText = courseNode('pre', 'transcript-full-text', transcript.transcript_text);
      wordArea.append(transcriptText);
      if (transcript.source_name) wordArea.append(courseNode('small', 'course-muted', 'النص الأصلي: ' + transcript.source_name));
      const actions = courseNode('div', 'transcript-actions');
      const download = courseNode('button', 'btn btn-ghost', 'تنزيل التفريغ النصي TXT');
      download.type = 'button';
      download.addEventListener('click', () => {
        const blob = new Blob([transcript.transcript_text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'LEXORA-transcript.txt';
        document.body.append(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      });
      actions.append(download);
      if (transcript.source_url) {
        const source = courseNode('a', 'course-source-link', 'المصدر الأصلي والتدريبات');
        source.href = transcript.source_url;
        source.target = '_blank';
        source.rel = 'noopener noreferrer';
        actions.append(source);
      }
      wrap.append(actions);
      return;
    }
    wordArea.append(courseNode('p', 'course-muted', 'سيُضاف التفريغ النصي لهذا الفيديو قبل نشر الدرس.'));
    return;
  }

  const translation = courseNode('div', 'transcript-translation');
  translation.setAttribute('aria-live', 'polite');
  translation.append(courseNode('small', '', 'ترجمة الكلمة'));
  const selected = courseNode('strong', '', 'اضغط على كلمة للبدء');
  const pronunciation = courseNode('span', '', '');
  translation.append(selected, pronunciation);
  wrap.append(translation);
  let activeIndex = -1;
  const buttons = tokens.map((token, index) => {
    const button = courseNode('button', 'transcript-word', token.token_text);
    button.type = 'button';
    button.setAttribute('aria-label', token.token_text + ' — اضغط لعرض الترجمة');
    button.addEventListener('click', () => {
      selected.textContent = token.translation_ar;
      pronunciation.textContent = token.token_text;
      player.currentTime = token.start_ms / 1000;
      buttons.forEach((node, i) => node.classList.toggle('active', i === index));
      activeIndex = index;
    });
    wordArea.append(button);
    return button;
  });
  const syncWord = () => {
    const now = player.currentTime * 1000;
    let found = -1;
    for (let i = 0; i < tokens.length; i++) {
      if (now >= tokens[i].start_ms && now < tokens[i].end_ms) { found = i; break; }
    }
    if (found !== activeIndex && found >= 0) {
      activeIndex = found;
      buttons.forEach((node, i) => node.classList.toggle('active', i === found));
      selected.textContent = tokens[found].translation_ar;
      pronunciation.textContent = tokens[found].token_text;
      if (buttons[found]) buttons[found].scrollIntoView({block:'nearest',inline:'nearest'});
    }
  };
  player.addEventListener('timeupdate', syncWord);
  player.addEventListener('seeked', syncWord);
  player.addEventListener('ended', () => {
    buttons.forEach(node => node.classList.remove('active'));
    activeIndex = -1;
  });
}

function renderCourseMedia(container, mediaRows, transcriptByMedia = {}) {
  if (!mediaRows?.length) {
    container.append(courseNode('p', 'course-muted', 'لا تتوفر مادة مرئية أو صوتية لهذا الدرس حالياً.'));
    return;
  }
  mediaRows.forEach(media => {
    if (!media.external_url) return;
    const item = courseNode('div', 'course-media-item');
    const label = courseNode('strong', '', media.caption || (media.media_type === 'video' ? 'مشاهدة الدرس' : 'استمع إلى الدرس'));
    item.append(label);
    if (media.media_type === 'video') {
      const learningLayout = courseNode('div', 'video-learning-layout');
      const player = document.createElement('video');
      player.controls = true;
      player.preload = 'metadata';
      player.playsInline = true;
      player.src = media.external_url;
      player.setAttribute('aria-label', media.caption || 'فيديو الدرس');
      const transcriptPanel = courseNode('aside', 'video-transcript-panel');
      transcriptPanel.setAttribute('aria-label', 'النص الإنجليزي التفاعلي والترجمة العربية');
      learningLayout.append(player, transcriptPanel);
      renderInteractiveTranscript(transcriptPanel, player, transcriptByMedia[media.id]?.tokens || [], transcriptByMedia[media.id]?.transcript || null);
      item.append(learningLayout);
    } else if (media.media_type === 'audio') {
      const player = document.createElement('audio');
      player.controls = true;
      player.preload = 'none';
      player.src = media.external_url;
      player.setAttribute('aria-label', media.caption || 'صوت الدرس');
      item.append(player);
    } else {
      const link = courseNode('a', 'course-source-link', 'فتح المادة التعليمية');
      link.href = media.external_url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      item.append(link);
    }
    container.append(item);
  });
}

function renderLessonExercise(container, lesson) {
  const exercise = lesson.exercise;
  if (!exercise?.questions?.length) return;
  const panel = courseNode('section', 'lesson-exercise');
  const intro = courseNode('div', 'exercise-intro');
  intro.append(courseNode('span', 'course-level-pill', 'تدريب تفاعلي'));
  intro.append(courseNode('h6', '', exercise.title_ar || 'اختبر فهمك'));
  intro.append(courseNode('p', 'course-muted', 'أجب عن الأسئلة بالترتيب. بعد كل إجابة ستعرف النتيجة وسببها.'));
  const start = courseNode('button', 'btn btn-mint exercise-start', 'ابدأ الاختبار · ' + exercise.questions.length + ' أسئلة');
  start.type = 'button';
  intro.append(start);
  panel.append(intro);
  const stage = courseNode('div', 'exercise-stage');
  stage.hidden = true;
  panel.append(stage);
  container.append(panel);
  let index = 0, score = 0;
  function showQuestion() {
    stage.replaceChildren();
    const question = exercise.questions[index];
    const progress = courseNode('div', 'exercise-progress');
    progress.append(courseNode('span', '', 'السؤال ' + (index + 1) + ' من ' + exercise.questions.length));
    const track = courseNode('div', 'exercise-progress-track');
    const fill = courseNode('span', '');
    fill.style.width = ((index / exercise.questions.length) * 100) + '%';
    track.append(fill); progress.append(track); stage.append(progress);
    stage.append(courseNode('p', 'exercise-question-en', question.question_en));
    stage.append(courseNode('h6', 'exercise-question-ar', question.question_ar));
    const choices = courseNode('div', 'exercise-choices');
    question.options.forEach(option => {
      const choice = courseNode('button', 'exercise-choice');
      choice.type = 'button'; choice.dataset.optionId = option.id;
      choice.append(courseNode('span', 'exercise-choice-mark', ''));
      choice.append(courseNode('span', '', option.option_ar));
      if (option.option_en && option.option_en !== option.option_ar) choice.append(courseNode('small', 'exercise-choice-en', option.option_en));
      choice.addEventListener('click', () => {
        if (choices.dataset.answered === 'true') return;
        choices.dataset.answered = 'true';
        const correct = Boolean(option.is_correct);
        if (correct) score++;
        choices.querySelectorAll('button').forEach(button => {
          button.disabled = true;
          const selectedOption = question.options.find(item => item.id === button.dataset.optionId);
          if (selectedOption?.is_correct) button.classList.add('correct');
          else if (button === choice) button.classList.add('incorrect');
        });
        const feedback = courseNode('div', 'exercise-feedback ' + (correct ? 'success' : 'retry'));
        feedback.append(courseNode('strong', '', correct ? 'إجابة صحيحة! أحسنت.' : 'ليست الإجابة الصحيحة، تعلّم من التوضيح:'));
        feedback.append(courseNode('p', '', question.explanation_ar || 'راجع الشرح ثم حاول مرة أخرى.'));
        stage.append(feedback);
        const next = courseNode('button', 'btn btn-mint exercise-next', index === exercise.questions.length - 1 ? 'عرض نتيجتي' : 'السؤال التالي');
        next.type = 'button';
        next.addEventListener('click', () => { index++; if (index < exercise.questions.length) showQuestion(); else finishExercise(); });
        stage.append(next);
      });
      choices.append(choice);
    });
    stage.append(choices);
  }
  async function finishExercise() {
    const percent = Math.round((score / exercise.questions.length) * 100);
    const passed = percent >= (exercise.pass_score ?? 75);
    stage.replaceChildren();
    const result = courseNode('div', 'exercise-result ' + (passed ? 'passed' : 'not-passed'));
    result.append(courseNode('span', 'exercise-result-score', percent + '%'));
    result.append(courseNode('h6', '', passed ? 'ممتاز! أتقنت هذا التدريب.' : 'بداية جيدة — راجع الشرح وأعد المحاولة.'));
    result.append(courseNode('p', '', 'أجبت إجابة صحيحة عن ' + score + ' من ' + exercise.questions.length + ' أسئلة. درجة الاجتياز: ' + (exercise.pass_score ?? 75) + '%.'));
    if (activeProfileUser?.id) {
      try {
        const { data: previous, error: readError } = await supabase.from('learning_progress')
          .select('best_score,is_completed,completed_stages').eq('user_id', activeProfileUser.id)
          .eq('lesson_key', lesson.id).maybeSingle();
        if (readError) throw readError;
        const bestScore = Math.max(previous?.best_score || 0, percent);
        const isCompleted = Boolean(previous?.is_completed || passed);
        const { error } = await supabase.from('learning_progress').upsert({
          user_id: activeProfileUser.id, lesson_key: lesson.id,
          current_stage: isCompleted ? 2 : 1,
          completed_stages: isCompleted ? [1, 2] : [1],
          best_score: bestScore, is_completed: isCompleted, updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,lesson_key' });
        if (error) throw error;
        result.append(courseNode('small', 'exercise-saved', passed ? 'تم حفظ إكمال الدرس في ملفك التعليمي.' : 'تم حفظ نتيجتك. أعد المحاولة لتحسينها.'));
      } catch (error) {
        console.error('LEXORA progress save:', error);
        result.append(courseNode('small', 'exercise-save-error', 'تعذر حفظ النتيجة الآن. حاول مرة أخرى بعد التأكد من اتصالك.'));
      }
    } else result.append(courseNode('small', 'exercise-save-error', 'سجّل الدخول لحفظ نتيجتك ومتابعة تقدمك.'));
    const retry = courseNode('button', 'btn btn-ghost exercise-retry', 'إعادة الاختبار');
    retry.type = 'button';
    retry.addEventListener('click', () => { index = 0; score = 0; showQuestion(); });
    result.append(retry); stage.append(result);
  }
  start.addEventListener('click', () => { intro.hidden = true; stage.hidden = false; showQuestion(); });
}

function renderCourseCatalog() {
  if (!courseCatalog) return;
  courseCatalog.replaceChildren();
  const visibleLevels = courseCatalogData.filter(level => selectedCourseLevel === 'all' || level.code === selectedCourseLevel);
  if (!visibleLevels.length) {
    courseCatalog.append(courseNode('p', 'course-empty', 'لا توجد دروس منشورة في هذا المستوى حالياً.'));
    return;
  }
  visibleLevels.forEach(level => {
    const levelBlock = courseNode('section', 'course-level-block');
    const levelHead = courseNode('div', 'course-level-heading');
    const levelTitle = document.createElement('h3');
    levelTitle.textContent = level.title_ar + ' · ' + level.code.toUpperCase();
    levelHead.append(levelTitle, courseNode('span', 'course-level-description', level.description_ar || level.title_en));
    levelBlock.append(levelHead);
    (level.units || []).forEach(unit => {
      const unitBlock = courseNode('div', 'course-unit-block');
      const unitTitle = document.createElement('h4');
      unitTitle.textContent = unit.title_ar + ' · ' + unit.title_en;
      unitBlock.append(unitTitle);
      const lessonGrid = courseNode('div', 'course-lesson-grid');
      (unit.lessons || []).forEach(lesson => {
        const card = courseNode('article', 'course-lesson-card');
        const top = courseNode('div', 'course-lesson-top');
        top.append(courseNode('span', 'course-level-pill', level.code.toUpperCase()));
        top.append(courseNode('span', lesson.access_plan === 'pro' ? 'course-plan-pill pro' : 'course-plan-pill', lesson.access_plan === 'pro' ? 'PRO' : 'مجاني'));
        const title = document.createElement('h5');
        title.textContent = lesson.title_ar + ' · ' + lesson.title_en;
        const meta = courseNode('p', 'course-lesson-meta', (lesson.duration_minutes || 10) + ' دقائق');
        const summary = courseNode('p', 'course-lesson-intro', lesson.summary_ar || 'درس تدريبي لتطوير مهاراتك في الإنجليزية.');
        const details = document.createElement('details');
        details.className = 'course-lesson-details';
        const summaryToggle = document.createElement('summary');
        summaryToggle.textContent = 'عرض محتوى الدرس';
        details.append(summaryToggle);
        const content = courseNode('div', 'course-lesson-content');
        if (lesson.summary_en) {
          content.append(courseNode('h6', '', 'Lesson overview'));
          content.append(courseNode('p', 'course-description-en', lesson.summary_en));
        }
        if (lesson.summary_ar) {
          content.append(courseNode('h6', '', 'مراحل الدرس'));
          content.append(courseNode('p', 'course-description-ar', lesson.summary_ar));
        }
        const mediaHeading = courseNode('h6', '', 'الفيديو والاستماع');
        content.append(mediaHeading);
        renderCourseMedia(content, lesson.media || [], lesson.transcriptByMedia || {});
        if (lesson.vocabulary?.length) {
          content.append(courseNode('h6', '', 'المفردات'));
          const words = courseNode('div', 'course-word-list');
          lesson.vocabulary.forEach(word => {
            const wordCard = courseNode('div', 'course-word');
            wordCard.append(courseNode('strong', '', word.term));
            wordCard.append(courseNode('span', '', word.meaning_ar));
            if (word.pronunciation) wordCard.append(courseNode('small', '', word.pronunciation));
            if (word.example_en) wordCard.append(courseNode('p', 'course-word-example', word.example_en));
            if (word.example_ar) wordCard.append(courseNode('p', 'course-word-example-ar', word.example_ar));
            words.append(wordCard);
          });
          content.append(words);
        }
        if (lesson.exercise) renderLessonExercise(content, lesson);
        details.append(content);
        card.append(top, title, meta, summary, details);
        lessonGrid.append(card);
      });
      if (!unit.lessons?.length) lessonGrid.append(courseNode('p', 'course-muted', 'سيتم إضافة الدروس لهذه الوحدة قريباً.'));
      unitBlock.append(lessonGrid);
      levelBlock.append(unitBlock);
    });
    courseCatalog.append(levelBlock);
  });
}

async function loadCourseCatalog() {
  if (!courseCatalog) return;
  courseStatus.textContent = 'جارٍ تحميل الدروس…';
  try {
    const [levelsResult, unitsResult, lessonsResult] = await Promise.all([
      supabase.from('course_levels').select('id,code,title_ar,title_en,description_ar,sort_order').eq('is_published', true).order('sort_order'),
      supabase.from('course_units').select('id,level_id,title_ar,title_en,description_ar,sort_order').eq('is_published', true).order('sort_order'),
      supabase.from('lessons').select('id,unit_id,title_ar,title_en,summary_ar,summary_en,access_plan,duration_minutes,sort_order').eq('status', 'published').order('sort_order')
    ]);
    if (levelsResult.error) throw levelsResult.error;
    if (unitsResult.error) throw unitsResult.error;
    if (lessonsResult.error) throw lessonsResult.error;
    const lessons = lessonsResult.data || [];
    const ids = lessons.map(lesson => lesson.id);
    let media = [], vocabulary = [], transcriptTokens = [], fullTranscripts = [], exercises = [], exerciseQuestions = [], exerciseOptions = [];
    if (ids.length) {
      const [mediaResult, vocabularyResult] = await Promise.all([
        supabase.from('lesson_media').select('id,lesson_id,media_type,external_url,language,caption,sort_order').in('lesson_id', ids).order('sort_order'),
        supabase.from('lesson_vocabulary').select('id,lesson_id,term,meaning_ar,pronunciation,example_en,example_ar,sort_order').in('lesson_id', ids).order('sort_order')
      ]);
      if (mediaResult.error) throw mediaResult.error;
      if (vocabularyResult.error) throw vocabularyResult.error;
      media = mediaResult.data || [];
      vocabulary = vocabularyResult.data || [];
      const exerciseResult = await supabase.from('lesson_exercises')
        .select('id,lesson_id,title_ar,title_en,exercise_type,pass_score,sort_order').in('lesson_id', ids).order('sort_order');
      if (exerciseResult.error) throw exerciseResult.error;
      exercises = exerciseResult.data || [];
      const exerciseIds = exercises.map(item => item.id);
      if (exerciseIds.length) {
        const questionResult = await supabase.from('exercise_questions')
          .select('id,exercise_id,question_ar,question_en,explanation_ar,sort_order')
          .in('exercise_id', exerciseIds).order('sort_order');
        if (questionResult.error) throw questionResult.error;
        exerciseQuestions = questionResult.data || [];
        const questionIds = exerciseQuestions.map(item => item.id);
        if (questionIds.length) {
          const optionResult = await supabase.from('exercise_options')
            .select('id,question_id,option_ar,option_en,is_correct,sort_order')
            .in('question_id', questionIds).order('sort_order');
          if (optionResult.error) throw optionResult.error;
          exerciseOptions = optionResult.data || [];
        }
      }
      const mediaIds = media.map(item => item.id);
      if (mediaIds.length) {
        const [tokenResult, fullTranscriptResult] = await Promise.all([
          supabase.from('lesson_transcript_tokens').select('id,media_id,sequence,token_text,translation_ar,start_ms,end_ms,speaker').in('media_id', mediaIds).order('sequence'),
          supabase.from('lesson_transcripts').select('media_id,transcript_text,source_url,source_name,language').in('media_id', mediaIds)
        ]);
        if (tokenResult.error) throw tokenResult.error;
        if (fullTranscriptResult.error) throw fullTranscriptResult.error;
        transcriptTokens = tokenResult.data || [];
        fullTranscripts = fullTranscriptResult.data || [];
      }
    }
    courseCatalogData = (levelsResult.data || []).map(level => ({
      ...level,
      units: (unitsResult.data || []).filter(unit => unit.level_id === level.id).map(unit => ({
        ...unit,
        lessons: lessons.filter(lesson => lesson.unit_id === unit.id).map(lesson => ({
          ...lesson,
          media: media.filter(item => item.lesson_id === lesson.id),
          transcriptByMedia: Object.fromEntries(media.filter(item => item.lesson_id === lesson.id).map(item => [item.id, {
            tokens: transcriptTokens.filter(token => token.media_id === item.id),
            transcript: fullTranscripts.find(row => row.media_id === item.id) || null
          }])),
          vocabulary: vocabulary.filter(item => item.lesson_id === lesson.id),
          exercise: (() => {
            const row = exercises.filter(item => item.lesson_id === lesson.id).sort((a,b) => a.sort_order-b.sort_order)[0];
            if (!row) return null;
            return { ...row, questions: exerciseQuestions.filter(q => q.exercise_id === row.id).map(q => ({
              ...q, options: exerciseOptions.filter(o => o.question_id === q.id)
            })) };
          })()
        }))
      }))
    }));
    if (courseFilters) {
      courseFilters.replaceChildren();
      const filters = [{code:'all',label:'كل المستويات'}, ...(levelsResult.data || []).map(level => ({code:level.code,label:level.code.toUpperCase()}))];
      filters.forEach(filter => {
        const button = courseNode('button', 'course-filter' + (selectedCourseLevel === filter.code ? ' active' : ''), filter.label);
        button.type = 'button';
        button.addEventListener('click', () => {
          selectedCourseLevel = filter.code;
          courseFilters.querySelectorAll('button').forEach(item => item.classList.toggle('active', item.textContent === filter.label));
          renderCourseCatalog();
        });
        courseFilters.append(button);
      });
    }
    const count = lessons.length;
    courseStatus.textContent = count + ' درساً متاحاً حالياً';
    renderCourseCatalog();
  } catch (error) {
    console.error('LEXORA course catalog:', error);
    courseStatus.textContent = 'تعذر تحميل الدروس';
    courseCatalog.replaceChildren(courseNode('p', 'course-error', 'لم نتمكن من تحميل الدروس الآن. حدّث الصفحة وحاول مرة أخرى.'));
  }
}
loadCourseCatalog();


// LEXORA STORY QUEST — long-form English assessment adventures.
(() => {
 const $=id=>document.getElementById(id), stage=$('cartoonStage');
 if(!stage || stage.dataset.storyQuestReady) return; stage.dataset.storyQuestReady='1';
 const make=(before,answer,after,translation,why,options,kind='Grammar')=>({before,answer,after,translation,why,options,kind});
 const episodes=[
 {title:'سرّ الخريطة القديمة',label:'المغامرة 01 · THE SECRET MAP',prop:'🗺️',caption:'THE SECRET MAP',voice:'Mia and Max discover a mysterious map in the park.',scene:'park',
 questions:[
 make('My name ___ Mia.','is','.','اسمي ميا.','نستخدم is مع الاسم المفرد وضمير my name.',['are','is','am']),
 make('Where ___ you from?','are','?','من أين أنت؟','مع you نستخدم are.',['is','are','am']),
 make('I ___ from Jordan.','am','.','أنا من الأردن.','مع I نستخدم am.',['is','am','are']),
 make('The map is ___ the tree.','under','.','الخريطة تحت الشجرة.','under تعني تحت.',['between','under','behind'],'Vocabulary'),
 make('Can you ___ the red mark?','see','?','هل تستطيع رؤية العلامة الحمراء؟','بعد can يأتي الفعل بصيغته الأساسية.',['sees','seeing','see']),
 make('There ___ a key in the box.','is','.','يوجد مفتاح في الصندوق.','نستخدم there is للمفرد.',['are','is','be']),
 make('The keys ___ next to the map.','are','.','المفاتيح بجانب الخريطة.','keys جمع، لذلك نستخدم are.',['is','am','are']),
 make('Mia ___ not afraid.','is','.','ميا ليست خائفة.','النفي مع she يكون is not.',['are','is','do']),
 make('What does “brave” mean?','شجاع','','ما معنى brave؟','brave تعني شجاع.',['حزين','شجاع','متعب'],'Vocabulary'),
 make('Choose the correct sentence:','He has a key.','','اختر الجملة الصحيحة.','مع he نستخدم has وليس have.',['He have a key.','He has a key.','He having a key.'],'Grammar'),
 make('Max: “I can hear something!” What can Max do?','يسمع شيئاً','','ما الذي يستطيع ماكس فعله؟','hear تعني يسمع.',['يرى شيئاً','يسمع شيئاً','يكتب شيئاً'],'Listening'),
 make('The map belongs ___ Mia.','to','.','الخريطة تخص ميا.','التركيب belong to يعني يخص.',['at','to','for']),
 make('Yesterday, they ___ the old key.','found','.','بالأمس وجدا المفتاح القديم.','found هو الماضي من find.',['find','finding','found'],'Grammar'),
 make('If the door is closed, we need a ___.','key','.','إذا كان الباب مغلقاً نحتاج إلى مفتاح.','key تعني مفتاح.',['cloud','key','river'],'Vocabulary'),
 make('“Let’s follow the path.” What should they do?','يتبعوا الطريق','','ماذا ينبغي أن يفعلا؟','follow the path تعني اتّباع الطريق.',['يتركا الخريطة','يتبعا الطريق','يشتريا طعاماً'],'Listening'),
 make('The cave is darker ___ the park.','than','.','الكهف أكثر ظلمة من الحديقة.','نستخدم than في المقارنة.',['then','than','that']),
 make('They ___ looking for the treasure now.','are','.','إنهما يبحثان عن الكنز الآن.','المضارع المستمر: are + verb-ing.',['is','are','am']),
 make('Choose the past form of “go”.','went','','اختر الماضي من go.','الماضي غير المنتظم من go هو went.',['goed','gone','went'],'Grammar'),
 make('Mia says: “Be careful!” She means:','انتبه','','ماذا تقصد ميا؟','Be careful تعني انتبه أو كن حذراً.',['أسرع','انتبه','نم'],'Listening'),
 make('We found the treasure ___ the cave.','inside','.','وجدنا الكنز داخل الكهف.','inside تعني داخل.',['between','inside','above'],'Vocabulary'),
 make('Which question asks about a place?','Where is it?','','أي سؤال يسأل عن المكان؟','Where للسؤال عن المكان.',['When is it?','Where is it?','Who is it?'],'Grammar'),
 make('The adventure was very ___.','exciting','.','كانت المغامرة مثيرة جداً.','exciting تصف شيئاً يثير الحماس.',['excitedly','exciting','excite'],'Vocabulary'),
 make('They have ___ the treasure!','found','.','لقد عثرا على الكنز!','present perfect: have + past participle.',['find','found','finding'],'Grammar'),
 make('What is the best title for this story?','The Secret Map','','ما العنوان الأنسب للقصة؟','العنوان يلخص اكتشاف الخريطة والبحث عن الكنز.',['A Day at School','The Secret Map','A New Bicycle'],'Reading')
 ]},
 {title:'البيت الذي يتكلم',label:'المغامرة 02 · THE TALKING HOUSE',prop:'🏡',caption:'THE TALKING HOUSE',voice:'A strange house speaks to Mia and Max. They must solve its riddles.',scene:'home',
 questions:[
 make('This house ___ three windows.','has','.','هذا المنزل لديه ثلاث نوافذ.','مع house نستخدم has.',['have','has','having']),
 make('There are two ___ in the kitchen.','chairs','.','هناك كرسيان في المطبخ.','جمع chair هو chairs.',['chair','chairs','chaires'],'Vocabulary'),
 make('The cat is ___ the sofa.','on','.','القطة على الأريكة.','on تعني على.',['in','on','between'],'Vocabulary'),
 make('I ___ breakfast every morning.','eat','.','أتناول الفطور كل صباح.','عادة يومية: مضارع بسيط مع I.',['eats','eat','eating']),
 make('She ___ TV in the evening.','watches','.','هي تشاهد التلفاز مساءً.','مع she نضيف es للفعل watch.',['watch','watching','watches']),
 make('The opposite of “clean” is ___.','dirty','.','عكس نظيف هو متسخ.','dirty تعني متسخ.',['tidy','dirty','bright'],'Vocabulary'),
 make('The room is ___ big; it is small.','not','.','الغرفة ليست كبيرة؛ إنها صغيرة.','نستخدم not للنفي.',['no','not','never']),
 make('How ___ apples are there?','many','?','كم تفاحة توجد؟','How many مع الأسماء المعدودة.',['much','many','old']),
 make('How ___ water do you need?','much','?','كم تحتاج من الماء؟','How much مع غير المعدود مثل water.',['many','much','few']),
 make('The children ___ playing upstairs.','are','.','الأطفال يلعبون في الطابق العلوي.','children جمع، لذلك are.',['is','are','am']),
 make('“Turn off the light.” means:','أطفئ الضوء','','ما معنى العبارة؟','turn off تعني يطفئ.',['افتح النافذة','أطفئ الضوء','نظف الطاولة'],'Listening'),
 make('Yesterday, the door ___ open.','was','.','كان الباب مفتوحاً بالأمس.','الماضي من is هو was.',['were','was','is'],'Grammar'),
 make('We ___ visit grandma tomorrow.','will','.','سنزور جدتنا غداً.','will للتعبير عن المستقبل.',['did','will','was']),
 make('The kitchen is ___ than the bedroom.','cleaner','.','المطبخ أنظف من غرفة النوم.','cleaner صيغة مقارنة قصيرة.',['cleanest','cleaner','clean']),
 make('Choose the correct sentence:','There are five rooms.','','اختر الجملة الصحيحة.','rooms جمع، لذلك نقول there are.',['There is five rooms.','There are five rooms.','There be five rooms.'],'Grammar'),
 make('A “neighbor” is someone who…','يسكن بالقرب منك','','ما معنى neighbor؟','neighbor هو شخص يسكن بالقرب منك.',['يعمل في مستشفى','يسكن بالقرب منك','يقود طائرة'],'Vocabulary'),
 make('The house says: “Please be quiet.” What should you do?','تتحدث بهدوء','','ماذا يجب أن تفعل؟','be quiet تعني التزم الهدوء.',['تصرخ','تتحدث بهدوء','تركض'],'Listening'),
 make('I have lived here ___ 2020.','since','','أسكن هنا منذ 2020.','since تأتي مع نقطة بداية زمنية.',['for','since','during'],'Grammar'),
 make('The children were tired, ___ they went to bed.','so','','كان الأطفال متعبين، لذلك ذهبوا للنوم.','so تربط السبب بالنتيجة.',['but','so','because']),
 make('Which word is an adjective?','comfortable','','أي كلمة صفة؟','comfortable صفة تعني مريح.',['quickly','comfortable','comfort'],'Grammar'),
 make('The opposite of “empty” is ___.','full','.','عكس فارغ هو ممتلئ.','full تعني ممتلئ.',['full','quiet','soft'],'Vocabulary'),
 make('If something is “broken”, it is…','معطلاً','','ما معنى broken؟','broken تعني مكسوراً أو معطلاً.',['جديد','معطلاً','نظيفاً'],'Vocabulary'),
 make('The house was built ___ 1990.','in','.','بُني المنزل في عام 1990.','نستخدم in مع السنوات.',['at','on','in'],'Grammar'),
 make('What is the main idea of this adventure?','حل ألغاز المنزل','','ما الفكرة الرئيسية؟','الأبطال يتعلمون وصف المنزل وحل ألغاز صاحبه.',['شراء منزل','حل ألغاز المنزل','السفر إلى البحر'],'Reading')
 ]},
 {title:'رحلة إلى مدينة المستقبل',label:'المغامرة 03 · CITY OF TOMORROW',prop:'🚀',caption:'CITY OF TOMORROW',voice:'Mia and Max travel to a futuristic city and complete real-life English challenges.',scene:'city',
 questions:[
 make('Excuse me, how can I ___ to the station?','get','','عذراً، كيف أصل إلى المحطة؟','get to تعني يصل إلى.',['gets','getting','get']),
 make('The train leaves ___ 8:30.','at','.','يغادر القطار الساعة 8:30.','at مع الوقت المحدد.',['in','on','at'],'Grammar'),
 make('You ___ wear a seat belt.','must','.','يجب أن ترتدي حزام الأمان.','must للتعبير عن الإلزام.',['might','must','could']),
 make('You ___ smoke here. It is forbidden.','must not','.','يُمنع التدخين هنا.','must not تعني ممنوع.',['must','must not','should']),
 make('Could you tell me ___ the museum is?','where','','هل يمكنك إخباري أين المتحف؟','بعد tell me نستخدم ترتيب الجملة غير المباشر.',['where','where is','is where'],'Grammar'),
 make('I am interested ___ technology.','in','.','أنا مهتم بالتكنولوجيا.','التركيب الصحيح interested in.',['on','at','in']),
 make('This is the ___ building in the city.','tallest','.','هذا أطول مبنى في المدينة.','tallest صيغة التفضيل.',['taller','tallest','most tall']),
 make('If it rains, we ___ stay inside.','will','.','إذا أمطرت، سنبقى في الداخل.','الشرط الأول: if + present, will + verb.',['would','will','are']),
 make('The robot can ___ four languages.','speak','.','يستطيع الروبوت التحدث بأربع لغات.','بعد can يأتي الفعل الأساسي.',['speaks','spoke','speak']),
 make('“Reliable” means…','يمكن الاعتماد عليه','','ما معنى reliable؟','reliable تعني جدير بالثقة أو يمكن الاعتماد عليه.',['سريع جداً','يمكن الاعتماد عليه','باهظ'],'Vocabulary'),
 make('The road is closed ___ repairs.','because of','','الطريق مغلق بسبب أعمال الصيانة.','because of يأتي قبل اسم أو عبارة اسمية.',['although','because of','despite'],'Grammar'),
 make('By the time we arrived, the bus ___.','had left','.','عندما وصلنا، كان الباص قد غادر.','الماضي التام لحدث سبق حدثاً ماضياً آخر.',['leaves','has left','had left'],'Grammar'),
 make('The announcement says: “Platform three.” Where should passengers go?','الرصيف الثالث','','إلى أين يذهب المسافرون؟','platform تعني رصيف أو منصة القطار.',['البوابة الأولى','الرصيف الثالث','موقف السيارات'],'Listening'),
 make('Despite ___ tired, she finished the task.','being','','رغم أنها كانت متعبة، أنهت المهمة.','بعد despite نستخدم اسماً أو gerund.',['be','being','was'],'Grammar'),
 make('The new system is more efficient ___ the old one.','than','.','النظام الجديد أكثر كفاءة من القديم.','than للمقارنة.',['as','then','than']),
 make('Choose the best response: “Would you mind opening the window?”','Not at all.','','ما الرد المناسب على طلب مهذب؟','Not at all تعني لا مانع.',['I am window.','Not at all.','Yes, I mind.'],'Listening'),
 make('The information ___ accurate.','is','.','المعلومات دقيقة.','information اسم غير معدود ويعامل كمفرد.',['are','is','be'],'Grammar'),
 make('She suggested ___ the earlier train.','taking','','اقترحت ركوب القطار الأبكر.','suggest يتبعه غالباً فعل ing.',['to take','take','taking'],'Grammar'),
 make('We need to reduce energy ___.','consumption','.','نحتاج إلى تقليل استهلاك الطاقة.','consumption تعني الاستهلاك.',['consume','consumer','consumption'],'Vocabulary'),
 make('Had I known, I ___ have helped.','would','','لو كنت أعلم، لكنت ساعدت.','صيغة الشرط الثالث: would have + past participle.',['will','would','did'],'Grammar'),
 make('The project was delayed ___ a technical problem.','due to','','تأخر المشروع بسبب مشكلة تقنية.','due to تعني بسبب.',['although','due to','unless']),
 make('Which sentence is the most formal?','I would appreciate your assistance.','','أي جملة أكثر رسمية؟','would appreciate صيغة مهذبة ورسمية.',['Help me now.','I want help.','I would appreciate your assistance.'],'Reading'),
 make('The word “sustainable” describes something that…','يمكن استمراره دون استنزاف الموارد','','ما معنى sustainable؟','تعني مستداماً وقابلاً للاستمرار.',['ينتهي بسرعة','يمكن استمراره دون استنزاف الموارد','غير قانوني'],'Vocabulary'),
 make('What is the best summary of this journey?','التواصل وحل المشكلات في مدينة حديثة','','ما أفضل تلخيص للمغامرة؟','القصة تختبر اللغة في مواقف السفر والتقنية والتواصل.',['زيارة حديقة فقط','التواصل وحل المشكلات في مدينة حديثة','تعلم أسماء الحيوانات'],'Reading')
 ]}
 ];
 const extraEpisodes=[
 {title:'المتحف الغامض',label:'المغامرة 04 · THE MYSTERY MUSEUM',prop:'🏛️',caption:'THE MYSTERY MUSEUM',voice:'Mia and Max discover a secret message inside an old museum.',scene:'museum',questions:[
 make('The museum ___ at nine.','opens','.','يفتح المتحف الساعة التاسعة.','المضارع البسيط للمواعيد.',['open','opens','opening'],'Grammar'),
 make('Please ___ your ticket.','show','','أظهر تذكرتك من فضلك.','فعل أمر بصيغته الأساسية.',['shows','show','showing'],'Vocabulary'),
 make('The guide is ___ the entrance.','at','.','المرشد عند المدخل.','at لتحديد نقطة أو موقع.',['in','at','on'],'Grammar'),
 make('Visitors must not ___ the paintings.','touch','.','يجب ألا يلمس الزوار اللوحات.','بعد must not يأتي الفعل الأساسي.',['touches','touch','touching'],'Grammar'),
 make('A person who explains a museum is a ___.','guide','','الشخص الذي يشرح في المتحف هو مرشد.','guide تعني مرشد.',['pilot','guide','chef'],'Vocabulary'),
 make('“Follow me, please.” means:','اتبعني من فضلك','','ما معنى Follow me؟','تعني اتبعني.',['انتظرني','اتبعني','اتركني'],'Listening'),
 make('There ___ an ancient statue here.','is','.','يوجد تمثال قديم هنا.','statue مفرد؛ نستخدم there is.',['are','is','be'],'Grammar'),
 make('This painting is older ___ that one.','than','.','هذه اللوحة أقدم من تلك.','than أداة مقارنة.',['then','that','than'],'Grammar'),
 make('The opposite of ancient is ___.','modern','.','عكس ancient هو modern.','modern تعني حديث.',['modern','quiet','empty'],'Vocabulary'),
 make('We have ___ the hidden symbol.','found','.','لقد وجدنا الرمز المخفي.','have + التصريف الثالث found.',['find','finding','found'],'Grammar'),
 make('Could you help me, ___?','please','','هل يمكنك مساعدتي من فضلك؟','please تجعل الطلب مهذباً.',['please','never','yesterday'],'Grammar'),
 make('What is the mission about?','Finding a hidden symbol','','ما هدف المهمة؟','البحث عن الرمز المخفي.',['Buying a car','Finding a hidden symbol','Cooking dinner'],'Reading')
 ]},
 {title:'محطة القطار',label:'المغامرة 05 · THE TRAIN STATION',prop:'🚆',caption:'THE TRAIN STATION',voice:'The friends arrive at a busy station and must find their train.',scene:'station',questions:[
 make('What time ___ the train leave?','does','','في أي وقت يغادر القطار؟','مع train المفرد نستخدم does.',['do','does','is'],'Grammar'),
 make('The train is on platform ___.','three','','القطار على الرصيف الثالث.','three تعني ثلاثة.',['third','three','thirteen'],'Vocabulary'),
 make('We should arrive ___ the station early.','at','.','ينبغي أن نصل إلى المحطة مبكراً.','arrive at مع الأماكن المحددة.',['on','at','to'],'Grammar'),
 make('Delayed means ___.','متأخر','','ما معنى delayed؟','تعني متأخر.',['ممتلئ','متأخر','سريع'],'Vocabulary'),
 make('The passengers ___ waiting.','are','.','الركاب ينتظرون.','passengers جمع؛ are.',['is','are','am'],'Grammar'),
 make('Where can you buy a ticket?','At the ticket office','','أين تشتري التذكرة؟','من مكتب التذاكر.',['At the ticket office','At the hospital','At the library'],'Reading'),
 make('Please keep your bag ___ you.','with','.','احتفظ بحقيبتك معك.','with تعني مع.',['between','with','from'],'Vocabulary'),
 make('I missed the train because I ___ late.','was','.','فاتني القطار لأنني كنت متأخراً.','الماضي من am/is هو was.',['were','was','am'],'Grammar'),
 make('The next train leaves in twenty ___.','minutes','','يغادر القطار بعد عشرين دقيقة.','minutes جمع minute.',['minute','minutes','minuting'],'Vocabulary'),
 make('Mind the gap means:','انتبه إلى الفراغ بين القطار والمنصة','','ما معنى Mind the gap؟','تحذير من المسافة بين الرصيف والقطار.',['انتبه إلى الفراغ بين القطار والمنصة','أغلق النافذة','أسرع'],'Listening'),
 make('The train is faster ___ the bus.','than','.','القطار أسرع من الحافلة.','than للمقارنة.',['then','than','that'],'Grammar'),
 make('What should they check first?','The departure screen','','ماذا يجب أن يتحققا منه أولاً؟','شاشة المغادرة تعرض الرصيف والوقت.',['The departure screen','A restaurant menu','A weather map'],'Reading')
 ]},
 {title:'يوم على الشاطئ',label:'المغامرة 06 · BEACH DAY',prop:'🏖️',caption:'BEACH DAY',voice:'Mia and Max enjoy a sunny beach day and learn important safety words.',scene:'beach',questions:[
 make('The sun ___ brightly today.','is shining','.','الشمس تشرق بقوة اليوم.','المضارع المستمر is + ing.',['shine','is shining','shines'],'Grammar'),
 make('Wear ___ to protect your eyes.','sunglasses','','ارتدِ نظارة شمسية لحماية عينيك.','sunglasses نظارة شمسية.',['gloves','sunglasses','boots'],'Vocabulary'),
 make('The water is too cold ___ swim.','to','.','الماء بارد جداً للسباحة.','too + adjective + to.',['for','to','at'],'Grammar'),
 make('We ___ a sandcastle yesterday.','built','.','بنينا قلعة رملية أمس.','built ماضي build.',['build','built','building'],'Grammar'),
 make('A lifeguard keeps swimmers ___.','safe','','المنقذ يبقي السباحين آمنين.','safe تعني آمن.',['sleepy','safe','thirsty'],'Vocabulary'),
 make('Stay between the flags means:','ابقَ بين الأعلام','','ما معنى Stay between the flags؟','تعليمات لتحديد منطقة السباحة الآمنة.',['ابتعد عن الشاطئ','ابقَ بين الأعلام','اجمع الأعلام'],'Listening'),
 make('There isn’t ___ milk.','any','','لا يوجد أي حليب.','any تستخدم في النفي.',['some','many','any'],'Grammar'),
 make('A wave is moving ___.','water','','الموجة ماء متحرك.','wave تعني موجة.',['sand','water','stone'],'Vocabulary'),
 make('Max feels thirsty. He needs ___.','some water','','ما الذي يحتاجه ماكس عندما يعطش؟','الماء يروي العطش.',['some water','a blanket','a book'],'Listening'),
 make('We have been here ___ two hours.','for','','نحن هنا منذ ساعتين.','for مع مدة زمنية.',['since','for','during'],'Grammar'),
 make('Don’t leave rubbish on the ___.','sand','','لا تترك النفايات على الرمال.','sand تعني الرمل.',['cloud','sand','sky'],'Vocabulary'),
 make('What is safest during a storm?','Leave the water','','ما الخيار الأكثر أماناً أثناء العاصفة؟','يجب الخروج من الماء.',['Keep swimming','Leave the water','Stand under a tree'],'Reading')
 ]},
 {title:'مدينة المستقبل',label:'المغامرة 07 · CITY OF TOMORROW',prop:'🌆',caption:'CITY OF TOMORROW',voice:'The friends explore a smart city with robots and clean energy.',scene:'future',questions:[
 make('People ___ electric buses here.','use','.','يستخدم الناس الحافلات الكهربائية هنا.','people جمع؛ use.',['uses','use','using'],'Grammar'),
 make('Solar panels produce ___.','electricity','','الألواح الشمسية تنتج الكهرباء.','electricity تعني الكهرباء.',['plastic','electricity','smoke'],'Vocabulary'),
 make('The robot can ___ four languages.','speak','','يستطيع الروبوت التحدث بأربع لغات.','بعد can يأتي الفعل الأساسي.',['speaks','speaking','speak'],'Grammar'),
 make('This is the ___ building.','tallest','.','هذا أطول مبنى.','صيغة التفضيل the tallest.',['taller','tallest','tall'],'Grammar'),
 make('Renewable energy is energy that…','يمكن تجديدها طبيعياً','','ما معنى renewable energy؟','طاقة تتجدد طبيعياً مثل الشمس والرياح.',['تنفد بسرعة','يمكن تجديدها طبيعياً','تسبب الضوضاء'],'Vocabulary'),
 make('Please scan your card means:','امسح بطاقتك إلكترونياً','','ما معنى scan your card؟','مرر البطاقة على الماسح.',['مزق البطاقة','امسح بطاقتك إلكترونياً','أخفِ البطاقة'],'Listening'),
 make('If we use less plastic, we ___ the planet.','will help','','إذا استخدمنا بلاستيكاً أقل سنساعد الكوكب.','الشرط الأول: will + verb.',['helped','will help','helping'],'Grammar'),
 make('The streets are ___ because cars are electric.','quieter','.','الشوارع أكثر هدوءاً لأن السيارات كهربائية.','quieter مقارنة من quiet.',['quietest','quieter','quietly'],'Grammar'),
 make('A screen displays ___.','information','','الشاشة تعرض المعلومات.','information تعني معلومات.',['information','sand','rain'],'Vocabulary'),
 make('The engineers ___ a robot last year.','designed','.','صمم المهندسون روبوتاً العام الماضي.','last year يدل على الماضي.',['design','designed','designing'],'Grammar'),
 make('Efficient means working well without wasting ___.','energy','','ما معنى efficient؟','إنجاز العمل دون هدر الطاقة أو الوقت.',['energy','stories','colors'],'Vocabulary'),
 make('What is the main idea?','Technology can make cities cleaner','','ما الفكرة الرئيسية؟','التقنية والطاقة النظيفة تساعد المدن.',['Technology can make cities cleaner','Robots stop learning','Cars use more fuel'],'Reading')
 ]},
 {title:'مغامرة الغابة',label:'المغامرة 08 · THE FOREST TRAIL',prop:'🌲',caption:'THE FOREST TRAIL',voice:'A forest guide helps the friends find a lost bird.',scene:'forest',questions:[
 make('Birds ___ in trees.','live','.','تعيش الطيور في الأشجار.','حقيقة عامة بالمضارع البسيط.',['lives','live','living'],'Grammar'),
 make('The path is ___ than it looks.','narrower','.','المسار أضيق مما يبدو.','narrower مقارنة من narrow.',['narrowest','narrower','narrow'],'Grammar'),
 make('We must ___ quiet near wild animals.','stay','','يجب أن نبقى هادئين قرب الحيوانات البرية.','stay quiet تعني ابق هادئاً.',['stays','staying','stay'],'Vocabulary'),
 make('A person who studies animals is a ___.','biologist','','من يدرس الحيوانات عالم أحياء.','biologist عالم أحياء.',['biologist','cashier','baker'],'Vocabulary'),
 make('They ___ the bird yesterday.','saw','.','رأوا الطائر أمس.','saw ماضي see.',['see','seen','saw'],'Grammar'),
 make('The ground is slippery means:','الأرض زلقة','','ما معنى slippery؟','slippery تعني زلق.',['الأرض جافة','الأرض زلقة','الطريق واسع'],'Listening'),
 make('There are ___ trees here.','many','','هناك أشجار كثيرة هنا.','many مع المعدود الجمع.',['much','many','any'],'Grammar'),
 make('A nest is a bird’s ___.','home','','العش هو منزل الطائر.','nest تعني عش.',['food','home','wing'],'Vocabulary'),
 make('The bird cannot fly because its wing is ___.','hurt','','لا يستطيع الطائر الطيران لأن جناحه مصاب.','hurt تعني مصاب.',['hungry','hurt','bright'],'Listening'),
 make('We protect forests ___ they are important.','because','','نحمي الغابات لأنها مهمة.','because تقدم السبب.',['although','because','unless'],'Grammar'),
 make('The opposite of dangerous is ___.','safe','','عكس خطير هو آمن.','safe تعني آمن.',['wild','safe','deep'],'Vocabulary'),
 make('What should hikers take?','Water and a map','','ماذا يأخذ المتنزهون؟','الماء والخريطة من أساسيات الرحلة.',['A television','Water and a map','A sofa'],'Reading')
 ]},
 {title:'المطعم العالمي',label:'المغامرة 09 · WORLD KITCHEN',prop:'🍽️',caption:'WORLD KITCHEN',voice:'The friends order food and practise polite English in a restaurant.',scene:'restaurant',questions:[
 make('I would like ___ orange juice, please.','some','','أريد بعض عصير البرتقال من فضلك.','some في الطلبات المهذبة.',['any','some','many'],'Grammar'),
 make('Could we see the ___, please?','menu','','هل يمكننا رؤية قائمة الطعام؟','menu قائمة الطعام.',['menu','bill','kitchen'],'Vocabulary'),
 make('This soup tastes ___.','delicious','.','طعم الحساء لذيذ.','delicious صفة.',['delicious','deliciously','delight'],'Grammar'),
 make('The waiter ___ our order.','took','.','أخذ النادل طلبنا.','took ماضي take.',['take','taken','took'],'Grammar'),
 make('I am allergic ___ peanuts.','to','.','لدي حساسية من الفول السوداني.','allergic to هو التركيب الصحيح.',['with','to','for'],'Grammar'),
 make('Would you like anything else means:','هل ترغب في شيء آخر؟','','ماذا يعني سؤال النادل؟','يسأل إن كان الزبون يريد المزيد.',['هل دفعت؟','هل ترغب في شيء آخر؟','أين تسكن؟'],'Listening'),
 make('We need two ___ of water.','glasses','','نحتاج إلى كأسين من الماء.','جمع glass هو glasses.',['glass','glasses','glassies'],'Vocabulary'),
 make('The bill is ___ expensive.','too','','الفاتورة غالية جداً.','too تعني أكثر من اللازم.',['enough','too','many'],'Grammar'),
 make('Could you bring the bill, ___?','please','','هل يمكنك إحضار الفاتورة من فضلك؟','please للتهذيب.',['please','never','yesterday'],'Vocabulary'),
 make('A meal without meat is ___.','vegetarian','','وجبة بلا لحم تسمى نباتية.','vegetarian تعني نباتي.',['spicy','vegetarian','frozen'],'Vocabulary'),
 make('If the food is too spicy, ask for ___.','water','','إذا كان الطعام حاراً اطلب الماء.','الماء يساعد على تخفيف الإحساس بالحرارة.',['water','pepper','salt'],'Listening'),
 make('The restaurant was busy, ___ service was quick.','but','','كان المطعم مزدحماً لكن الخدمة سريعة.','but للتعارض.',['because','but','so'],'Grammar')
 ]},
 {title:'المطار الدولي',label:'المغامرة 10 · AIRPORT ADVENTURE',prop:'✈️',caption:'AIRPORT ADVENTURE',voice:'The friends are flying abroad and must find their departure gate.',scene:'airport',questions:[
 make('Our flight ___ at 6:30 tomorrow.','departs','.','تغادر رحلتنا غداً الساعة السادسة والنصف.','المواعيد المجدولة بالمضارع البسيط.',['depart','departs','departing'],'Grammar'),
 make('You need your passport at the ___.','check-in desk','','تحتاج جوازك عند مكتب تسجيل الوصول.','check-in desk مكتب إنهاء إجراءات السفر.',['pool','check-in desk','bookshop'],'Vocabulary'),
 make('The opposite of arrival is ___.','departure','','عكس الوصول هو المغادرة.','departure تعني المغادرة.',['journey','departure','passenger'],'Vocabulary'),
 make('We ___ our passports before leaving.','checked','.','تحققنا من جوازاتنا قبل المغادرة.','checked ماضي check.',['check','checking','checked'],'Grammar'),
 make('Boarding starts in ten minutes means:','يبدأ صعود الركاب بعد عشر دقائق','','ما معنى الإعلان؟','boarding صعود الركاب للطائرة.',['تصل الطائرة','يبدأ صعود الركاب بعد عشر دقائق','يغلق المطار'],'Listening'),
 make('The gate number is displayed ___ the screen.','on','.','رقم البوابة معروض على الشاشة.','on مع ما يظهر على الشاشة.',['at','on','in'],'Grammar'),
 make('Keep your seat belt ___.','fastened','','أبقِ حزام المقعد مربوطاً.','fastened تعني مربوط.',['fastened','opened','lost'],'Vocabulary'),
 make('The plane was delayed ___ bad weather.','because of','','تأخرت الطائرة بسبب الطقس السيئ.','because of يتبعها اسم.',['because','because of','although'],'Grammar'),
 make('A person travelling on a plane is a ___.','passenger','','المسافر على الطائرة passenger.','passenger تعني راكب.',['driver','passenger','mechanic'],'Vocabulary'),
 make('If you cannot find your gate, ask a staff ___.','member','','إذا لم تجد البوابة اسأل أحد الموظفين.','staff member فرد من الموظفين.',['member','members','membership'],'Vocabulary'),
 make('By the time we arrived, boarding ___.','had started','','عندما وصلنا كان الصعود قد بدأ.','الماضي التام لحدث سبق حدثاً ماضياً.',['starts','has started','had started'],'Grammar'),
 make('Which document shows your seat details?','Boarding pass','','أي وثيقة تعرض تفاصيل مقعدك؟','بطاقة صعود الطائرة boarding pass.',['Library card','Boarding pass','Shopping receipt'],'Reading')
 ]}
 ];
 episodes.push(...extraEpisodes);
 const path=document.querySelector('.episode-path');
 if(path) extraEpisodes.forEach((ep,index)=>{
  const card=document.createElement('button');card.type='button';card.className='episode-card unlocked';card.dataset.episode=String(index+3);
  const art=document.createElement('span');art.className='episode-art art-extra';const icon=document.createElement('b');icon.textContent=ep.prop;art.append(icon);
  const num=document.createElement('span');num.className='episode-number';num.textContent='الحلقة '+String(index+4).padStart(2,'0');
  const name=document.createElement('strong');name.textContent=ep.title;
  const desc=document.createElement('small');desc.textContent=ep.questions.length+' تحدياً · '+ep.caption;
  const reward=document.createElement('span');reward.className='episode-reward';reward.textContent='⭐ +96 XP';
  card.append(art,num,name,desc,reward);path.append(card);
 });
 let epIndex=0,qIndex=0,xp=0,hearts=5,correct=0,answered=false,completed=0,voiceEnabled=true;
 const completedSet=new Set();
 const voices=()=>window.speechSynthesis?.getVoices?.()||[];
 function speak(text,slow=false){
  if(!voiceEnabled||!('speechSynthesis' in window))return;
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=slow?.82:.94;u.pitch=1.16;
  const list=voices();const pick=list.find(v=>/^en-US/i.test(v.lang)&&/female|samantha|zira|aria|jenny/i.test(v.name))||list.find(v=>/^en-US/i.test(v.lang))||list.find(v=>/^en/i.test(v.lang));if(pick)u.voice=pick;
  speechSynthesis.speak(u);
 }
 function stats(){ $('gameXp').textContent=xp;$('gameHearts').textContent=hearts.toFixed(1).replace('.0','');$('stageHearts').textContent=hearts.toFixed(1).replace('.0','');$('gameStreak').textContent=completed; }
 function start(i){
  epIndex=i;qIndex=0;correct=0;hearts=5;answered=false;const ep=episodes[i];
  $('worldMap').hidden=true;stage.hidden=false;$('stageEpisodeLabel').textContent=ep.label;
  $('sceneProp').textContent=ep.prop;$('sceneCaption').textContent=ep.caption;$('sceneSpeech').textContent=ep.voice;$('cartoonScene').dataset.scene=ep.scene||'park';
  $('sceneCharacterA').className='scene-character scene-character-a character-bounce';$('sceneCharacterB').className='scene-character scene-character-b character-bounce';
  const intro=$('answerFeedback');intro.hidden=false;intro.replaceChildren();
  const h=document.createElement('strong');h.textContent='🎬 '+ep.title;
  const p=document.createElement('p');p.textContent=ep.voice+' ستخوض '+ep.questions.length+' تحدياً متنوعاً. استمع جيداً وابدأ!';
  const b=document.createElement('button');b.className='game-primary';b.textContent='ابدأ القصة';b.onclick=()=>{intro.hidden=true;render();speak(ep.voice);};
  intro.append(h,p,b);$('answerOptions').replaceChildren();$('nextQuestion').hidden=true;
  stage.scrollIntoView({behavior:'smooth',block:'start'});stats();
 }
 function render(){
  const ep=episodes[epIndex],q=ep.questions[qIndex];answered=false;
  $('questionCounter').textContent='التحدي '+(qIndex+1)+' من '+ep.questions.length+' · '+q.kind;
  $('questionProgress').style.width=(qIndex/ep.questions.length*100)+'%';
  const prompt=$('sentencePrompt');prompt.replaceChildren();prompt.append(document.createTextNode(q.before));
  const blank=document.createElement('b');blank.textContent=' _____ ';prompt.append(blank,document.createTextNode(q.after));
  $('sentenceTranslation').textContent=q.translation;
  $('sceneSpeech').textContent=q.kind==='Listening'?q.before:q.before+' '+q.answer+' '+q.after;
  $('answerFeedback').hidden=true;$('answerFeedback').replaceChildren();$('nextQuestion').hidden=true;
  const opts=$('answerOptions');opts.replaceChildren();
  [...q.options].sort(()=>Math.random()-.5).forEach(word=>{const b=document.createElement('button');b.type='button';b.className='answer-option';b.textContent=word;b.onclick=()=>answer(word,b);opts.append(b);});
  speak(q.before+(q.answer? q.answer:'')+q.after);
  stats();
 }
 function answer(word,button){
  if(answered)return;answered=true;const q=episodes[epIndex].questions[qIndex],ok=word===q.answer;
  const blank=$('sentencePrompt').querySelector('b');blank.textContent=' '+q.answer+' ';blank.classList.add(ok?'blank-correct':'blank-wrong');
  $('answerOptions').querySelectorAll('button').forEach(b=>{b.disabled=true;if(b.textContent===q.answer)b.classList.add('option-correct');else if(b===button)b.classList.add('option-wrong');});
  if(ok){correct++;xp+=8;}else{hearts=Math.max(0,hearts-.5);}
  const f=$('answerFeedback');f.hidden=false;f.replaceChildren();
  const title=document.createElement('strong');title.textContent=ok?'أحسنت! إجابة صحيحة 🌟':'خصم نصف قلب ❤️‍🩹';
  const p=document.createElement('p');p.textContent=q.why;
  const sub=document.createElement('small');sub.textContent='الإجابة الصحيحة: '+q.answer+' · '+(ok?'+8 XP':'تبقّى '+hearts+' قلب');
  f.append(title,p,sub);$('nextQuestion').textContent=qIndex===episodes[epIndex].questions.length-1?'عرض نتيجة المغامرة 🏆':'متابعة القصة ←';$('nextQuestion').hidden=false;
  speak(ok?'Excellent! '+q.answer:q.answer+'. '+q.why);
  stats();
 }
 async function finish(){
  const ep=episodes[epIndex],score=Math.round(correct/ep.questions.length*100);
  completedSet.add(epIndex);completed=completedSet.size;$('questionProgress').style.width='100%';$('answerOptions').replaceChildren();
  const f=$('answerFeedback');f.hidden=false;f.replaceChildren();
  const h=document.createElement('strong');h.textContent='🏆 اكتملت المغامرة!';
  const p=document.createElement('p');p.textContent='نتيجتك '+score+'% — أجبت بشكل صحيح عن '+correct+' من '+ep.questions.length+' تحدياً.';
  const advice=document.createElement('p');advice.textContent=score>=90?'ممتاز! أداء قوي جداً.':score>=70?'جيد جداً، راجع الأخطاء لتحقق إتقاناً أعلى.':'واصل التدريب وأعد المغامرة لتحسين نتيجتك.';
  f.append(h,p,advice);
  if(activeProfileUser?.id){try{const key='story-quest-'+(epIndex+1);const {data:old,error:e}=await supabase.from('learning_progress').select('best_score,is_completed').eq('user_id',activeProfileUser.id).eq('lesson_key',key).maybeSingle();if(e)throw e;const {error}=await supabase.from('learning_progress').upsert({user_id:activeProfileUser.id,lesson_key:key,current_stage:2,completed_stages:[1,2],best_score:Math.max(old?.best_score||0,score),is_completed:Boolean(old?.is_completed||score>=70),updated_at:new Date().toISOString()},{onConflict:'user_id,lesson_key'});if(error)throw error;const saved=document.createElement('small');saved.textContent='تم حفظ أفضل نتيجة في حسابك.';f.append(saved);}catch(e){console.error('Story progress save failed',e);}}
  const replay=document.createElement('button');replay.className='game-primary';replay.textContent='أعد المغامرة';replay.onclick=()=>start(epIndex);f.append(replay);
  const map=document.createElement('button');map.className='game-map-link';map.textContent='العودة إلى أغلفة المغامرات';map.onclick=back;f.append(map);
  $('nextQuestion').hidden=true;stats();
 }
 function back(){speechSynthesis?.cancel?.();stage.hidden=true;$('worldMap').hidden=false;$('worldMap').scrollIntoView({behavior:'smooth',block:'start'});}
 $('nextQuestion').addEventListener('click',()=>{if(qIndex<episodes[epIndex].questions.length-1){qIndex++;render();}else finish();});
 $('backToMap').addEventListener('click',back);
 document.querySelectorAll('.episode-card').forEach(c=>c.addEventListener('click',()=>start(Number(c.dataset.episode))));
 $('startAdventure').addEventListener('click',()=>start(0));
 const toolbar=document.createElement('div');toolbar.className='story-audio-tools';
 const audio=document.createElement('button');audio.type='button';audio.className='story-audio-play';audio.textContent='▶ استمع إلى الحوار الإنجليزي';audio.setAttribute('aria-label','تشغيل الحوار الإنجليزي');audio.onclick=()=>{voiceEnabled=true;speak($('sceneSpeech').textContent,true);audio.textContent='↻ إعادة الاستماع';};
 const mute=document.createElement('button');mute.type='button';mute.textContent='🔇 إيقاف الصوت';mute.onclick=()=>{voiceEnabled=false;speechSynthesis?.cancel?.();};
 const unmute=document.createElement('button');unmute.type='button';unmute.textContent='🎙️ تفعيل صوت الشخصيات';unmute.onclick=()=>{voiceEnabled=true;speak($('sceneSpeech').textContent);};
 toolbar.append(audio,mute,unmute);$('cartoonScene').after(toolbar);
 stats();
})();
