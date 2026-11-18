import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://xozfbhmilefynqipdpvo.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_O_1pQ-PuFP6i4VJMa3YVeA_Mepk8KRI';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const $ = id => document.getElementById(id);
let currentUser = null;
let currentProfile = null;
let authMode = 'login';

function setMessage(id, message, isError = false) {
  const el = $(id);
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('error', isError);
}

function updateProfileButton() {
  const button = $('profileOpenBtn');
  if (!button) return;
  if (!currentUser) {
    button.textContent = '👤 ملفي الشخصي';
    button.setAttribute('aria-label', 'تسجيل الدخول وفتح الملف الشخصي');
    return;
  }
  const label = currentProfile?.display_name || currentUser.user_metadata?.display_name || 'ملفي';
  button.textContent = '👤 ' + label;
  button.setAttribute('aria-label', 'فتح الملف الشخصي');
}

function showOverlay(id) { $(id)?.classList.add('show'); }
function hideOverlay(id) { $(id)?.classList.remove('show'); }

function setAuthMode(nextMode) {
  authMode = nextMode;
  const signup = nextMode === 'signup';
  $('accountTitle').textContent = signup ? 'إنشاء حساب LEXORA' : 'الدخول إلى LEXORA';
  $('accountIntro').textContent = signup
    ? 'أنشئ حسابك حتى يبقى ملفك الشخصي محفوظاً عند استخدام أجهزة مختلفة.'
    : 'سجّل الدخول للوصول إلى ملفك الشخصي المحفوظ.';
  $('signupNameWrap').hidden = !signup;
  $('signupName').required = signup;
  $('accountPassword').autocomplete = signup ? 'new-password' : 'current-password';
  $('accountSubmit').textContent = signup ? 'إنشاء الحساب' : 'تسجيل الدخول';
  $('accountModeSwitch').textContent = signup ? 'لديك حساب؟ سجّل الدخول' : 'ليس لديك حساب؟ أنشئ حساباً';
  setMessage('accountMessage', '');
}

async function ensureProfile(user) {
  const { data, error } = await supabase.from('profiles')
    .select('id,display_name,username,avatar_url,bio,current_level,country,learning_goal,daily_goal_minutes,interests,preferred_locale')
    .eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { data: created, error: insertError } = await supabase.from('profiles')
    .insert({
      id: user.id,
      display_name: user.user_metadata?.display_name || '',
      preferred_locale: 'ar'
    })
    .select('id,display_name,username,avatar_url,bio,current_level,country,learning_goal,daily_goal_minutes,interests,preferred_locale')
    .single();
  if (insertError) throw insertError;
  return created;
}

function localStat(key, fallback = 0) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) ? value : fallback;
  } catch { return fallback; }
}

function paintStats() {
  const xp = localStat('lexora_xp');
  const coins = localStat('lexora_coins');
  const completed = localStat('lexora_done');
  $('profileXP').textContent = xp.toLocaleString('en-US');
  $('profileCoins').textContent = coins.toLocaleString('en-US');
  $('profileLevelStat').textContent = String(Math.floor(xp / 100) + 1);
  $('profileGamesDone').textContent = completed.toLocaleString('en-US');
}

function fillProfile(profile, user) {
  currentProfile = profile;
  $('profileDisplayName').value = profile.display_name || user.user_metadata?.display_name || '';
  $('profileUsername').value = profile.username || '';
  $('profileBio').value = profile.bio || '';
  $('profileCurrentLevel').value = profile.current_level || 'zero';
  $('profileCountry').value = profile.country || '';
  $('profileGoal').value = profile.learning_goal || 'daily';
  $('profileDailyMinutes').value = String(profile.daily_goal_minutes || 15);
  $('profileEmailLine').textContent = user.email || '';
  document.querySelectorAll('input[name="profileInterest"]').forEach(input => {
    input.checked = (profile.interests || []).includes(input.value);
  });
  $('bioCount').textContent = String((profile.bio || '').length);
  const image = $('profileAvatarImage');
  const fallback = $('profileAvatarFallback');
  if (profile.avatar_url) {
    image.src = profile.avatar_url;
    image.hidden = false;
    fallback.hidden = true;
  } else {
    image.removeAttribute('src');
    image.hidden = true;
    fallback.hidden = false;
    fallback.textContent = (profile.display_name || user.email || 'L').trim().charAt(0).toUpperCase();
  }
  updateProfileButton();
}

async function openProfile() {
  if (!currentUser) {
    setAuthMode('login');
    showOverlay('accountModal');
    $('accountEmail').focus();
    return;
  }
  setMessage('profileMessage', 'جارٍ تحميل ملفك…');
  showOverlay('profileModal');
  try {
    const profile = await ensureProfile(currentUser);
    fillProfile(profile, currentUser);
    paintStats();
    setMessage('profileMessage', '');
  } catch (error) {
    console.error('LEXORA profile load failed:', error);
    setMessage('profileMessage', 'تعذر تحميل الملف. تحقق من الاتصال ثم حاول مجدداً.', true);
  }
}

$('profileOpenBtn').addEventListener('click', openProfile);
$('accountModeSwitch').addEventListener('click', () => setAuthMode(authMode === 'login' ? 'signup' : 'login'));

