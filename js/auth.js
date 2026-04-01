/* ============================================
   المصادقة وتسجيل الدخول (Authentication)
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    // التحقق من أن المستخدم ليس مسجلاً بالفعل
    if (isUserAuthenticated()) {
        const userRole = getFromLocalStorage('userRole');
        if (userRole === 'employee') {
            redirectTo('employee-dashboard.html');
        } else if (userRole === 'admin') {
            redirectTo('admin-dashboard.html');
        }
        return;
    }

    initializeLoginPage();
});

/**
 * تهيئة صفحة تسجيل الدخول
 */
function initializeLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // عرض معلومات الجهاز
    if (deviceFingerprint) {
        deviceFingerprint.displayDeviceInfo();
    }

    // نموذج تسجيل الدخول
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    // إظهار/إخفاء كلمة المرور
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }

    // استجابة سريعة على لوحة المفاتيح
    const employeeIDInput = document.getElementById('employeeID');
    if (employeeIDInput) {
        employeeIDInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('password').focus();
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    }
}

/**
 * التعامل مع إرسال نموذج تسجيل الدخول
 */
async function handleLoginSubmit(e) {
    e.preventDefault();

    const employeeID = document.getElementById('employeeID').value.trim();
    const password = document.getElementById('password').value;

    // التحقق من المدخلات
    if (!employeeID || !password) {
        showErrorMessage('يرجى إدخال رقم الموظف وكلمة المرور');
        return;
    }

    if (employeeID.length < 1) {
        showErrorMessage('رقم الموظف مطلوب');
        return;
    }

    if (password.length < 4) {
        showErrorMessage('كلمة المرور قصيرة جداً');
        return;
    }

    // بدء عملية التسجيل
    showLoadingSpinner(true);

    try {
        const result = await performLogin(employeeID, password);
        
        if (result.success) {
            showSuccessMessage('تم تسجيل الدخول بنجاح');
            
            // Redirect based on role
            setTimeout(() => {
                const userRole = getFromLocalStorage('userRole');
                if (userRole === 'employee') {
                    redirectTo('employee-dashboard.html');
                } else if (userRole === 'admin') {
                    redirectTo('admin-dashboard.html');
                } else {
                    showErrorMessage('دور المستخدم غير معروف');
                }
            }, 1500);
        } else {
            showErrorMessage(result.message || 'فشل تسجيل الدخول');
        }
    } catch (error) {
        console.error('Login error:', error);
        showErrorMessage('حدث خطأ: ' + error.message);
    } finally {
        showLoadingSpinner(false);
    }
}

/**
 * تنفيذ عملية تسجيل الدخول محسّن مع GPS
 */
