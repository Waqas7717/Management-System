// Urdu interface. Text on screen is swapped for Urdu with a word list, so no screen needs to change.
// Names, numbers and anything typed by users stay as they are.
const D = {
  'Dashboard': 'ڈیش بورڈ', 'Students': 'طلبہ', 'Student': 'طالب علم', 'Parents': 'والدین', 'Parent': 'والد/والدہ', 'Teachers': 'اساتذہ', 'Teacher': 'استاد', 'Principals': 'پرنسپل صاحبان', 'Principal': 'پرنسپل',
  'Classes and subjects': 'کلاسیں اور مضامین', 'Classes': 'کلاسیں', 'Class': 'کلاس', 'Subjects': 'مضامین', 'Subject': 'مضمون', 'Timetable': 'ٹائم ٹیبل', 'Date sheet': 'ڈیٹ شیٹ', 'Date sheets': 'ڈیٹ شیٹس',
  'Announcements': 'اعلانات', 'Announcement': 'اعلان', 'Notices': 'نوٹس', 'Notice': 'نوٹس', 'Events and holidays': 'تقریبات اور چھٹیاں', 'Fees': 'فیس', 'Reports': 'رپورٹس', 'Attendance': 'حاضری', 'Homework': 'ہوم ورک',
  'Results': 'نتائج', 'Result': 'نتیجہ', 'Leave': 'رخصت', 'Leave requests': 'رخصت کی درخواستیں', 'Teacher leaves': 'اساتذہ کی رخصت', 'Users': 'صارفین', 'Notify and date sheet': 'اطلاع اور ڈیٹ شیٹ', 'My attendance': 'میری حاضری',
  'More': 'مزید', 'Search': 'تلاش', 'Search students, parents, pages': 'طلبہ، والدین، صفحات تلاش کریں', 'Log out': 'لاگ آؤٹ', 'Sign in': 'سائن ان', 'Username': 'صارف نام', 'Password': 'پاس ورڈ',
  'Enter your username': 'اپنا صارف نام لکھیں', 'Enter your password': 'اپنا پاس ورڈ لکھیں', 'Admin': 'ایڈمن', 'Admin overview': 'ایڈمن جائزہ', "Principal’s dashboard": 'پرنسپل کا ڈیش بورڈ',
  'Today': 'آج', '7 days': '7 دن', '30 days': '30 دن', '90 days': '90 دن', 'Latest announcement': 'تازہ اعلان', 'View all': 'سب دیکھیں', 'View': 'دیکھیں',
  'Total students': 'کل طلبہ', 'Total': 'کل', 'With a login': 'لاگ ان کے ساتھ', 'active': 'فعال', 'Active': 'فعال', 'Inactive': 'غیر فعال', 'Needs attention': 'توجہ درکار',
  'Teacher check-in today': 'آج اساتذہ کی آمد', 'Students by class': 'کلاس کے لحاظ سے طلبہ', 'Attendance by class': 'کلاس کے لحاظ سے حاضری', 'Student attendance today': 'آج طلبہ کی حاضری',
  'Attendance today': 'آج کی حاضری', 'Teacher attendance today': 'آج اساتذہ کی حاضری', 'Present': 'حاضر', 'Absent': 'غیر حاضر', 'On leave': 'رخصت پر', 'Late': 'تاخیر', 'Not marked': 'درج نہیں',
  'Not in yet': 'ابھی نہیں آئے', 'Online': 'موجود', 'Checked in': 'آمد درج', 'Check in': 'آمد درج کریں', 'Check out': 'روانگی درج کریں', 'Quick actions': 'فوری کام', 'Mark attendance': 'حاضری لگائیں',
  'Add homework': 'ہوم ورک شامل کریں', 'Upload results': 'نتائج اپ لوڈ کریں', 'Save attendance': 'حاضری محفوظ کریں', 'Mark all present': 'سب حاضر لگائیں', 'Mark now': 'ابھی لگائیں',
  "Today’s timetable": 'آج کا ٹائم ٹیبل', "Today’s lectures": 'آج کے لیکچر', 'Lecture': 'لیکچر', 'Lectures': 'لیکچرز', 'Lectures today': 'آج کے لیکچر', 'Room': 'کمرہ', 'Time': 'وقت', 'Date': 'تاریخ',
  'My classes': 'میری کلاسیں', 'Classes and subjects': 'کلاسیں اور مضامین', 'Pending': 'زیر التوا', 'Approved': 'منظور', 'Declined': 'مسترد', 'Approve': 'منظور کریں', 'Decline': 'مسترد کریں', 'Review': 'جائزہ',
  'Apply for leave': 'رخصت کی درخواست', 'Reason': 'وجہ', 'From date': 'تاریخ آغاز', 'To date': 'تاریخ اختتام', 'Full day': 'پورا دن', 'Half day': 'آدھا دن', 'Leave history': 'رخصت کی تاریخ',
  'Welcome': 'خوش آمدید', 'Good morning': 'صبح بخیر', 'Choose child': 'بچہ منتخب کریں', 'Next paper': 'اگلا پرچہ', 'Homework pending': 'باقی ہوم ورک', 'Unread notices': 'نہ پڑھے نوٹس',
  'Tap the bell to read': 'پڑھنے کے لیے گھنٹی دبائیں', 'Latest from school': 'اسکول کی طرف سے تازہ', 'Fee voucher': 'فیس واؤچر', 'Monthly fee': 'ماہانہ فیس', 'Monthly fee per class': 'کلاس کی ماہانہ فیس',
  'Paid': 'ادا شدہ', 'Not paid': 'ادا نہیں', 'Mark paid': 'ادا شدہ لکھیں', 'Receipt': 'رسید', 'Undo': 'واپس کریں', 'Months due': 'باقی مہینے', 'Months unpaid': 'غیر ادا مہینے', 'Fee not set': 'فیس مقرر نہیں',
  'Fee not set yet': 'فیس ابھی مقرر نہیں', 'Pending': 'زیر التوا', 'Collected': 'وصول شدہ', 'Students with dues': 'بقایا والے طلبہ', 'Download for Excel': 'ایکسل کے لیے ڈاؤن لوڈ', 'Month': 'مہینہ', 'Status': 'حالت',
  'All': 'سب', 'All classes': 'تمام کلاسیں', 'Fee': 'فیس', 'Roll': 'رول نمبر', 'Name': 'نام', 'Phone': 'فون', 'Edit': 'ترمیم', 'Remove': 'ہٹائیں', 'Activate': 'فعال کریں', 'Deactivate': 'غیر فعال کریں',
  'Reset password': 'پاس ورڈ ری سیٹ', 'Add student': 'طالب علم شامل کریں', 'Add class': 'کلاس شامل کریں', 'Add paper': 'پرچہ شامل کریں', 'Add subject': 'مضمون شامل کریں', 'Add from Excel': 'ایکسل سے شامل کریں',
  'Download list': 'فہرست ڈاؤن لوڈ', 'Print': 'پرنٹ', 'Print report card': 'رپورٹ کارڈ پرنٹ کریں', 'Print date sheet': 'ڈیٹ شیٹ پرنٹ کریں', 'Print this month': 'یہ مہینہ پرنٹ کریں', 'Print or save PDF': 'پرنٹ یا PDF محفوظ کریں',
  'Report card': 'رپورٹ کارڈ', 'Student ID card': 'طالب علم کارڈ', 'Monthly attendance report': 'ماہانہ حاضری رپورٹ', 'Cancel': 'منسوخ', 'Save': 'محفوظ کریں', 'Save changes': 'تبدیلیاں محفوظ کریں', 'Close': 'بند کریں', 'Done': 'مکمل',
  'Delete': 'حذف کریں', 'Update': 'اپ ڈیٹ', 'Publish': 'شائع کریں', 'Published': 'شائع شدہ', 'Send notification': 'اطلاع بھیجیں', 'Send to': 'بھیجیں', 'Everyone': 'سب', 'Parents only': 'صرف والدین', 'Teachers only': 'صرف اساتذہ',
  'Write an announcement': 'اعلان لکھیں', 'Write a notice': 'نوٹس لکھیں', 'Write with AI': 'AI سے لکھیں', 'AI assistant': 'AI معاون', 'Ask AI': 'AI سے پوچھیں', 'Ask': 'پوچھیں', 'Free AI': 'مفت AI', 'Thinking...': 'سوچ رہا ہے...',
  'Homework helper': 'ہوم ورک مددگار', 'Report card comments': 'رپورٹ کارڈ تبصرے', 'Suggest with AI': 'AI سے تجویز', 'Insights': 'جھلکیاں', 'Show in English': 'English میں دیکھیں', 'In English': 'English میں', 'اردو میں': 'اردو میں',
  'Hide translation': 'ترجمہ چھپائیں', 'Translating...': 'ترجمہ ہو رہا ہے...', 'Paste a message here': 'پیغام یہاں چسپاں کریں', 'Percentage': 'فیصد', 'Grade': 'گریڈ', 'Class position': 'کلاس میں پوزیشن', 'Marks': 'نمبر',
  'Subject-wise marks': 'مضمون وار نمبر', 'Progress across exams': 'امتحانات میں پیش رفت', 'Exam': 'امتحان', 'Pass rate': 'کامیابی کی شرح', 'Average': 'اوسط', 'Average result': 'اوسط نتیجہ', 'Top 5 students': 'بہترین 5 طلبہ',
  'Class summary': 'کلاس کا خلاصہ', 'Class results': 'کلاس کے نتائج', 'All students': 'تمام طلبہ', 'Present days': 'حاضر دن', 'Absent days': 'غیر حاضر دن', 'Leave days': 'رخصت کے دن', 'Low attendance (below 75%)': 'کم حاضری (75% سے کم)',
  'Need support (below 50% or failed)': 'مدد درکار (50% سے کم یا فیل)', 'Monthly attendance and exam result reports. Print them or download for Excel.': 'ماہانہ حاضری اور امتحانی نتائج کی رپورٹس۔ پرنٹ کریں یا ایکسل کے لیے ڈاؤن لوڈ کریں۔',
  'Record monthly fees, see who owes, print receipts.': 'ماہانہ فیس درج کریں، بقایا دیکھیں، رسید پرنٹ کریں۔', 'Select all': 'سب منتخب کریں', 'Mark all read': 'سب پڑھا ہوا لکھیں', 'Notifications': 'اطلاعات',
  'Switch light or dark mode': 'روشن یا تاریک انداز', 'My profile photo': 'میری تصویر', 'Open': 'کھولیں', 'Holiday': 'چھٹی', 'Event': 'تقریب', 'Urgent': 'ضروری', 'Reminder': 'یاد دہانی', 'Test': 'ٹیسٹ', 'PTM': 'والدین اساتذہ ملاقات',
  'No school today': 'آج اسکول بند ہے', 'No school today.': 'آج اسکول بند ہے۔', 'Nothing here yet': 'ابھی کچھ نہیں', 'No notices yet': 'ابھی کوئی نوٹس نہیں', 'No homework yet': 'ابھی کوئی ہوم ورک نہیں', 'No students found': 'کوئی طالب علم نہیں ملا',
  'No results published yet': 'ابھی نتائج شائع نہیں ہوئے', 'No date sheet yet': 'ابھی ڈیٹ شیٹ نہیں', 'No classes today': 'آج کوئی کلاس نہیں', 'All caught up': 'سب مکمل', 'Nothing new today': 'آج کچھ نیا نہیں',
  'Mathematics': 'ریاضی', 'English': 'انگریزی', 'Urdu': 'اردو', 'Physics': 'طبیعیات', 'Chemistry': 'کیمیا', 'Biology': 'حیاتیات', 'Islamiat': 'اسلامیات', 'Computer Science': 'کمپیوٹر سائنس', 'Pak Studies': 'مطالعہ پاکستان',
  'School': 'اسکول', 'College': 'کالج', 'Father': 'والد', 'Mother': 'والدہ', 'Guardian': 'سرپرست', 'Yes': 'جی ہاں', 'No': 'نہیں', 'Back to demo sign in': 'ڈیمو سائن ان پر واپس', 'Install app on this device': 'اس ڈیوائس پر ایپ انسٹال کریں',
  'Choose login type': 'لاگ ان کی قسم منتخب کریں', 'Student attendance': 'طلبہ کی حاضری', 'Not set': 'مقرر نہیں', 'Set password': 'پاس ورڈ مقرر کریں', 'Class teacher': 'کلاس ٹیچر', 'Parent signature': 'والدین کے دستخط',
  'Attendance, last 7 days': 'حاضری، پچھلے 7 دن', 'Weekly attendance trend': 'ہفتہ وار حاضری رجحان', 'Result trend by exam': 'امتحان وار نتائج', 'Top and low performing classes': 'بہتر اور کمزور کلاسیں', 'Class-wise attendance': 'کلاس وار حاضری',
  'Class-wise results': 'کلاس وار نتائج', 'Apply': 'لاگو کریں', 'Choose photo': 'تصویر منتخب کریں', 'Save photo': 'تصویر محفوظ کریں', 'My profile and photo': 'میری پروفائل اور تصویر', 'Download sample file': 'نمونہ فائل ڈاؤن لوڈ',
};
D.students = 'طلبہ'; D['All teachers'] = 'تمام اساتذہ'; D['Fee receipt'] = 'فیس کی رسید'; D['Everything is set up. No student, class or subject is missing a link.'] = 'سب کچھ درست ہے۔ کسی طالب علم، کلاس یا مضمون کا لنک نہیں ٹوٹا۔'; D['Demo with sample data. FG Public School and College'] = 'نمونہ ڈیٹا۔ ایف جی پبلک اسکول اینڈ کالج'; D['FG Public School and College'] = 'ایف جی پبلک اسکول اینڈ کالج'; D['Winter break'] = 'سرمائی تعطیلات';
const DAYS = { Mon: 'پیر', Tue: 'منگل', Wed: 'بدھ', Thu: 'جمعرات', Fri: 'جمعہ', Sat: 'ہفتہ', Sun: 'اتوار' };
const MONS = { Jan: 'جنوری', Feb: 'فروری', Mar: 'مارچ', Apr: 'اپریل', May: 'مئی', Jun: 'جون', Jul: 'جولائی', Aug: 'اگست', Sep: 'ستمبر', Oct: 'اکتوبر', Nov: 'نومبر', Dec: 'دسمبر' };
const FULLM = { January: 'جنوری', February: 'فروری', March: 'مارچ', April: 'اپریل', May: 'مئی', June: 'جون', July: 'جولائی', August: 'اگست', September: 'ستمبر', October: 'اکتوبر', November: 'نومبر', December: 'دسمبر' };