$('accountForm').addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('accountSubmit');
  button.disabled = true;
  setMessage('accountMessage', 'يرجى الانتظار…');
  const email = $('accountEmail').value.trim();
  const password = $('accountPassword').value;
  try {
    if (authMode === 'signup') {
      const displayName = $('signupName').value.trim();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://lexora-platform.pages.dev',
          data: { display_name: displayName }
        }
      });
      if (error) throw error;
      if (data.session?.user) {
        currentUser = data.session.user;
        currentProfile = await ensureProfile(currentUser);
        hideOverlay('accountModal');
        fillProfile(currentProfile, currentUser);
        paintStats();
        showOverlay('profileModal');
      } else {
        setMessage('accountMessage', 'تم إنشاء طلب الحساب. افتح بريدك الإلكتروني واضغط رابط التأكيد، ثم سجّل الدخول.');
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      currentUser = data.user;
      currentProfile = await ensureProfile(currentUser);
      hideOverlay('accountModal');
      fillProfile(currentProfile, currentUser);
      paintStats();
      showOverlay('profileModal');
    }
  } catch (error) {
    console.error('LEXORA account action failed:', error);
    const friendly = {
      'Invalid login credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      'Email not confirmed': 'يرجى تأكيد بريدك الإلكتروني أولاً.',
      'User already registered': 'هذا البريد مسجل مسبقاً. سجّل الدخول بدلاً من إنشاء حساب.',
      'Password should be at least 6 characters': 'كلمة المرور قصيرة جداً.'
    };
    setMessage('accountMessage', friendly[error.message] || error.message || 'تعذر إكمال العملية. حاول مرة أخرى.', true);
  } finally {
    button.disabled = false;
  }
});

$('profileEditForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!currentUser) return;
  const button = $('profileSaveBtn');
  button.disabled = true;
  setMessage('profileMessage', 'جارٍ حفظ التغييرات…');
  const username = $('profileUsername').value.trim().toLowerCase();
  if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
    setMessage('profileMessage', 'اسم المستخدم يجب أن يتكون من 3 إلى 20 حرفاً إنجليزياً أو رقماً أو _.', true);
    button.disabled = false;
    return;
  }
  const updates = {
    id: currentUser.id,
    display_name: $('profileDisplayName').value.trim(),
    username: username || null,
    bio: $('profileBio').value.trim(),
    current_level: $('profileCurrentLevel').value,
    country: $('profileCountry').value.trim(),
    learning_goal: $('profileGoal').value,
    daily_goal_minutes: Number($('profileDailyMinutes').value),
    interests: [...document.querySelectorAll('input[name="profileInterest"]:checked')].map(input => input.value),
    preferred_locale: 'ar',
    onboarding_completed: true,
    updated_at: new Date().toISOString()
  };
  try {
    const { data, error } = await supabase.from('profiles').upsert(updates, { onConflict: 'id' })
      .select('id,display_name,username,avatar_url,bio,current_level,country,learning_goal,daily_goal_minutes,interests,preferred_locale')
      .single();
    if (error) throw error;
    fillProfile(data, currentUser);
    setMessage('profileMessage', 'تم حفظ ملفك الشخصي بنجاح.');
  } catch (error) {
    console.error('LEXORA profile save failed:', error);
    setMessage('profileMessage', error.code === '23505'
      ? 'اسم المستخدم مستخدم بالفعل. جرّب اسماً آخر.'
      : 'تعذر الحفظ. ' + (error.message || 'حاول مرة أخرى.'), true);
  } finally {
    button.disabled = false;
  }
});

$('profileBio').addEventListener('input', () => {
  $('bioCount').textContent = String($('profileBio').value.length);
});

$('profileAvatarFile').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file || !currentUser) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3 * 1024 * 1024) {
    setMessage('profileMessage', 'اختر صورة JPG أو PNG أو WebP لا يتجاوز حجمها 3MB.', true);
    event.target.value = '';
    return;
  }
  setMessage('profileMessage', 'جارٍ رفع الصورة…');
  try {
    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = currentUser.id + '/' + crypto.randomUUID() + '.' + extension;
    const { error: uploadError } = await supabase.storage.from('lexora-avatars')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = supabase.storage.from('lexora-avatars').getPublicUrl(path);
    const { data, error } = await supabase.from('profiles')
      .update({ avatar_url: publicUrl.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', currentUser.id)
      .select('id,display_name,username,avatar_url,bio,current_level,country,learning_goal,daily_goal_minutes,interests,preferred_locale')
      .single();
    if (error) throw error;
    fillProfile(data, currentUser);
    setMessage('profileMessage', 'تم تحديث الصورة الشخصية.');
  } catch (error) {
    console.error('LEXORA avatar upload failed:', error);
    setMessage('profileMessage', 'تعذر رفع الصورة. تأكد من اتصالك وحاول مرة أخرى.', true);
  } finally {
    event.target.value = '';
  }
});

$('profileLogoutBtn').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    setMessage('profileMessage', 'تعذر تسجيل الخروج. حاول مرة أخرى.', true);
    return;
  }
  currentUser = null;
  currentProfile = null;
  updateProfileButton();
  hideOverlay('profileModal');
});

document.querySelectorAll('[data-close]').forEach(button => {
  button.addEventListener('click', () => hideOverlay(button.dataset.close));
});
['accountModal', 'profileModal'].forEach(id => {
  $(id).addEventListener('click', event => {
    if (event.target === $(id)) hideOverlay(id);
  });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    hideOverlay('accountModal');
    hideOverlay('profileModal');
  }
});

supabase.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null;
  if (!currentUser) currentProfile = null;
  updateProfileButton();
});

const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
if (!sessionError) {
  currentUser = sessionData.session?.user || null;
  updateProfileButton();
}
