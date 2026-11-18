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
 function stats(){ $('gameXp').textContent=window.LEXORA_ACCOUNT_PROGRESS?.getXP?.()??xp;$('gameHearts').textContent=hearts.toFixed(1).replace('.0','');$('stageHearts').textContent=hearts.toFixed(1).replace('.0','');$('gameStreak').textContent=completed; }
 function start(i){
  epIndex=i;qIndex=0;correct=0;hearts=5;answered=false;const ep=episodes[i];
  $('worldMap').hidden=true;stage.hidden=false;$('stageEpisodeLabel').textContent=ep.label;
  $('sceneProp').textContent=ep.prop;$('sceneCaption').textContent=ep.caption;$('sceneSpeech').textContent=ep.voice;$('cartoonScene').dataset.scene=ep.scene||'park';
  $('sceneCharacterA').className='scene-character scene-character-a character-bounce';$('sceneCharacterB').className='scene-character scene-character-b character-bounce';
  const intro=$('answerFeedback');intro.hidden=false;intro.replaceChildren();
  const h=document.createElement('strong');h.textContent='🎬 '+ep.title;
  const p=document.createElement('p');p.textContent=ep.voice+' ستخوض '+ep.questions.length+' تحدياً متنوعاً. استمع جيداً وابدأ!';
  const b=document.createElement('button');b.className='game-primary';b.textContent='ابدأ القصة';b.onclick=()=>{intro.hidden=true;render();};
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
  $('sceneSpeech').textContent=q.before+' '+q.after;
  $('answerFeedback').hidden=true;$('answerFeedback').replaceChildren();$('nextQuestion').hidden=true;
  const opts=$('answerOptions');opts.replaceChildren();
  [...q.options].sort(()=>Math.random()-.5).forEach(word=>{const b=document.createElement('button');b.type='button';b.className='answer-option';b.textContent=word;b.onclick=()=>answer(word,b);opts.append(b);});
  // The character speaks only after the learner submits an answer.
  stats();
 }
 function answer(word,button){
  if(answered)return;answered=true;const q=episodes[epIndex].questions[qIndex],ok=word===q.answer;
  const blank=$('sentencePrompt').querySelector('b');blank.textContent=' '+q.answer+' ';blank.classList.add(ok?'blank-correct':'blank-wrong');
  $('answerOptions').querySelectorAll('button').forEach(b=>{b.disabled=true;if(b.textContent===q.answer)b.classList.add('option-correct');else if(b===button)b.classList.add('option-wrong');});
  if(ok){correct++;xp+=2;window.dispatchEvent(new CustomEvent('lexora:xp',{detail:{amount:2}}));}else{hearts=Math.max(0,hearts-.5);}
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

// LEXORA practical curriculum: each unit opens its own challenge set.
(() => {
 const root=document.getElementById('curriculum'); if(!root || root.dataset.ready) return; root.dataset.ready='1';
 const bank={"daily":[{"unit":"Greetings & Introductions","q":["Hello! How ___ you?","are","مرحباً! كيف حالك؟","is","am"]},{"unit":"Greetings & Introductions","q":["My name ___ Sara.","is","اسمي سارة.","are","am"]},{"unit":"Greetings & Introductions","q":["I ___ from Jordan.","am","أنا من الأردن.","is","are"]},{"unit":"Greetings & Introductions","q":["What is your ___?","name","ما اسمك؟","age","home"]},{"unit":"Greetings & Introductions","q":["Nice to ___ you.","meet","سعيد بلقائك.","see","say"]},{"unit":"Greetings & Introductions","q":["This is my ___, Omar.","friend","هذا صديقي عمر.","food","street"]},{"unit":"Greetings & Introductions","q":["Good ___! See you tomorrow.","night","تصبح على خير! أراك غداً.","morning","afternoon"]},{"unit":"Greetings & Introductions","q":["How old ___ you?","are","كم عمرك؟","is","am"]},{"unit":"Greetings & Introductions","q":["I live ___ Amman.","in","أعيش في عمّان.","on","at"]},{"unit":"Greetings & Introductions","q":["Where do you ___?","work","أين تعمل؟","works","working"]},{"unit":"Family & Friends","q":["My mother's brother is my ___.","uncle","أخو أمي هو خالي.","cousin","nephew"]},{"unit":"Family & Friends","q":["My parents ___ at home.","are","والداي في المنزل.","is","am"]},{"unit":"Family & Friends","q":["I have two ___.","sisters","لدي أختان.","sister","sisteres"]},{"unit":"Family & Friends","q":["She is my best ___.","friend","هي صديقتي المفضلة.","family","neighbor"]},{"unit":"Family & Friends","q":["We ___ together every Friday.","meet","نلتقي معاً كل جمعة.","meets","meeting"]},{"unit":"Family & Friends","q":["He is married ___ Lina.","to","هو متزوج من لينا.","with","at"]},{"unit":"Family & Friends","q":["My brother is ___ than me.","younger","أخي أصغر مني.","young","youngest"]},{"unit":"Family & Friends","q":["They ___ very kind.","are","إنهم لطفاء جداً.","is","be"]},{"unit":"Family & Friends","q":["I visit my grandparents ___ the weekend.","at","أزور جدي وجدتي في عطلة نهاية الأسبوع.","in","on"]},{"unit":"Family & Friends","q":["A person who lives next door is a ___.","neighbor","الشخص الذي يسكن بجوارك هو جار.","stranger","waiter"]},{"unit":"Daily Routine & Home","q":["I ___ up at seven.","wake","أستيقظ الساعة السابعة.","wakes","waking"]},{"unit":"Daily Routine & Home","q":["I brush my ___ every morning.","teeth","أنظف أسناني كل صباح.","hair","hands"]},{"unit":"Daily Routine & Home","q":["She ___ breakfast at eight.","has","تتناول الفطور الساعة الثامنة.","have","having"]},{"unit":"Daily Routine & Home","q":["I take a ___ before work.","shower","أستحم قبل العمل.","sleep","break"]},{"unit":"Daily Routine & Home","q":["The bedroom is ___ the bathroom.","next to","غرفة النوم بجانب الحمام.","between","under"]},{"unit":"Daily Routine & Home","q":["Please open the ___.","window","من فضلك افتح النافذة.","pillow","carpet"]},{"unit":"Daily Routine & Home","q":["The keys are ___ the table.","on","المفاتيح على الطاولة.","at","between"]},{"unit":"Daily Routine & Home","q":["We ___ the house every Saturday.","clean","ننظف المنزل كل سبت.","cleans","cleaning"]},{"unit":"Daily Routine & Home","q":["I go to bed ___ night.","at","أذهب إلى السرير ليلاً.","in","on"]},{"unit":"Daily Routine & Home","q":["The opposite of 'early' is ___.","late","عكس مبكر هو متأخر.","fast","slowly"]},{"unit":"Food, Drinks & Restaurants","q":["I eat ___ for breakfast.","eggs","آكل البيض على الفطور.","water","breaded"]},{"unit":"Food, Drinks & Restaurants","q":["Would you like a cup ___ tea?","of","هل ترغب بكوب من الشاي؟","for","at"]},{"unit":"Food, Drinks & Restaurants","q":["I am thirsty. I need some ___.","water","أنا عطشان، أحتاج إلى الماء.","rice","bread"]},{"unit":"Food, Drinks & Restaurants","q":["An apple is a ___.","fruit","التفاحة فاكهة.","vegetable","drink"]},{"unit":"Food, Drinks & Restaurants","q":["Could I see the ___, please?","menu","هل يمكنني رؤية قائمة الطعام؟","bill","kitchen"]},{"unit":"Food, Drinks & Restaurants","q":["I'd like to ___ a sandwich.","order","أود طلب شطيرة.","orders","ordering"]},{"unit":"Food, Drinks & Restaurants","q":["The food is too ___.","spicy","الطعام حار جداً.","sweetly","salt"]},{"unit":"Food, Drinks & Restaurants","q":["Can we have the ___, please?","bill","هل يمكننا الحصول على الفاتورة؟","menu","table"]},{"unit":"Food, Drinks & Restaurants","q":["I don't eat meat. I'm a ___.","vegetarian","لا آكل اللحوم، أنا نباتي.","waiter","customer"]},{"unit":"Food, Drinks & Restaurants","q":["Orange juice is a ___.","drink","عصير البرتقال مشروب.","meal","fruitful"]},{"unit":"Shopping, Clothes & Transport","q":["How much ___ this shirt?","is","بكم هذا القميص؟","are","does"]},{"unit":"Shopping, Clothes & Transport","q":["I need a larger ___.","size","أحتاج إلى مقاس أكبر.","price","colorful"]},{"unit":"Shopping, Clothes & Transport","q":["You can pay ___ cash.","in","يمكنك الدفع نقداً.","on","at"]},{"unit":"Shopping, Clothes & Transport","q":["These shoes are too ___.","expensive","هذا الحذاء غالي جداً.","hungry","thirsty"]},{"unit":"Shopping, Clothes & Transport","q":["I usually go to work ___ bus.","by","أذهب إلى العمل بالحافلة عادةً.","on","with"]},{"unit":"Shopping, Clothes & Transport","q":["Please fasten your seat ___.","belt","يرجى ربط حزام المقعد.","back","door"]},{"unit":"Shopping, Clothes & Transport","q":["The car is ___ the garage.","in","السيارة داخل المرآب.","on","between"]},{"unit":"Shopping, Clothes & Transport","q":["We need to buy some ___.","groceries","نحتاج إلى شراء بعض مواد البقالة.","furniture","traffic"]},{"unit":"Shopping, Clothes & Transport","q":["My phone battery is ___.","low","بطارية هاتفي منخفضة.","tall","wide"]},{"unit":"Shopping, Clothes & Transport","q":["Can you ___ me the way?","show","هل يمكنك أن تريني الطريق؟","shows","showing"]},{"unit":"Greetings & Introductions","q":["Please ___ me your name.","tell","من فضلك أخبرني باسمك.","say","speak"]},{"unit":"Greetings & Introductions","q":["I am happy to ___ you.","meet","أنا سعيد بلقائك.","make","know"]},{"unit":"Greetings & Introductions","q":["Where are you ___?","from","من أين أنت؟","for","at"]},{"unit":"Greetings & Introductions","q":["I speak a little ___.","English","أتحدث قليلاً من الإنجليزية.","England","Englishes"]},{"unit":"Greetings & Introductions","q":["She ___ a new student.","is","هي طالبة جديدة.","are","be"]},{"unit":"Greetings & Introductions","q":["Let me ___ myself.","introduce","دعني أعرّف بنفسي.","introduces","introducing"]},{"unit":"Greetings & Introductions","q":["See you ___!","later","أراك لاحقاً!","yesterday","early"]},{"unit":"Greetings & Introductions","q":["Thank you for your ___.","help","شكراً لمساعدتك.","hello","name"]},{"unit":"Greetings & Introductions","q":["You are ___ to our school.","welcome","أهلاً بك في مدرستنا.","sorry","goodbye"]},{"unit":"Greetings & Introductions","q":["I would like to ___ a question.","ask","أود أن أطرح سؤالاً.","do","make"]},{"unit":"Family & Friends","q":["My father's father is my ___.","grandfather","والد أبي هو جدي.","uncle","brother"]},{"unit":"Family & Friends","q":["My aunt's daughter is my ___.","cousin","ابنة عمتي/خالتي هي ابنة عمي/خالتي.","niece","sister"]},{"unit":"Family & Friends","q":["My parents have three ___.","children","لدى والديّ ثلاثة أطفال.","child","childs"]},{"unit":"Family & Friends","q":["We have dinner with our ___ every Sunday.","family","نتناول العشاء مع عائلتنا كل أحد.","class","team"]},{"unit":"Family & Friends","q":["My sister is very ___.","helpful","أختي متعاونة جداً.","help","helping"]},{"unit":"Family & Friends","q":["I get along ___ my brother.","with","أنا أتفاهم مع أخي.","at","for"]},{"unit":"Family & Friends","q":["They invited us to their ___.","wedding","دعونا إلى حفل زفافهم.","birthday","homework"]},{"unit":"Family & Friends","q":["My best friend always ___ me.","supports","صديقي المفضل يدعمني دائماً.","support","supporting"]},{"unit":"Family & Friends","q":["We grew up in the same ___.","neighborhood","نشأنا في الحي نفسه.","airport","kitchen"]},{"unit":"Family & Friends","q":["I call my grandmother every ___.","week","أتصل بجدتي كل أسبوع.","weeks","weekly"]},{"unit":"Daily Routine & Home","q":["He ___ his room every morning.","tidies","يرتب غرفته كل صباح.","tidy","tidying"]},{"unit":"Daily Routine & Home","q":["I usually ___ the bus at seven.","catch","عادة أستقل الحافلة الساعة السابعة.","take","takes"]},{"unit":"Daily Routine & Home","q":["She gets ___ at six thirty.","dressed","ترتدي ملابسها الساعة السادسة والنصف.","dress","dressing"]},{"unit":"Daily Routine & Home","q":["We have lunch ___ noon.","at","نتناول الغداء عند الظهر.","in","on"]},{"unit":"Daily Routine & Home","q":["The kitchen is ___ the living room.","beside","المطبخ بجانب غرفة المعيشة.","above","through"]},{"unit":"Daily Routine & Home","q":["Please turn ___ the lights.","off","من فضلك أطفئ الأضواء.","out","over"]},{"unit":"Daily Routine & Home","q":["I ___ my homework after school.","do","أقوم بواجبي بعد المدرسة.","make","does"]},{"unit":"Daily Routine & Home","q":["The washing machine is in the ___.","laundry room","الغسالة في غرفة الغسيل.","bedroom","balcony"]},{"unit":"Daily Routine & Home","q":["My father ___ home at five.","arrives","يصل والدي إلى المنزل الساعة الخامسة.","arrive","arriving"]},{"unit":"Daily Routine & Home","q":["I relax by ___ a book.","reading","أسترخي بقراءة كتاب.","read","reads"]},{"unit":"Food, Drinks & Restaurants","q":["Could I have a glass of ___?","water","هل يمكنني الحصول على كأس ماء؟","rice","cheese"]},{"unit":"Food, Drinks & Restaurants","q":["This soup needs a little ___.","salt","هذا الحساء يحتاج إلى قليل من الملح.","sugar","juice"]},{"unit":"Food, Drinks & Restaurants","q":["We need a table for ___ people.","two","نحتاج طاولة لشخصين.","second","twice"]},{"unit":"Food, Drinks & Restaurants","q":["The waiter brought our ___.","order","أحضر النادل طلبنا.","menu","kitchen"]},{"unit":"Food, Drinks & Restaurants","q":["I prefer tea ___ coffee.","to","أفضل الشاي على القهوة.","than","from"]},{"unit":"Food, Drinks & Restaurants","q":["This bread is freshly ___.","baked","هذا الخبز مخبوز طازجاً.","boil","baking"]},{"unit":"Food, Drinks & Restaurants","q":["Would you like anything ___?","else","هل ترغب بأي شيء آخر؟","also","other"]},{"unit":"Food, Drinks & Restaurants","q":["The restaurant is ___ at eight.","closed","المطعم مغلق عند الساعة الثامنة.","close","closing"]},{"unit":"Food, Drinks & Restaurants","q":["I am allergic ___ peanuts.","to","لدي حساسية من الفول السوداني.","with","for"]},{"unit":"Food, Drinks & Restaurants","q":["We shared a ___ of cake.","slice","تقاسمنا قطعة من الكعك.","bottle","bowl"]},{"unit":"Shopping, Clothes & Transport","q":["Can I try this jacket ___?","on","هل يمكنني تجربة هذه السترة؟","in","at"]},{"unit":"Shopping, Clothes & Transport","q":["The shop gives a ten percent ___.","discount","يقدم المتجر خصماً بنسبة عشرة بالمئة.","receipt","change"]},{"unit":"Shopping, Clothes & Transport","q":["Keep the ___ in case you return it.","receipt","احتفظ بالإيصال في حال إرجاعه.","ticket","wallet"]},{"unit":"Shopping, Clothes & Transport","q":["My train is ___ at platform three.","leaving","قطاري يغادر من الرصيف الثالث.","leave","leaves"]},{"unit":"Shopping, Clothes & Transport","q":["The bus is ___ by five minutes.","delayed","الحافلة متأخرة خمس دقائق.","early","fast"]},{"unit":"Shopping, Clothes & Transport","q":["I need a pair of comfortable ___.","shoes","أحتاج إلى حذاء مريح.","shirt","hat"]},{"unit":"Shopping, Clothes & Transport","q":["Where is the nearest bus ___?","station","أين أقرب محطة حافلات؟","ticket","driver"]},{"unit":"Shopping, Clothes & Transport","q":["This bag is too heavy to ___.","carry","هذه الحقيبة ثقيلة جداً لحملها.","wear","cost"]},{"unit":"Shopping, Clothes & Transport","q":["I would like to pay by ___.","card","أود الدفع بالبطاقة.","cashier","price"]},{"unit":"Shopping, Clothes & Transport","q":["The taxi fare was very ___.","cheap","كانت أجرة سيارة الأجرة رخيصة جداً.","cheaper","cheapest"]}],"street":[{"unit":"Street Names & Places","q":["A road in a city with buildings is often a ___.","street","الطريق داخل المدينة وبين المباني غالباً شارع.","forest","bridge"]},{"unit":"Street Names & Places","q":["A very wide road for fast traffic is a ___.","highway","الطريق الواسع السريع هو highway.","sidewalk","alley"]},{"unit":"Street Names & Places","q":["People walk on the ___.","sidewalk","يمشي الناس على الرصيف.","lane","engine"]},{"unit":"Street Names & Places","q":["Cars drive on the ___.","road","تقود السيارات على الطريق.","roof","crosswalk"]},{"unit":"Street Names & Places","q":["A road over a river is a ___.","bridge","الطريق فوق النهر جسر.","tunnel","corner"]},{"unit":"Street Names & Places","q":["Turn left at the ___.","corner","انعطف يساراً عند الزاوية.","center","station"]},{"unit":"Street Names & Places","q":["The bank is ___ the supermarket.","opposite","البنك مقابل السوبرماركت.","inside","behind"]},{"unit":"Street Names & Places","q":["Go straight ___.","ahead","تابع السير إلى الأمام.","back","inside"]},{"unit":"Street Names & Places","q":["A place where two roads meet is an ___.","intersection","المكان الذي يلتقي فيه طريقان تقاطع.","island","entrance"]},{"unit":"Street Names & Places","q":["The street name is on a ___.","street sign","اسم الشارع يظهر على لافتة الشارع.","traffic light","seat belt"]},{"unit":"Traffic Lights & Road Signs","q":["A red traffic light means ___.","stop","الإشارة الحمراء تعني قف.","go","speed up"]},{"unit":"Traffic Lights & Road Signs","q":["A green light means you may ___.","go","الإشارة الخضراء تسمح لك بالسير.","stop","park"]},{"unit":"Traffic Lights & Road Signs","q":["A yellow light tells drivers to ___.","slow down","الإشارة الصفراء تنبه السائق لتخفيف السرعة.","hurry up","turn around"]},{"unit":"Traffic Lights & Road Signs","q":["A STOP sign means you must ___.","stop","علامة STOP تعني يجب التوقف.","continue","overtake"]},{"unit":"Traffic Lights & Road Signs","q":["A sign with a walking person marks a ___.","pedestrian crossing","علامة الشخص تشير إلى ممر المشاة.","parking area","roundabout"]},{"unit":"Traffic Lights & Road Signs","q":["A speed limit sign shows the maximum ___.","speed","علامة حد السرعة توضح السرعة القصوى.","height","weight"]},{"unit":"Traffic Lights & Road Signs","q":["A warning sign tells drivers to be ___.","careful","علامة التحذير تطلب من السائق الانتباه.","sleepy","late"]},{"unit":"Traffic Lights & Road Signs","q":["A no-entry sign means do not ___.","enter","علامة ممنوع الدخول تعني لا تدخل.","stop","wait"]},{"unit":"Traffic Lights & Road Signs","q":["A one-way sign shows traffic moves in one ___.","direction","علامة اتجاه واحد تعني السير باتجاه واحد.","color","speed"]},{"unit":"Traffic Lights & Road Signs","q":["A slippery road sign warns that the road may be ___.","slippery","علامة الطريق الزلق تحذر من انزلاق الطريق.","crowded","closed"]},{"unit":"Directions & Pedestrians","q":["To find a place, ask for ___.","directions","للعثور على مكان اطلب الاتجاهات.","prices","tickets"]},{"unit":"Directions & Pedestrians","q":["Turn right at the next ___.","street","انعطف يميناً عند الشارع التالي.","breakfast","window"]},{"unit":"Directions & Pedestrians","q":["Cross the road at the pedestrian ___.","crossing","اعبر الطريق عند ممر المشاة.","garage","stationery"]},{"unit":"Directions & Pedestrians","q":["Look both ways before you ___.","cross","انظر في الاتجاهين قبل العبور.","driveway","park"]},{"unit":"Directions & Pedestrians","q":["The opposite of left is ___.","right","عكس اليسار هو اليمين.","straight","behind"]},{"unit":"Directions & Pedestrians","q":["The bus stop is ___ the pharmacy.","near","موقف الحافلة قريب من الصيدلية.","between","under"]},{"unit":"Directions & Pedestrians","q":["Walk ___ the street, not in the road.","along","امشِ بمحاذاة الشارع وليس في الطريق.","across","inside"]},{"unit":"Directions & Pedestrians","q":["A map helps you find your ___.","location","الخريطة تساعدك على معرفة موقعك.","temperature","ticket"]},{"unit":"Directions & Pedestrians","q":["At the roundabout, take the second ___.","exit","في الدوار خذ المخرج الثاني.","entrance","bridge"]},{"unit":"Directions & Pedestrians","q":["Follow the signs to the city ___.","center","اتبع اللافتات إلى وسط المدينة.","ceiling","kitchen"]},{"unit":"Vehicles & Public Transport","q":["A person who drives a bus is a ___.","driver","الشخص الذي يقود الحافلة سائق.","passenger","pedestrian"]},{"unit":"Vehicles & Public Transport","q":["You wait for a bus at a bus ___.","stop","تنتظر الحافلة في موقف الحافلات.","crossing","garage"]},{"unit":"Vehicles & Public Transport","q":["A train leaves from a train ___.","station","ينطلق القطار من محطة القطار.","sidewalk","junction"]},{"unit":"Vehicles & Public Transport","q":["You buy a bus ___ before travelling.","ticket","تشتري تذكرة الحافلة قبل السفر.","helmet","mirror"]},{"unit":"Vehicles & Public Transport","q":["A taxi can take you to your ___.","destination","سيارة الأجرة توصلك إلى وجهتك.","traffic","engine"]},{"unit":"Vehicles & Public Transport","q":["The car's front glass is the ___.","windshield","الزجاج الأمامي للسيارة هو windshield.","trunk","wheel"]},{"unit":"Vehicles & Public Transport","q":["A person walking beside a road is a ___.","pedestrian","الشخص الذي يمشي بجانب الطريق هو مشاة.","mechanic","cyclist"]},{"unit":"Vehicles & Public Transport","q":["The place to leave your car is a car ___.","park","مكان ترك السيارة هو موقف سيارات.","station","crossing"]},{"unit":"Vehicles & Public Transport","q":["A helmet protects your ___.","head","الخوذة تحمي رأسك.","hands","knees"]},{"unit":"Vehicles & Public Transport","q":["Traffic is very heavy. There is a ___.","traffic jam","الازدحام الشديد يسمى traffic jam.","bus stop","speed limit"]},{"unit":"Driving, Safety & Emergencies","q":["Always wear your seat ___.","belt","اربط حزام الأمان دائماً.","cover","button"]},{"unit":"Driving, Safety & Emergencies","q":["Do not use your phone while ___.","driving","لا تستخدم هاتفك أثناء القيادة.","sleeping","walking"]},{"unit":"Driving, Safety & Emergencies","q":["An ambulance is for a medical ___.","emergency","سيارة الإسعاف للحالات الطبية الطارئة.","journey","holiday"]},{"unit":"Driving, Safety & Emergencies","q":["If your car breaks down, call for ___.","help","إذا تعطلت سيارتك اطلب المساعدة.","dessert","directions"]},{"unit":"Driving, Safety & Emergencies","q":["A mechanic repairs ___.","cars","الميكانيكي يصلح السيارات.","signs","tickets"]},{"unit":"Driving, Safety & Emergencies","q":["You must not park in front of a fire ___.","hydrant","يمنع الوقوف أمام صنبور إطفاء الحريق.","bakery","school"]},{"unit":"Driving, Safety & Emergencies","q":["Use the indicator before you ___.","turn","استخدم الغماز قبل الانعطاف.","sleep","refuel"]},{"unit":"Driving, Safety & Emergencies","q":["A pedestrian should wait for the green ___.","signal","على المشاة انتظار إشارة العبور الخضراء.","engine","mirror"]},{"unit":"Driving, Safety & Emergencies","q":["In an accident, stay calm and call ___.","emergency services","في الحادث حافظ على هدوئك واتصل بالطوارئ.","a restaurant","a taxi"]},{"unit":"Driving, Safety & Emergencies","q":["A seat belt helps keep passengers ___.","safe","حزام الأمان يساعد على إبقاء الركاب بأمان.","hungry","late"]},{"unit":"Street Names & Places","q":["A small road between buildings can be an ___.","alley","الطريق الصغير بين المباني قد يكون زقاقاً.","avenue","highway"]},{"unit":"Street Names & Places","q":["The post office is on the main ___.","street","مكتب البريد في الشارع الرئيسي.","roof","engine"]},{"unit":"Street Names & Places","q":["A place where people borrow books is a ___.","library","المكان الذي يستعير منه الناس الكتب هو المكتبة.","bakery","garage"]},{"unit":"Street Names & Places","q":["You can buy medicine at a ___.","pharmacy","يمكنك شراء الدواء من الصيدلية.","stadium","museum"]},{"unit":"Street Names & Places","q":["The police station is ___ the hospital.","near","مركز الشرطة بالقرب من المستشفى.","inside","above"]},{"unit":"Street Names & Places","q":["A road with many shops is a shopping ___.","district","المنطقة التي تضم متاجر كثيرة هي منطقة التسوق.","engine","crossing"]},{"unit":"Street Names & Places","q":["The building entrance is around the ___.","corner","مدخل المبنى حول الزاوية.","traffic","station"]},{"unit":"Street Names & Places","q":["A place where planes land is an ___.","airport","المكان الذي تهبط فيه الطائرات هو المطار.","harbor","garage"]},{"unit":"Street Names & Places","q":["The public garden is across the ___.","street","الحديقة العامة على الجانب الآخر من الشارع.","ceiling","bridge"]},{"unit":"Street Names & Places","q":["A road under a mountain may pass through a ___.","tunnel","قد يمر الطريق تحت الجبل عبر نفق.","sidewalk","square"]},{"unit":"Traffic Lights & Road Signs","q":["A triangular road sign often gives a ___.","warning","إشارة الطريق المثلثة غالباً تعطي تحذيراً.","welcome","direction"]},{"unit":"Traffic Lights & Road Signs","q":["A sign with a red circle may show a ___.","restriction","قد تشير الدائرة الحمراء إلى قيد أو منع.","destination","service"]},{"unit":"Traffic Lights & Road Signs","q":["A pedestrian light shows when it is safe to ___.","cross","إشارة المشاة توضح متى يكون العبور آمناً.","park","reverse"]},{"unit":"Traffic Lights & Road Signs","q":["A school zone sign asks drivers to reduce ___.","speed","إشارة منطقة المدارس تطلب تخفيف السرعة.","noise","fuel"]},{"unit":"Traffic Lights & Road Signs","q":["A blue sign often gives road ___.","information","الإشارة الزرقاء غالباً تقدم معلومات الطريق.","weather","payment"]},{"unit":"Traffic Lights & Road Signs","q":["A U-turn sign tells drivers where they can turn ___.","around","إشارة الالتفاف توضح مكان الدوران والعودة.","inside","down"]},{"unit":"Traffic Lights & Road Signs","q":["A railway crossing sign warns about ___.","trains","إشارة تقاطع السكة تحذر من القطارات.","bicycles","shops"]},{"unit":"Traffic Lights & Road Signs","q":["A no-parking sign means parking is not ___.","allowed","إشارة ممنوع الوقوف تعني أن الوقوف غير مسموح.","painted","driven"]},{"unit":"Traffic Lights & Road Signs","q":["At a flashing red light, drivers must ___.","stop","عند الإشارة الحمراء الوامضة يجب على السائقين التوقف.","accelerate","overtake"]},{"unit":"Traffic Lights & Road Signs","q":["A detour sign shows another ___.","route","إشارة التحويلة توضح طريقاً بديلاً.","vehicle","signal"]},{"unit":"Directions & Pedestrians","q":["Go past the bank and turn ___.","left","تجاوز البنك ثم انعطف يساراً.","straight","behind"]},{"unit":"Directions & Pedestrians","q":["The museum is at the end of this ___.","road","المتحف في نهاية هذا الطريق.","meal","ticket"]},{"unit":"Directions & Pedestrians","q":["Walk across the bridge to reach the other ___.","side","اعبر الجسر للوصول إلى الجانب الآخر.","corner","floor"]},{"unit":"Directions & Pedestrians","q":["The hotel is between the bank and the ___.","museum","الفندق بين البنك والمتحف.","traffic","driver"]},{"unit":"Directions & Pedestrians","q":["Keep to the right-hand side of the ___.","sidewalk","التزم بالجانب الأيمن من الرصيف.","engine","highway"]},{"unit":"Directions & Pedestrians","q":["Use the pedestrian bridge to cross the ___.","road","استخدم جسر المشاة لعبور الطريق.","station","building"]},{"unit":"Directions & Pedestrians","q":["The nearest ATM is two blocks ___.","away","أقرب جهاز صراف يبعد شارعين.","over","under"]},{"unit":"Directions & Pedestrians","q":["Follow this road until you ___ the roundabout.","reach","اتبع هذا الطريق حتى تصل إلى الدوار.","arrive","take"]},{"unit":"Directions & Pedestrians","q":["The bus stop is directly ___ the school.","outside","موقف الحافلة خارج المدرسة مباشرة.","between","through"]},{"unit":"Directions & Pedestrians","q":["Please do not walk while looking at your ___.","phone","يرجى عدم المشي وأنت تنظر إلى هاتفك.","map","shoes"]},{"unit":"Vehicles & Public Transport","q":["A motorcycle has two ___.","wheels","للدراجة النارية عجلتان.","doors","windows"]},{"unit":"Vehicles & Public Transport","q":["A bicycle lane is for ___.","cyclists","مسار الدراجات مخصص لراكبي الدراجات.","drivers","pilots"]},{"unit":"Vehicles & Public Transport","q":["Passengers wait on the train ___.","platform","ينتظر الركاب على رصيف القطار.","highway","sidewalk"]},{"unit":"Vehicles & Public Transport","q":["A vehicle that carries many passengers is a ___.","bus","المركبة التي تنقل ركاباً كثيرين هي الحافلة.","scooter","bicycle"]},{"unit":"Vehicles & Public Transport","q":["You should validate your travel ___ before boarding.","ticket","يجب التحقق من تذكرة السفر قبل الصعود.","mirror","helmet"]},{"unit":"Vehicles & Public Transport","q":["A ferry carries people across ___.","water","تنقل العبّارة الناس عبر الماء.","desert","roads"]},{"unit":"Vehicles & Public Transport","q":["The driver stopped at the petrol ___.","station","توقف السائق عند محطة الوقود.","crossing","library"]},{"unit":"Vehicles & Public Transport","q":["A car's rear-view mirror helps you see ___.","behind","تساعدك المرآة الخلفية على رؤية ما خلفك.","ahead","below"]},{"unit":"Vehicles & Public Transport","q":["The subway travels mostly ___.","underground","يسير مترو الأنفاق غالباً تحت الأرض.","upstairs","outdoors"]},{"unit":"Vehicles & Public Transport","q":["A passenger should give a seat to an elderly ___.","person","ينبغي للراكب إفساح المقعد لشخص مسن.","vehicle","street"]},{"unit":"Driving, Safety & Emergencies","q":["Check your mirrors before changing ___.","lanes","افحص المرايا قبل تغيير المسارات.","roads","lights"]},{"unit":"Driving, Safety & Emergencies","q":["Never drive when you feel ___.","tired","لا تقد السيارة أبداً عندما تشعر بالتعب.","ready","hungry"]},{"unit":"Driving, Safety & Emergencies","q":["In heavy rain, keep a safe ___ distance.","following","في المطر الغزير حافظ على مسافة متابعة آمنة.","parking","walking"]},{"unit":"Driving, Safety & Emergencies","q":["A warning triangle makes your stopped car more ___.","visible","مثلث التحذير يجعل سيارتك المتوقفة أكثر وضوحاً.","comfortable","silent"]},{"unit":"Driving, Safety & Emergencies","q":["You should slow down near a school ___.","crossing","يجب تخفيف السرعة قرب ممر المدرسة.","garage","engine"]},{"unit":"Driving, Safety & Emergencies","q":["If someone is injured, call an ___.","ambulance","إذا أصيب شخص فاتصل بسيارة إسعاف.","airplane","bus"]},{"unit":"Driving, Safety & Emergencies","q":["Do not drive through a flooded ___.","road","لا تقد عبر طريق مغمور بالمياه.","station","bridge"]},{"unit":"Driving, Safety & Emergencies","q":["Keep an emergency kit in your ___.","car","احتفظ بحقيبة طوارئ في سيارتك.","kitchen","office"]},{"unit":"Driving, Safety & Emergencies","q":["Before opening the door, check for passing ___.","cyclists","قبل فتح الباب تحقق من مرور راكبي الدراجات.","clouds","shops"]},{"unit":"Driving, Safety & Emergencies","q":["Always obey the traffic ___.","rules","التزم دائماً بقواعد المرور.","colors","prices"]}]}

 const $=id=>document.getElementById(id);
 const wordMeanings={hello:'مرحباً',hi:'أهلاً',please:'من فضلك',thank:'شكراً',you:'أنت',your:'ـك',name:'اسم',my:'لي',is:'يكون',are:'تكون',am:'أكون',i:'أنا',we:'نحن',they:'هم',he:'هو',she:'هي',it:'هو/هي',a:'أداة نكرة',an:'أداة نكرة',the:'الـ',to:'إلى',of:'من',in:'في',on:'على',at:'عند',for:'لأجل',with:'مع',from:'من',and:'و',or:'أو',but:'لكن',where:'أين',what:'ماذا',how:'كيف',when:'متى',who:'من',why:'لماذا',this:'هذا',that:'ذلك',meet:'أقابل',friend:'صديق',family:'عائلة',mother:'أم',father:'أب',brother:'أخ',sister:'أخت',grandfather:'جد',cousin:'ابن/ابنة العم أو الخال',children:'أطفال',home:'منزل',house:'بيت',room:'غرفة',bedroom:'غرفة نوم',kitchen:'مطبخ',window:'نافذة',door:'باب',table:'طاولة',wake:'أستيقظ',up:'أعلى',brush:'أنظف بالفرشاة',teeth:'أسنان',breakfast:'فطور',lunch:'غداء',dinner:'عشاء',shower:'استحمام',clean:'أنظف',read:'أقرأ',reading:'القراءة',work:'عمل',school:'مدرسة',water:'ماء',food:'طعام',bread:'خبز',rice:'أرز',apple:'تفاحة',fruit:'فاكهة',tea:'شاي',coffee:'قهوة',juice:'عصير',milk:'حليب',menu:'قائمة الطعام',bill:'فاتورة',order:'طلب',waiter:'نادل',restaurant:'مطعم',salt:'ملح',sugar:'سكر',meat:'لحم',vegetarian:'نباتي',shirt:'قميص',jacket:'سترة',shoes:'حذاء',size:'مقاس',price:'سعر',cheap:'رخيص',expensive:'غالي',discount:'خصم',receipt:'إيصال',shop:'متجر',bus:'حافلة',train:'قطار',car:'سيارة',taxi:'سيارة أجرة',ticket:'تذكرة',station:'محطة',driver:'سائق',road:'طريق',street:'شارع',sidewalk:'رصيف',highway:'طريق سريع',bridge:'جسر',tunnel:'نفق',corner:'زاوية',intersection:'تقاطع',sign:'لافتة',stop:'قف/توقف',go:'اذهب',left:'يسار',right:'يمين',straight:'مستقيم',ahead:'إلى الأمام',cross:'اعبر',crossing:'ممر عبور',pedestrian:'مشاة',traffic:'مرور',light:'ضوء/إشارة',red:'أحمر',green:'أخضر',yellow:'أصفر',speed:'سرعة',warning:'تحذير',careful:'حذر',enter:'ادخل',direction:'اتجاه',directions:'اتجاهات',near:'قريب',opposite:'مقابل',behind:'خلف',outside:'خارج',inside:'داخل',roundabout:'دوار',exit:'مخرج',vehicle:'مركبة',passenger:'راكب',platform:'رصيف محطة',airport:'مطار',library:'مكتبة',pharmacy:'صيدلية',hospital:'مستشفى',museum:'متحف',bank:'بنك',park:'حديقة/موقف',wheels:'عجلات',cyclists:'راكبو الدراجات',helmet:'خوذة',safe:'آمن',safety:'سلامة',emergency:'طوارئ',ambulance:'سيارة إسعاف',help:'مساعدة',accident:'حادث',tired:'متعب',rain:'مطر',rules:'قواعد',lanes:'مسارات',phone:'هاتف',call:'اتصل',turn:'انعطف',arrive:'يصل',reach:'يصل إلى',away:'بعيداً',visible:'مرئي',allowed:'مسموح',route:'مسار',restriction:'قيد/منع',information:'معلومات',delayed:'متأخر',leaving:'مغادر',carry:'يحمل',card:'بطاقة',two:'اثنان',else:'آخر',closed:'مغلق',allergic:'لديه حساسية',slice:'قطعة',baked:'مخبوز',tell:'أخبر',speak:'يتحدث',english:'الإنجليزية',introduce:'يعرّف',later:'لاحقاً',goodbye:'وداعاً',welcome:'مرحباً بك',ask:'يسأل',helpful:'متعاون',supports:'يدعم',neighborhood:'حي',week:'أسبوع',grandmother:'جدة',tidies:'يرتب',catch:'يلحق/يستقل',dressed:'يرتدي ملابسه',beside:'بجانب',off:'إيقاف',arrives:'يصل',prefer:'يفضل',brought:'أحضر',freshly:'حديثاً',anything:'أي شيء',peanuts:'فول سوداني',discount:'خصم',wedding:'زفاف',airport:'مطار',alley:'زقاق',post:'بريد',office:'مكتب',borrow:'يستعير',books:'كتب',medicine:'دواء',district:'منطقة',planes:'طائرات',land:'تهبط',triangular:'مثلث',restriction:'قيد',detour:'تحويلة',railway:'سكة حديد',trains:'قطارات',flashing:'وامض',accelerate:'يسرّع',overtake:'يتجاوز',past:'متجاوزاً',end:'نهاية',side:'جانب',block:'شارع/مربع سكني',underground:'تحت الأرض',ferry:'عبّارة',petrol:'وقود',mirror:'مرآة',rear:'خلفي',view:'رؤية',subway:'مترو',elderly:'مسن',person:'شخص',following:'متابعة',distance:'مسافة',triangle:'مثلث',opening:'فتح',passing:'مارّ',clouds:'غيوم',colors:'ألوان',prices:'أسعار',around:'حول',wheels:'عجلات',platform:'رصيف',information:'معلومات',visible:'واضح',tired:'متعب'};
 function speakSentence(sentence){
  if(!('speechSynthesis'in window))return;
  speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(sentence);utterance.lang='en-US';utterance.rate=.88;utterance.pitch=1.15;
  const voices=speechSynthesis.getVoices();
  const female=voices.find(v=>/female|samantha|ava|jenny|aria|zira|susan|karen|victoria|google us english/i.test(v.name));
  if(female)utterance.voice=female;
  speechSynthesis.speak(utterance);
 }
 function renderClickableSentence(q){
  const full=q[0].replace(/___|_{2,}/g,q[1]),target=$('curriculumQuestion');target.replaceChildren();
  full.split(/(\s+)/).forEach(part=>{
   if(!part.trim()){target.append(document.createTextNode(part));return;}
   const clean=part.toLowerCase().replace(/^[^a-z]+|[^a-z']+$/g,'');
   const span=document.createElement('button');span.type='button';span.className='curriculum-word';span.textContent=part;
   span.addEventListener('click',()=>{
    const key=clean.replace(/'s$/,'');$('curriculumWordTranslation').textContent=part.trim()+' = '+(wordMeanings[key]||'معنى الكلمة ضمن الجملة');
    $('curriculumWordTranslation').hidden=false;
   });
   target.append(span);
  });
  $('curriculumWordTranslation').hidden=true;
 }

 window.LEXORA_PRACTICE_BANK=bank;
 const icons=['👋','👨‍👩‍👧','🏠','🍽️','🛍️','📍','🚦','🚶','🚌','🚘'];
 const colors=['#35c5a0','#f0a65b','#78a9f5','#f18b75','#c69af4','#75b8d9','#f0bd55','#66c79b','#7ca6e8','#e58c9b'];
 const units=root.querySelector('#curriculumUnits');
 let active='daily',activeUnit='',index=0,score=0,order=[],answered=false;
 [['daily','الحياة اليومية','☀️'],['street','الشارع والمواصلات','🚦']].forEach(([key,label,icon])=>{
  const group=document.createElement('section');group.className='curriculum-unit-group';
  const heading=document.createElement('div');heading.className='curriculum-group-heading';
  const title=document.createElement('h3');title.textContent=label;
  const mark=document.createElement('span');mark.textContent=icon;mark.className='curriculum-group-mark';heading.append(mark,title);group.append(heading);
  const grid=document.createElement('div');grid.className='curriculum-unit-grid';
  [...new Set(bank[key].map(item=>item.unit))].forEach((name,i)=>{
   const n=key==='daily'?i:i+5,card=document.createElement('button');card.type='button';card.className='curriculum-unit-card';
   const iconBox=document.createElement('span');iconBox.className='curriculum-unit-icon';iconBox.style.setProperty('--unit-accent',colors[n]);iconBox.textContent=icons[n];
   const copy=document.createElement('span');copy.className='curriculum-unit-copy';
   const h=document.createElement('strong');h.textContent=name;const meta=document.createElement('small');meta.textContent=bank[key].filter(item=>item.unit===name).length+' تحدياً · المستوى A1';
   const arrow=document.createElement('span');arrow.className='curriculum-unit-arrow';arrow.textContent='←';
   copy.append(h,meta);card.append(iconBox,copy,arrow);card.addEventListener('click',()=>start(key,name));grid.append(card);
  });
  group.append(grid);units.append(group);
 });
 function showQuestion(){
  answered=false;const q=order[index].q;
  $('curriculumUnitLabel').textContent=activeUnit;$('curriculumCount').textContent=(index+1)+' / '+order.length;
  $('curriculumProgress').style.width=(index/order.length*100)+'%';
  $('curriculumArabic').textContent=q[2];$('curriculumKind').textContent='VOCABULARY';renderClickableSentence(q);
  $('curriculumFeedback').hidden=true;$('curriculumNext').hidden=true;
  const choices=[q[1],q[3],q[4]].sort(()=>Math.random()-.5),box=$('curriculumOptions');box.replaceChildren();
  choices.forEach(choice=>{const b=document.createElement('button');b.type='button';b.className='curriculum-option';b.textContent=choice;b.addEventListener('click',()=>answer(choice,b));box.append(b);});
  // Pronunciation starts only when the learner taps a word.
 }
 function answer(choice,button){
  if(answered)return;answered=true;const q=order[index].q,ok=choice===q[1];if(ok)score++;
  $('curriculumOptions').querySelectorAll('button').forEach(b=>{b.disabled=true;if(b.textContent===q[1])b.classList.add('correct');else if(b===button)b.classList.add('incorrect');});
  const f=$('curriculumFeedback');f.hidden=false;f.textContent=(ok?'إجابة صحيحة! أحسنت. ':'ليست الإجابة الصحيحة. ')+'الإجابة: '+q[1]+'. '+q[2];
  speakSentence(q[0].replace(/___|_{2,}/g,q[1]));
  $('curriculumNext').textContent=index===order.length-1?'عرض النتيجة':'التحدي التالي ←';$('curriculumNext').hidden=false;
 }
 function start(key,unit){
  active=key;activeUnit=unit;index=0;score=0;order=bank[key].filter(item=>item.unit===unit);
  $('curriculumPlayer').hidden=false;units.hidden=true;showQuestion();
  $('curriculumPlayer').scrollIntoView({behavior:'smooth',block:'start'});
 }
 function finish(){
  $('curriculumQuestion').textContent='أكملت الوحدة!';$('curriculumArabic').textContent='نتيجتك: '+score+' من '+order.length+' ('+Math.round(score/order.length*100)+'%).';
  $('curriculumOptions').replaceChildren();$('curriculumFeedback').hidden=false;
  $('curriculumFeedback').textContent=score>=8?'أداء ممتاز! انتقل إلى وحدة أخرى.':'أحسنت على إكمال التدريب. أعد المحاولة لتثبيت المفردات.';
  $('curriculumNext').textContent='إعادة الوحدة';$('curriculumNext').hidden=false;$('curriculumProgress').style.width='100%';
 }
 $('curriculumNext').addEventListener('click',()=>{
  if($('curriculumNext').textContent==='إعادة الوحدة'){start(active,activeUnit);return;}
  if(index<order.length-1){index++;showQuestion();}else finish();
 });
 $('curriculumBack').addEventListener('click',()=>{
  if('speechSynthesis'in window)speechSynthesis.cancel();$('curriculumPlayer').hidden=true;units.hidden=false;
  units.scrollIntoView({behavior:'smooth',block:'start'});
 });
})();

(()=>{
 const bank=window.LEXORA_PRACTICE_BANK;if(!bank)return;const el=id=>document.getElementById(id),shelf=el('cartoonShelf'),player=el('cartoonChallengePlayer');if(!shelf||shelf.dataset.ready)return;shelf.dataset.ready='1';
 const worlds={daily:{title:'أسرار الحياة اليومية',items:bank.daily},street:{title:'مغامرة في المدينة',items:bank.street},mix:{title:'سرّ المدينة الغامض',items:bank.daily.slice(0,50).concat(bank.street.slice(0,50))}};
 let active='daily',items=[],n=0,points=0,locked=false;
 function say(line){if(!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(line);u.lang='en-US';u.rate=.88;u.pitch=1.12;const v=speechSynthesis.getVoices().find(x=>/^en-US/i.test(x.lang)&&/female|samantha|zira|aria|jenny/i.test(x.name));if(v)u.voice=v;speechSynthesis.speak(u);}
 function draw(){locked=false;const q=items[n].q;el('cartoonActiveTitle').textContent=worlds[active].title;el('cartoonCounter').textContent=(n+1)+' / 100';el('cartoonProgress').style.width=(n/100*100)+'%';el('cartoonPrompt').textContent=q[0];el('cartoonArabic').textContent=q[2];el('cartoonResult').hidden=true;el('cartoonNext').hidden=true;const box=el('cartoonChoices');box.replaceChildren();[q[1],q[3],q[4]].sort(()=>Math.random()-.5).forEach(word=>{const b=document.createElement('button');b.className='cartoon-choice';b.textContent=word;b.onclick=()=>{if(locked)return;locked=true;const ok=word===q[1];if(ok){points++;window.dispatchEvent(new CustomEvent('lexora:xp',{detail:{amount:2}}));}box.querySelectorAll('button').forEach(x=>{x.disabled=true;if(x.textContent===q[1])x.classList.add('correct');else if(x===b)x.classList.add('wrong');});el('cartoonResult').hidden=false;el('cartoonResult').textContent=(ok?'إجابة صحيحة! ':'الإجابة الصحيحة: ')+q[1]+' — '+q[2];say(q[0].replace(/___|_{2,}/g,q[1]));el('cartoonNext').hidden=false;el('cartoonNext').textContent=n===99?'عرض النتيجة':'المشهد التالي ←';};box.append(b);});}
 shelf.querySelectorAll('[data-cartoon]').forEach(b=>b.onclick=()=>{active=b.dataset.cartoon;items=worlds[active].items.slice(0,100);n=0;points=0;shelf.hidden=true;player.hidden=false;draw();player.scrollIntoView({behavior:'smooth',block:'start'});});
 el('cartoonNext').onclick=()=>{if(n<99){n++;draw();}else{el('cartoonPrompt').textContent='انتهت المغامرة!';el('cartoonArabic').textContent='نتيجتك: '+points+' من 100';el('cartoonChoices').replaceChildren();el('cartoonResult').hidden=false;el('cartoonResult').textContent='أكملت جميع تحديات هذا العالم.';el('cartoonNext').hidden=true;}};
 el('cartoonBack').onclick=()=>{if(window.speechSynthesis)speechSynthesis.cancel();player.hidden=true;shelf.hidden=false;};
})();
(()=>{
 const bank=window.LEXORA_PRACTICE_BANK;if(!bank)return;const el=id=>document.getElementById(id),intro=el('detectiveIntro'),player=el('detectivePlayer');if(!intro||player.dataset.ready)return;player.dataset.ready='1';
 const sets=[
  {questions:['What is your name?','Could you tell me your name?','How should I address you?','What name do you use?','May I know your full name?','Please introduce yourself.','What should I call you?','Can you state your name?','Who are you?','Tell me your name, please.'],ar:'ما اسمك؟',values:['Adam','Sara','Omar','Mia','Lina','Noah','Yara','Max','Ali','Emma'],make:v=>'My name is '+v+'.'},
  {questions:['Where are you from?','Which country are you from?','What country do you come from?','Can you tell me your country?','Where is your home country?','Which nation do you belong to?','What is your country of origin?','Where did you come from?','Which country do you represent?','Tell me where you are from.'],ar:'من أين أنت؟',values:['Jordan','Canada','Egypt','Spain','Japan','Italy','Brazil','France','Turkey','Australia'],make:v=>'I am from '+v+'.'},
  {questions:['Where do you live?','What city is your home in?','Which town do you live in?','Can you tell me your home city?','Where is your home?','What is your current city?','Which city do you stay in?','Where can we find you?','What city are you based in?','Tell me where you live.'],ar:'أين تسكن؟',values:['Amman','Aqaba','Irbid','London','Toronto','Cairo','Madrid','Tokyo','Rome','Paris'],make:v=>'I live in '+v+'.'},
  {questions:['What is your job?','What do you do for a living?','What is your profession?','Where do you work?','What kind of work do you do?','Are you a student or do you work?','What is your occupation?','How do you earn a living?','What is your role at work?','Tell me about your job.'],ar:'ما مهنتك؟',values:['a teacher','a student','a doctor','a driver','a chef','a photographer','an engineer','a nurse','a pilot','a designer'],make:v=>'I am '+v+'.'},
  {questions:['What time do you wake up?','When do you usually get up?','How early do you start your day?','At what time do you leave your bed?','When does your day begin?','What time do you get out of bed?','Do you wake up early? What time?','When do you normally wake up?','What is your usual wake-up time?','Tell me when you wake up.'],ar:'متى تستيقظ؟',values:['six o’clock','six thirty','seven o’clock','seven thirty','eight o’clock','five thirty','nine o’clock','half past six','quarter to seven','quarter past eight'],make:v=>'I wake up at '+v+'.'},
  {questions:['What did you see?','Can you describe what you saw?','What caught your attention?','What object did you notice?','Did you see a vehicle or a person?','What was in front of you?','Can you tell me what appeared?','What did you notice at the scene?','Describe the thing you saw.','Tell me exactly what you saw.'],ar:'ماذا رأيت؟',values:['a red car','a tall man','a black bag','a broken window','a blue bicycle','a small dog','a bright light','a white van','a green jacket','a silver key'],make:v=>'I saw '+v+'.'},
  {questions:['Where were you last night?','What place did you visit yesterday evening?','Can you confirm your location last night?','Which place were you at after sunset?','Where did you spend your evening?','What was your last location yesterday?','Were you at the station or somewhere else?','Where can we verify you were?','Which place did you visit last night?','Tell me where you were yesterday night.'],ar:'أين كنت الليلة الماضية؟',values:['the station','the café','the park','the library','the hotel','the supermarket','the school','the bus stop','the museum','the bank'],make:v=>'I was at '+v+'.'},
  {questions:['How did you get here?','Which transport did you use?','Did you come by bus or taxi?','How did you travel to this place?','What vehicle brought you here?','Did you walk or take transport?','How was your journey here?','Which way did you arrive?','What did you use to reach us?','Tell me how you got here.'],ar:'كيف وصلت إلى هنا؟',values:['by bus','by taxi','by train','by bicycle','on foot','by car','by subway','by motorcycle','by tram','by ferry'],make:v=>'I came '+v+'.'},
  {questions:['Who was with you?','Who accompanied you?','Were you alone or with someone?','Can you name the person beside you?','Who came with you?','Who was your companion?','Which person was at your side?','Did a friend or relative join you?','Who can confirm your story?','Tell me who was with you.'],ar:'من كان معك؟',values:['my brother','my sister','my friend','my father','my mother','my colleague','my cousin','my neighbor','my teacher','my partner'],make:v=>'I was with '+v+'.'},
  {questions:['Why were you there?','What was your reason for going there?','Why did you visit that place?','What were you trying to do there?','Were you meeting someone?','What brought you to that location?','What was your purpose there?','Why did you go to that area?','What did you need at that place?','Explain why you were there.'],ar:'لماذا كنت هناك؟',values:['to meet a friend','to buy some food','to visit my family','to go to work','to study English','to catch a train','to ask for help','to see a doctor','to find a hotel','to return a book'],make:v=>'I was there '+v+'.'}
 ];
 const data=sets.flatMap((set)=>set.values.map((value,i)=>({q:set.questions[i],a:set.make(value),ar:set.ar,bad:[]})));
 let order=[],n=0,score=0,chosen=[],locked=false;const shuffle=a=>a.map(x=>({x,r:Math.random()})).sort((a,b)=>a.r-b.r).map(y=>y.x);
 function stop(){}
 function say(line){if(!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(line);u.lang='en-US';u.rate=.88;u.pitch=1.13;const v=speechSynthesis.getVoices().find(x=>/^en-US/i.test(x.lang)&&/female|samantha|zira|aria|jenny/i.test(x.name));if(v)u.voice=v;speechSynthesis.speak(u);}
 function renderAnswer(){const box=el('detectiveBuiltAnswer');box.replaceChildren();chosen.forEach((t,i)=>{const b=document.createElement('button');b.className='detective-answer-tile';b.textContent=t.word+' ×';b.onclick=()=>{if(locked)return;chosen.splice(i,1);renderAnswer();};box.append(b);});el('detectiveKeyboard').querySelectorAll('button').forEach(b=>{b.disabled=chosen.some(x=>String(x.id)===b.dataset.tile);});}
 function submit(){if(locked)return;locked=true;const c=order[n],answer=chosen.map(x=>x.word).join(' '),ok=answer.toLowerCase()===c.a.toLowerCase();if(ok){score++;window.dispatchEvent(new CustomEvent('lexora:xp',{detail:{amount:2}}));}el('detectiveKeyboard').querySelectorAll('button').forEach(b=>b.disabled=true);el('detectiveSubmit').disabled=true;el('detectiveFeedback').hidden=false;el('detectiveFeedback').textContent=(ok?'إجابة صحيحة! ':'ليست صحيحة. ')+'الإجابة الصحيحة: '+c.a;say(c.a);el('detectiveNext').hidden=false;el('detectiveNext').textContent=n===99?'إنهاء التحقيق':'السؤال التالي ←';}
 function draw(){chosen=[];locked=false;const c=order[n];el('detectiveProgressText').textContent='السؤال '+(n+1)+' من 100';el('detectiveMeter').style.width=(n/100*100)+'%';el('detectiveQuestion').textContent='أكمل إفادة الشاهد: '+c.q;el('detectiveArabic').textContent=c.ar+' · كوّن ردّك باللغة الإنجليزية.';el('detectiveFeedback').hidden=true;el('detectiveNext').hidden=true;el('detectiveSubmit').disabled=false;renderAnswer();const correct=c.a.trim().split(/\s+/);const decoys=shuffle(data.flatMap(x=>x.a.split(/\s+/)).filter(w=>!correct.includes(w)&&w.length>1));const pool=shuffle(correct.concat([...new Set(decoys)].slice(0,4)));const box=el('detectiveKeyboard');box.replaceChildren();pool.forEach((word,id)=>{const b=document.createElement('button');b.className='detective-key';b.textContent=word;b.dataset.tile=id;b.onclick=()=>{if(locked||chosen.some(x=>x.id===id))return;chosen.push({word,id});renderAnswer();};box.append(b);});}
 function start(){stop();order=shuffle(data);n=0;score=0;intro.hidden=true;el('detectiveFinish').hidden=true;player.hidden=false;draw();player.scrollIntoView({behavior:'smooth',block:'start'});}
 el('detectiveStart').onclick=start;el('detectiveReplay').onclick=start;el('detectiveSubmit').onclick=()=>submit();el('detectiveClear').onclick=()=>{if(!locked){chosen=[];renderAnswer();}};el('detectiveExit').onclick=()=>{if(window.speechSynthesis)speechSynthesis.cancel();player.hidden=true;intro.hidden=false;};el('detectiveNext').onclick=()=>{if(n<99){n++;draw();}else{stop();player.hidden=true;el('detectiveFinish').hidden=false;el('detectiveFinalScore').textContent='نتيجتك: '+score+' من 100';}};
})();


// LEXORA horizontal learning worlds, learner XP and gated games.
(()=>{
 const main=document.querySelector('main');if(!main||main.dataset.swipeReady)return;main.dataset.swipeReady='1';
 const groups=[
  {id:'storiesPage',title:'عالم القصص',icon:'📖',ids:['gameWorld','cartoonLibrary']},
  {id:'learningPage',title:'الدروس التعليمية',icon:'🎓',ids:['hero','courses','method','levels','pro','curriculum']},
  {id:'gamesPage',title:'عالم الألعاب',icon:'🎮',ids:['detectiveGame']}
 ];
 const shell=document.createElement('div');shell.className='learning-swipe-shell';
 const nav=document.createElement('div');nav.className='learning-swipe-nav';nav.setAttribute('aria-label','أقسام LEXORA');
 const track=document.createElement('div');track.className='learning-swipe-track';track.id='learningSwipeTrack';
 groups.forEach((g,index)=>{
  const page=document.createElement('div');page.className='learning-swipe-page';page.id=g.id;
  const button=document.createElement('button');button.type='button';button.className='learning-swipe-tab'+(index===0?' active':'');button.dataset.page=String(index);button.innerHTML='<span>'+g.icon+'</span><b>'+g.title+'</b>';nav.append(button);
  g.ids.forEach(id=>{const node=document.getElementById(id);if(node)page.append(node);});
  track.append(page);
 });
 const stats=document.querySelector('main > .stats');if(stats)document.getElementById('learningPage').insertBefore(stats,document.getElementById('method'));
 const hint=document.createElement('p');hint.className='swipe-hint';hint.textContent='اسحب الشاشة يميناً أو يساراً للتنقل بين الأقسام ←';shell.append(nav,track,hint);main.prepend(shell);
 const tabs=[...nav.querySelectorAll('button')];
 function setPage(i){const page=track.children[Math.max(0,Math.min(groups.length-1,i))];page.scrollIntoView({behavior:'smooth',block:'nearest',inline:'start'});tabs.forEach((b,j)=>b.classList.toggle('active',j===i));}
 tabs.forEach((b,i)=>b.addEventListener('click',()=>setPage(i)));
 let scrollTick=false;track.addEventListener('scroll',()=>{if(scrollTick)return;scrollTick=true;requestAnimationFrame(()=>{const center=track.getBoundingClientRect().left+track.clientWidth/2;let best=0,distance=Infinity;[...track.children].forEach((p,i)=>{const r=p.getBoundingClientRect(),d=Math.abs((r.left+r.right)/2-center);if(d<distance){distance=d;best=i;}});tabs.forEach((b,j)=>b.classList.toggle('active',j===best));scrollTick=false;});},{passive:true});
 document.querySelectorAll('.topbar nav a').forEach(a=>a.addEventListener('click',e=>{const target=document.querySelector(a.getAttribute('href'));if(!target)return;const page=target.closest('.learning-swipe-page');if(page){e.preventDefault();setPage([...track.children].indexOf(page));setTimeout(()=>target.scrollIntoView({behavior:'smooth',block:'start'}),260);}}));
})();

(()=>{
 const el=id=>document.getElementById(id);
 const XP_KEY_PREFIX='lexora-xp-v1:';
 let userKey='guest',xp=0,ready=false;
 const thresholds=[0,50,120,210,320,450,600,770,960,1170];
 function safeXP(value){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(1000000,Math.floor(n))):0;}
 function levelFor(value){value=safeXP(value);if(value<1170){let level=1;for(let i=1;i<thresholds.length;i++){if(value>=thresholds[i])level=i+1;else break;}return level;}let remaining=value-1170,level=10,step=250;while(remaining>=step&&level<10000){remaining-=step;level++;step+=50;}return level;}
 function nextThreshold(level){level=Math.max(1,Math.min(10000,Math.floor(Number(level)||1)));if(level<10)return thresholds[level];let total=1170;for(let l=10;l<level;l++)total+=250+(l-10)*50;return total+250+(level-10)*50;}
 function refresh(){
  const level=levelFor(xp),next=nextThreshold(level),base=level===1?0:(level<=10?thresholds[level-1]:nextThreshold(level-1));
  if(el('gameXp'))el('gameXp').textContent=xp;
  let badge=el('accountLevelBadge');if(!badge){badge=document.createElement('div');badge.id='accountLevelBadge';badge.className='account-level-badge';const stats=document.querySelector('.game-stats-row');if(stats)stats.append(badge);}
  badge.innerHTML='<strong>LV '+level+'</strong><span>'+xp+' XP</span><i><b style="width:'+Math.max(0,Math.min(100,((xp-base)/(next-base))*100))+'%"></b></i><small>'+(next-xp)+' XP للمستوى التالي</small>';
  const game=el('detectiveGame');if(game){
   let gate=el('gamesLevelGate');if(!gate){gate=document.createElement('div');gate.id='gamesLevelGate';gate.className='games-level-gate';game.insertBefore(gate,el('detectiveIntro'));}
   const locked=level<3;gate.hidden=!locked;
   if(locked){el('detectiveIntro').hidden=true;el('detectivePlayer').hidden=true;el('detectiveFinish').hidden=true;gate.innerHTML='<span>🔒</span><h3>الألعاب تفتح عند LV 3</h3><p>اجمع الخبرة من القصص والدروس حتى تصل إلى المستوى الثالث.</p><strong>مستواك الحالي: LV '+level+'</strong><small>تحتاج '+Math.max(0,thresholds[2]-xp)+' XP إضافية</small>';}
   else if(el('detectivePlayer').hidden&&el('detectiveFinish').hidden){el('detectiveIntro').hidden=false;}
  }
 }
 async function identify(){try{const result=await supabase.auth.getUser();const id=result?.data?.user?.id;if(id)userKey=id;}catch(e){}try{xp=safeXP(localStorage.getItem(XP_KEY_PREFIX+userKey)||0);}catch(e){xp=0;}ready=true;refresh();supabase.auth.onAuthStateChange((_event,session)=>{const nextKey=session?.user?.id||'guest';if(nextKey!==userKey){userKey=nextKey;try{xp=safeXP(localStorage.getItem(XP_KEY_PREFIX+userKey)||0);}catch(e){xp=0;}refresh();}});}
 window.addEventListener('lexora:xp',e=>{if(!ready)return;const amount=safeXP(e.detail?.amount);xp=safeXP(xp+amount);try{localStorage.setItem(XP_KEY_PREFIX+userKey,String(xp));}catch(e){}refresh();});
 window.LEXORA_ACCOUNT_PROGRESS={getXP:()=>xp,getLevel:()=>levelFor(xp),addXP:amount=>window.dispatchEvent(new CustomEvent('lexora:xp',{detail:{amount}}))};
 identify();
 if(el('detectiveTimer'))el('detectiveTimer').hidden=true;
})();