function tr(s) {
  const t = s.trim(); if (!t) return s;
  let u = D[t];
  if (u === undefined) {
    let m;
    if ((m = /^(Welcome|Good morning|Good afternoon|Good evening), (.+)$/.exec(t))) u = D[m[1]] + '، ' + m[2];
    else if ((m = /^(\d+) (students?|days?|classes|lectures?|papers?|requests?)$/.exec(t))) u = m[1] + ' ' + ({ student: 'طلبہ', students: 'طلبہ', day: 'دن', days: 'دن', classes: 'کلاسیں', lecture: 'لیکچر', lectures: 'لیکچر', paper: 'پرچے', papers: 'پرچے', request: 'درخواستیں', requests: 'درخواستیں' }[m[2]]);
    else if ((m = /^(\d+) (students? paid|students? not paid|in|not in yet|on leave|present|absent)$/.exec(t))) u = m[1] + ' ' + ({ 'student paid': 'طلبہ نے ادا کیا', 'students paid': 'طلبہ نے ادا کیا', 'students not paid': 'طلبہ نے ادا نہیں کیا', 'student not paid': 'طالب علم نے ادا نہیں کیا', in: 'موجود', 'not in yet': 'ابھی نہیں آئے', 'on leave': 'رخصت پر', present: 'حاضر', absent: 'غیر حاضر' }[m[2]]);
    else if (/\b\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/.test(t) || /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[,.] /.test(t)) {
      u = t.replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/g, (x) => DAYS[x]).replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (x) => MONS[x]);
    } else if ((m = /^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})$/.exec(t))) u = FULLM[m[1]] + ' ' + m[2];
    else if ((m = /^Paid (\d+ \w+)$/.exec(t))) u = 'ادا ' + tr(m[1]);
    else if ((m = /^Collected, (\w+)$/.exec(t))) u = 'وصول، ' + (FULLM[m[1]] || m[1]);
  }
  if (u === undefined) return s;
  const a = s.match(/^\s*/)[0], b = s.match(/\s*$/)[0]; return a + u + b;
}

