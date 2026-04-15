/* ============================================
   دوال النافعة (Utilities)
   ============================================ */

/**
 * حفظ البيانات في localStorage
 */
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
    }
}

/**
 * جلب البيانات من localStorage
 */
function getFromLocalStorage(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
        return defaultValue;
    }
}

/**
 * حذف البيانات من localStorage
 */
function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('خطأ في حذف البيانات:', error);
    }
}

/**
 * تنظيف localStorage لهذا المستخدم
 */
function clearUserSession() {
    // حفظ userID قبل حذفه
    const userID = getFromLocalStorage('userID');
    
    // 🧹 مسح جميع البيانات المتعلقة بالمستخدم
    removeFromLocalStorage('userToken');
    removeFromLocalStorage('userRole');
    removeFromLocalStorage('userID');
    removeFromLocalStorage('userName');
    removeFromLocalStorage('userEmail');
    removeFromLocalStorage('deviceID');
    removeFromLocalStorage('approvedDevices');
    removeFromLocalStorage('sessionCreatedAt');
    removeFromLocalStorage('sessionExpiresAt');
    removeFromLocalStorage('userLocation');
    removeFromLocalStorage('locationEnabled');
    
    // مسح بيانات الموقع الجغرافي والإعدادات
    removeFromLocalStorage('office_latitude');
    removeFromLocalStorage('office_longitude');
    removeFromLocalStorage('max_distance_meters');
    
    // حذف حالة الحضور المحفوظة
    if (userID) {
        removeFromLocalStorage(`checkInState_${userID}`);
        removeFromLocalStorage(`approvedDevice_${userID}`);
    }
    
    console.log('✅ تم مسح جلسة المستخدم بنجاح');
}

/**
 * إظهار رسالة نجاح
 */
