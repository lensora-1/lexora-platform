import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase=createClient('https://xozfbhmilefynqipdpvo.supabase.co','sb_publishable_O_1pQ-PuFP6i4VJMa3YVeA_Mepk8KRI',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const loginPanel=$('loginPanel'),deniedPanel=$('deniedPanel'),dashboard=$('dashboard');
let currentUser=null;
function message(text,error=false){const el=$('adminMessage');el.textContent=text;el.classList.toggle('error',error)}
function loginMessage(text,error=false){const el=$('loginMessage');el.textContent=text;el.classList.toggle('error',error)}
function showState(state){loginPanel.hidden=state!=='login';deniedPanel.hidden=state!=='denied';dashboard.hidden=state!=='admin';$('logoutBtn').hidden=state==='login';}
async function checkSession(){
 const {data:{session}}=await supabase.auth.getSession();
 currentUser=session?.user||null;
 if(!currentUser){showState('login');return}
 if(currentUser.app_metadata?.role!=='admin'){showState('denied');return}
 $('adminIdentity').textContent=currentUser.email||'المدير الرئيسي';showState('admin');await loadContent();
}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();const btn=$('loginSubmit');btn.disabled=true;loginMessage('جارٍ التحقق من بيانات الدخول…');try{const {data,error}=await supabase.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;currentUser=data.user;if(data.user?.app_metadata?.role!=='admin'){await supabase.auth.signOut();currentUser=null;showState('denied');return}loginMessage('');await checkSession()}catch(err){loginMessage(err.message==='Invalid login credentials'?'البريد الإلكتروني أو كلمة المرور غير صحيحة.':'تعذر تسجيل الدخول. تحقق من البيانات وحاول مجدداً.',true)}finally{btn.disabled=false}});
async function logout(){await supabase.auth.signOut();currentUser=null;$('adminIdentity').textContent='وصول آمن للمدير';showState('login')}
$('logoutBtn').addEventListener('click',logout);$('deniedLogout').addEventListener('click',logout);
supabase.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;if(!currentUser)showState('login');else if(currentUser.app_metadata?.role!=='admin')showState('denied');else{$('adminIdentity').textContent=currentUser.email||'المدير الرئيسي';showState('admin');loadContent()}});
function ensureAdmin(){return currentUser?.app_metadata?.role==='admin'}
async function loadContent(){
 if(!ensureAdmin())return;
 try{
 const [l,u,d]=await Promise.all([supabase.from('course_levels').select('id,code,title_ar,title_en').order('sort_order'),supabase.from('course_units').select('id,level_id,title_ar,title_en').order('sort_order'),supabase.from('lessons').select('id,title_ar,title_en,status,access_plan,unit_id,duration_minutes').order('created_at',{ascending:false}).limit(100)]);
 if(l.error)throw l.error;if(u.error)throw u.error;if(d.error)throw d.error;
 $('levelCount').textContent=l.data.length;$('unitCount').textContent=u.data.length;$('lessonCount').textContent=d.data.length;$('publishedCount').textContent=d.data.filter(x=>x.status==='published').length;
 $('unitLevel').replaceChildren();$('lessonUnit').replaceChildren();
 l.data.forEach(x=>$('unitLevel').add(new Option(x.title_ar+' · '+x.code,x.id)));
 u.data.forEach(x=>$('lessonUnit').add(new Option(x.title_ar+' / '+x.title_en,x.id)));
 const list=$('lessonsList');list.replaceChildren();
 if(!d.data.length){list.textContent='لا توجد دروس بعد. ابدأ بإضافة مستوى ثم وحدة ثم درس.';return}
 d.data.forEach(lesson=>{const row=document.createElement('article');row.className='lesson-row';const info=document.createElement('div');const title=document.createElement('strong');title.textContent=lesson.title_ar+' · '+lesson.title_en;const meta=document.createElement('small');meta.textContent=(lesson.status==='published'?'منشور':'مسودة')+' · '+(lesson.access_plan==='pro'?'PRO':'مجاني')+' · '+lesson.duration_minutes+' دقائق';info.append(title,meta);const btn=document.createElement('button');btn.type='button';btn.className='btn ghost';btn.textContent=lesson.status==='published'?'إلغاء النشر':'نشر';btn.addEventListener('click',()=>setStatus(lesson.id,lesson.status==='published'?'draft':'published'));row.append(info,btn);list.append(row)});
 }catch(err){message('تعذر تحميل المحتوى. تحقق من اتصال قاعدة البيانات وصلاحيات المدير.',true);console.error(err)}
}
async function setStatus(id,status){if(!ensureAdmin())return;const {error}=await supabase.from('lessons').update({status,published_at:status==='published'?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq('id',id);if(error){message('تعذر تحديث حالة الدرس.',true);return}message(status==='published'?'تم نشر الدرس.':'تم إلغاء نشر الدرس.');await loadContent()}
$('levelForm').addEventListener('submit',async e=>{e.preventDefault();if(!ensureAdmin())return;const code=$('levelCode').value;const {error}=await supabase.from('course_levels').insert({code,title_ar:$('levelAr').value.trim(),title_en:$('levelEn').value.trim(),description_ar:$('levelDesc').value.trim(),sort_order:['zero','A1','A2','B1','B2','C1'].indexOf(code)});if(error){message('تعذر حفظ المستوى. ربما تمت إضافته مسبقاً.',true);return}e.target.reset();message('تمت إضافة المستوى بنجاح.');await loadContent()});
$('unitForm').addEventListener('submit',async e=>{e.preventDefault();if(!ensureAdmin())return;const level_id=$('unitLevel').value;if(!level_id){message('أضف مستوى أولاً.',true);return}const {error}=await supabase.from('course_units').insert({level_id,title_ar:$('unitAr').value.trim(),title_en:$('unitEn').value.trim()});if(error){message('تعذر حفظ الوحدة. تحقق من البيانات.',true);return}e.target.reset();message('تمت إضافة الوحدة.');await loadContent()});
$('lessonForm').addEventListener('submit',async e=>{e.preventDefault();if(!ensureAdmin())return;const unit_id=$('lessonUnit').value;if(!unit_id){message('أضف وحدة أولاً.',true);return}const status=$('lessonStatus').value;const {error}=await supabase.from('lessons').insert({unit_id,title_ar:$('lessonAr').value.trim(),title_en:$('lessonEn').value.trim(),summary_ar:$('lessonSummary').value.trim(),duration_minutes:Number($('lessonDuration').value),access_plan:$('lessonPlan').value,status,published_at:status==='published'?new Date().toISOString():null});if(error){message('تعذر إنشاء الدرس. تحقق من البيانات.',true);return}e.target.reset();message('تم إنشاء الدرس.');await loadContent()});
$('refreshBtn').addEventListener('click',loadContent);
checkSession();