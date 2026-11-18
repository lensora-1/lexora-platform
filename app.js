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
  if (session?.user) loadLearnerProfile(session.user);
  if (event === 'PASSWORD_RECOVERY') openModal('updatePassword');
});

supabase.auth.getSession().then(({ data, error }) => {
  if (!error) {
    updateAuthUI(data.session?.user ?? null);
    if (data.session?.user) loadLearnerProfile(data.session.user);
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