const LS = 'fgc.lang', ATTRS = ['placeholder', 'aria-label', 'title'];
const origT = new WeakMap(), origA = new WeakMap();
let lang = 'en', obs = null, queued = false; const pend = new Set();
const skip = (n) => { const p = n.parentElement; return !p || /^(SCRIPT|STYLE|TEXTAREA)$/.test(p.tagName) || !!p.closest('[data-nolang]'); };

function doText(n) {
  if (skip(n)) return; const cur = n.data, o = origT.get(n);
  if (o && cur === o.ur) return;
  const ur = tr(cur); if (ur !== cur) { origT.set(n, { en: cur, ur }); n.data = ur; }
}
function doAttrs(el) {
  if (el.closest('[data-nolang]')) return;
  ATTRS.forEach((a) => { const v = el.getAttribute(a); if (!v) return; const o = origA.get(el) || {}; if (o[a] && o[a].ur === v) return; const ur = tr(v); if (ur !== v) { o[a] = { en: v, ur }; origA.set(el, o); el.setAttribute(a, ur); } });
}
function walk(root) {
  if (root.nodeType === 3) return doText(root);
  if (root.nodeType !== 1) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n = root; if (root.nodeType === 1) doAttrs(root);
  while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
}
function revert() {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT); let n;
  while ((n = w.nextNode())) {
    if (n.nodeType === 3) { const o = origT.get(n); if (o && n.data === o.ur) { n.data = o.en; origT.delete(n); } }
    else { const o = origA.get(n); if (o) { ATTRS.forEach((a) => { if (o[a] && n.getAttribute(a) === o[a].ur) n.setAttribute(a, o[a].en); }); origA.delete(n); } }
  }
}
function flush() { queued = false; pend.forEach((n) => { if (n.isConnected) walk(n); }); pend.clear(); }
function start() {
  if (obs) return; walk(document.body);
  obs = new MutationObserver((ms) => {
    ms.forEach((m) => { if (m.type === 'characterData') pend.add(m.target); else if (m.type === 'attributes') pend.add(m.target); else m.addedNodes.forEach((a) => pend.add(a)); });
    if (!queued) { queued = true; requestAnimationFrame(flush); }
  });
  obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}
function stop() { if (obs) { obs.disconnect(); obs = null; } revert(); }

function apply() {
  const h = document.documentElement;
  if (lang === 'ur') {
    if (!document.getElementById('urfont')) { const l = document.createElement('link'); l.id = 'urfont'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap'; document.head.appendChild(l); }
    h.lang = 'ur'; h.dir = 'rtl'; h.classList.add('lang-ur'); start();
  } else { h.lang = 'en'; h.dir = 'ltr'; h.classList.remove('lang-ur'); stop(); }
  window.dispatchEvent(new Event('fgc-lang'));
}
export const getLang = () => lang;
export function setLang(l) { lang = l; try { localStorage.setItem(LS, l); } catch (e) { /* ignore */ } apply(); }
export function initLang() { try { lang = localStorage.getItem(LS) === 'ur' ? 'ur' : 'en'; } catch (e) { lang = 'en'; } if (lang === 'ur') setTimeout(apply, 0); }