async function performLogin(employeeID, password) {
    try {
        // التحقق من الاتصال بالإنترنت
        if (!isOnline()) {
            throw new Error('لا يوجد اتصال بالإنترنت');
        }

        // الخطوة 1: تحديد المستخدم (موظف أو مدير)
        const userType = await identifyUserType(employeeID);

        // الخطوة 2: محاولة المصادقة
        let loginResult;
        
        if (userType === 'employee') {
            loginResult = await sheetsAPI.loginEmployee(employeeID, password);
        } else if (userType === 'admin') {
            loginResult = await sheetsAPI.loginAdmin(employeeID, password);
        } else {
            return {
                success: false,
                message: 'المستخدم غير موجود'
            };
        }

        if (!loginResult.success) {
            return {
                success: false,
                message: 'بيانات تسجيل الدخول غير صحيحة'
            };
        }

        // الخطوة 3: التحقق من الجهاز
        const deviceCheckResult = await verifyDevice(employeeID, userType);

        if (deviceCheckResult.deviceChanged && !deviceCheckResult.approved) {
            return {
                success: false,
                message: 'هذا الجهاز غير معتمد. يرجى التواصل مع المدير للموافقة على الجهاز الجديد'
            };
        }

        // الخطوة 4: الحصول على الموقع الجغرافي (للموظفين فقط)
        let locationData = null;
        if (userType === 'employee' && sessionStorage.getItem('locationEnabled') !== 'false') {
            try {
                // محاولة الحصول على GPS بدقة عالية
                locationData = await DeviceFingerprint.getCurrentLocation(30000);
                sessionStorage.setItem('userLocation', JSON.stringify(locationData));
                
                // محاولة الحصول على العنوان من الإحداثيات
                const address = await DeviceFingerprint.getAddressFromCoordinates(
                    locationData.latitude,
                    locationData.longitude
                );
                locationData.address = address || 'الموقع غير معروف';
                
                console.log('✅ تم الحصول على الموقع الجغرافي:', locationData);
            } catch (gpsError) {
                console.warn('⚠️ تحذير GPS:', gpsError.message);
                // تسجيل التحذير ولكن لا نوقف تسجيل الدخول
                sessionStorage.setItem('gpsWarning', gpsError.message);
            }
        }

        // الخطوة 4.5: جلب إعدادات النظام من Google Sheets
        let settings = null;
        try {
            const settingsResponse = await sheetsAPI.getSettings();
            if (settingsResponse.success && settingsResponse.data) {
                settings = settingsResponse.data;
                console.log('✅ تم جلب إعدادات النظام بنجاح:', settings);
            }
        } catch (e) {
            console.warn('⚠️ تحذير: لم يتم جلب الإعدادات من Sheets:', e.message);
        }

        // الخطوة 5: حفظ الجلسة
        const sessionResult = await createSession(employeeID, userType, loginResult.userData);

        if (!sessionResult.success) {
            return {
                success: false,
                message: 'فشل في إنشاء الجلسة'
            };
        }

        // الخطوة 5.5: حفظ إعدادات الموقع الجغرافي في localStorage (بدون تحقق زمني - فقط الموقع!)
        if (settings) {
            saveToLocalStorage('office_latitude', settings.Office_Latitude || '24.7136');
            saveToLocalStorage('office_longitude', settings.Office_Longitude || '46.6753');
            // حفظ المسافة بالمتر
            saveToLocalStorage('max_distance_meters', settings.Max_Distance_Meters || '50');
            console.log('✅ تم حفظ إعدادات الموقع الجغرافي (بدون تحقق زمني)');
        } else {
            // القيم الافتراضية إذا فشل جلب الإعدادات (المسافة الافتراضية 50 متر)
            saveToLocalStorage('office_latitude', '24.7136');
            saveToLocalStorage('office_longitude', '46.6753');
            saveToLocalStorage('max_distance_meters', '50');
            console.warn('⚠️ تم استخدام القيم الافتراضية للإعدادات الجغرافية');
        }

        // الخطوة 6: الموافقة على الجهاز الحالي
        if (deviceCheckResult.deviceChanged) {
            deviceFingerprint.approveCurrentDevice();
        }

        return {
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            location: locationData
        };

    } catch (error) {
        console.error('❌ Login error:', error);
        return {
            success: false,
            message: 'خطأ في عملية تسجيل الدخول: ' + error.message
        };
    }
}

/**
 * تحديد نوع المستخدم (موظف أو مدير)
 * يمكن إضافة منطق أكثر تعقيداً هنا
 */
async function identifyUserType(userID) {
    // في الواقع، ستحتاج إلى التحقق من جدول الموظفين والمديرين
    // للآن، سنفترض أن سابقة معينة تشير إلى المدير (مثل "ADM-")
    
    if (userID.startsWith('ADM-') || userID.startsWith('admin')) {
        return 'admin';
    }
    
    return 'employee';
}

/**
 * التحقق من الجهاز
 */
