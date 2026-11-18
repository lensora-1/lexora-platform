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
document.getElementById('accountBtn').addEventListener('click', () => openModal('account'));

supabase.auth.onAuthStateChange((event, session) => {
  updateAuthUI(session?.user ?? null);
  if (event === 'PASSWORD_RECOVERY') openModal('updatePassword');
});

supabase.auth.getSession().then(({ data, error }) => {
  if (!error) {
    updateAuthUI(data.session?.user ?? null);
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