function showSuccessMessage(message, duration = 3000) {
    const container = document.getElementById('alertContainer');
    if (!container) {
        console.log('نجاح:', message);
        return;
    }

    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.textContent = message;
    alert.style.animation = 'slideInDown 0.3s ease';

    container.appendChild(alert);

    setTimeout(() => {
        alert.style.animation = 'slideOutUp 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, duration);
}

/**
 * إظهار رسالة خطأ
 */
function showErrorMessage(message, duration = 5000) {
    const container = document.getElementById('alertContainer');
    if (!container) {
        console.error('خطأ:', message);
        return;
    }

    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.textContent = message;
    alert.style.animation = 'slideInDown 0.3s ease';

    container.appendChild(alert);

    setTimeout(() => {
        alert.style.animation = 'slideOutUp 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, duration);
}

/**
 * إظهار رسالة تحذير
 */
function showWarningMessage(message, duration = 4000) {
    const container = document.getElementById('alertContainer');
    if (!container) {
        console.warn('تحذير:', message);
        return;
    }

    const alert = document.createElement('div');
    alert.className = 'alert alert-warning';
    alert.textContent = message;
    alert.style.animation = 'slideInDown 0.3s ease';

    container.appendChild(alert);

    setTimeout(() => {
        alert.style.animation = 'slideOutUp 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, duration);
}

/**
 * تنسيق الوقت بصيغة HH:MM:SS
 */
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

/**
 * تنسيق التاريخ بصيغة DD/MM/YYYY (مصري)
 */
function formatDate(date) {
    // إذا كان الإدخال نص، حاول تحويله لـ Date
    if (typeof date === 'string') {
        date = new Date(date);
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * تنسيق التاريخ والوقت بصيغة عربية (مصري)
 */
function formatDateTimeArabic(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('ar-EG', options);
}

/**
 * تنسيق التاريخ بصيغة عربية (مصري)
 */
function formatDateArabic(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('ar-EG', options);
}

/**
 * تحويل التاريخ من صيغة DD/MM/YYYY إلى Date Object
 */
function parseEgyptianDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return null;
    }
    const parts = dateString.split('/');
    if (parts.length !== 3) {
        return null;
    }
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    return new Date(year, month - 1, day);
}

/**
 * مقارنة التاريخين - هل متساويان؟
 */
function isSameDate(date1, date2) {
    // تحويل النصوص إلى Date إذا لزم الأمر
    if (typeof date1 === 'string') {
        date1 = parseEgyptianDate(date1);
    }
    if (typeof date2 === 'string') {
        date2 = parseEgyptianDate(date2);
    }
    
    if (!date1 || !date2) return false;
    
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

/**
 * حساب الفرق بين وقتين بالدقائق
 */
function getMinutesDifference(startTime, endTime) {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    return Math.floor((end - start) / 60000);
}

/**
 * حساب الفرق بين وقتين بالساعات
 */
function getHoursDifference(startTime, endTime) {
    const minutes = getMinutesDifference(startTime, endTime);
    return (minutes / 60).toFixed(2);
}

/**
 * تنسيق العملة بـ الجنيه المصري (EGP)
 */
function formatEgyptianCurrency(amount) {
    // تنسيق بسيط: 7500 EGP
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
    
    return `${formatted} EGP`;
}

/**
 * التحقق من مصادقة المستخدم
 */
function isUserAuthenticated() {
    const token = getFromLocalStorage('userToken');
    const role = getFromLocalStorage('userRole');
    return !!token && !!role;
}

/**
 * هل المستخدم موظف؟
 */
function isEmployee() {
    return getFromLocalStorage('userRole') === 'employee';
}

/**
 * هل المستخدم مدير؟
 */
function isAdmin() {
    return getFromLocalStorage('userRole') === 'admin';
}

/**
 * الحصول على معرّف المستخدم من الجلسة
 */
function getUserID() {
    return getFromLocalStorage('userID');
}

/**
 * الحصول على اسم المستخدم من الجلسة
 */
function getUserName() {
    return getFromLocalStorage('userName');
}

/**
 * إعادة توجيه إلى صفحة تسجيل الدخول
 */
function redirectToLogin() {
    clearUserSession();
    window.location.href = 'index.html';
}

/**
 * إعادة توجيه آمن
 */
function redirectTo(page) {
    window.location.href = page;
}

/**
 * التحقق من امتداد البريد الإلكتروني
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * التحقق من قوة كلمة المرور
 */
function isStrongPassword(password) {
    // على الأقل 6 أحرف، رقم واحد على الأقل
    const regex = /^(?=.*\d).{6,}$/;
    return regex.test(password);
}

/**
 * إنشاء معرّف عشوائي (UUID مبسط)
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * تشفير بسيط للبيانات الحساسة (Base64)
 * ملاحظة: هذا تشفير بسيط فقط، للإنتاج استخدم مكتبات تشفير حقيقية
 */
function encodeData(data) {
    return btoa(unescape(encodeURIComponent(data)));
}

/**
 * فك تشفير البيانات
 */
function decodeData(encoded) {
    return decodeURIComponent(escape(atob(encoded)));
}

/**
 * انتظار (async/await helper)
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * التحقق من الاتصال بالإنترنت
 */
function isOnline() {
    return navigator.onLine;
}

/**
 * إضافة مستمع لتغييرات الاتصال بالإنترنت
 */
function onConnectionChange(callback) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
}

/**
 * تحميل ملف CSV كـ Excel
 */
function downloadCSVAsExcel(csvContent, fileName = 'report.csv') {
    const BOM = '\uFEFF';
    const csv = BOM + csvContent;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName.replace(/\.csv$/, '') + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * تسجيل الأخطاء في الـ console
 */
function logError(context, error) {
    console.error(`[${context}] ${error.message}`, error);
}

/**
 * وسيط للطلبات (Retry helper)
 */
async function retryFetch(url, options = {}, maxRetries = 3) {
    let lastError;
    // ⏱️ إضافة timeout إلى الطلب (10 ثواني)
    const timeout = options.timeout || 10000;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            // إنشاء AbortController للـ timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response;
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                const delay = 1000 * Math.pow(2, i);  // exponential backoff
                console.warn(`⚠️ محاولة ${i + 1}/${maxRetries} فشلت، إعادة محاولة خلال ${delay}ms...`);
                await sleep(delay);
            }
        }
    }
    console.error('❌ فشلت جميع محاولات الاتصال');
    throw lastError;
}

/**
 * إظهار دائرة التحميل
 */
function showLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.classList.remove('hidden');
    }
}

/**
 * إخفاء دائرة التحميل
 */
function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.classList.add('hidden');
    }
}