async function verifyDevice(employeeID, userType) {
    const currentDeviceID = deviceFingerprint.getID();
    const approvedDevices = deviceFingerprint.getApprovedDevices();

    const deviceChanged = !approvedDevices.includes(currentDeviceID);

    // في الإصدار الأول، سيتم قبول أي جهاز جديد تلقائياً
    // في الإصدارات المتقدمة، سيحتاج إلى موافقة من المدير

    return {
        deviceChanged: deviceChanged,
        approved: !deviceChanged || true, // معتمد حالياً
        deviceID: currentDeviceID
    };
}

/**
 * إنشاء جلسة عمل للمستخدم
 */
async function createSession(userID, userRole, userData = {}) {
    try {
        // إنشاء معرّف جلسة عشوائي
        const userToken = generateUUID();
        const createdAt = new Date().getTime();
        const expiresAt = createdAt + (24 * 60 * 60 * 1000); // 24 ساعات
        const deviceID = deviceFingerprint.getID();

        // حفظ معلومات الجلسة
        saveToLocalStorage('userToken', userToken);
        saveToLocalStorage('userRole', userRole);
        saveToLocalStorage('userID', userID);
        saveToLocalStorage('sessionCreatedAt', createdAt);
        saveToLocalStorage('sessionExpiresAt', expiresAt);
        
        // ✅ حفظ معرف الجهاز الموثوق به لهذا المستخدم
        saveToLocalStorage(`approvedDevice_${userID}`, deviceID);
        console.log('✅ تم حفظ معرف الجهاز الموثوق:', deviceID);

        // حفظ بيانات المستخدم الإضافية
        if (userData.name) saveToLocalStorage('userName', userData.name);
        if (userData.email) saveToLocalStorage('userEmail', userData.email);
        if (userData.position) saveToLocalStorage('userPosition', userData.position);
        if (userData.salary) saveToLocalStorage('userSalary', userData.salary);

        return {
            success: true,
            token: userToken
        };
    } catch (error) {
        console.error('Session creation error:', error);
        return {
            success: false,
            message: 'فشل في إنشاء الجلسة'
        };
    }
}

/**
 * إظهار/إخفاء كلمة المرور
 */
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}

/**
 * إظهار/إخفاء مؤشر التحميل
 */
function showLoadingSpinner(show = true) {
    const spinner = document.getElementById('loadingSpinner');
    const form = document.getElementById('loginForm');

    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }

    if (form) {
        form.style.display = show ? 'none' : 'block';
    }
}

/**
 * تسجيل الخروج
 */
function logout() {
    try {
        console.log('🔄 جاري تسجيل الخروج...');
        
        // ✅ مسح جميع بيانات الجلسة
        clearUserSession();
        
        console.log('✅ تم مسح البيانات بنجاح');
        
        // ✅ إظهار رسالة النجاح
        showSuccessMessage('تم تسجيل الخروج بنجاح', 2000);
        
        // ✅ الانتظار قليلاً ثم التوجيه إلى صفحة login
        setTimeout(() => {
            console.log('🚀 جاري التوجيه إلى صفحة تسجيل الدخول...');
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('❌ خطأ في تسجيل الخروج:', error);
        showErrorMessage('حدث خطأ أثناء تسجيل الخروج');
        // إجبار التوجيه حتى في حالة الخطأ
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

/**
 * التحقق من انتهاء صلاحية الجلسة
 */
function checkSessionExpiry() {
    const expiresAt = getFromLocalStorage('sessionExpiresAt');
    
    if (!expiresAt) {
        return true; // انتهت الصلاحية
    }

    const now = new Date().getTime();
    const isExpired = now > expiresAt;

    if (isExpired) {
        clearUserSession();
        return true;
    }

    return false;
}

/**
 * إضافة مستمع لتسجيل الخروج من جميع التبويبات
 */
window.addEventListener('storage', function(e) {
    // إذا تم مسح البيانات من تبويب آخر
    if (e.key === 'userToken' && e.newValue === null) {
        // تم تسجيل الخروج من تبويب آخر
        showWarningMessage('تم تسجيل الخروج من جهاز آخر');
        setTimeout(() => {
            redirectTo('index.html');
        }, 2000);
    }
});
