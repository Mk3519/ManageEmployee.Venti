/* ============================================
   لوحة الموظف (Employee Dashboard)
   ============================================ */

let employeeData = null;
let employeeStats = null;
let isCheckedIn = false;

document.addEventListener('DOMContentLoaded', function() {
    // التحقق من المصادقة
    if (!isUserAuthenticated() || !isEmployee()) {
        redirectToLogin();
        return;
    }

    // بدء تهيئة اللوحة
    initializeDashboard();
});

/**
 * تهيئة لوحة الموظف
 */
async function initializeDashboard() {
    try {
        const userID = getUserID();

        // 📍 طلب الموقع الجغرافي عند بدء التطبيق (إلزامي)
        showWarningMessage('🔄 جاري تفعيل نظام الموقع الجغرافي...');
        try {
            const locationData = await DeviceFingerprint.getCurrentLocation(15000);
            if (locationData) {
                sessionStorage.setItem('locationEnabled', 'true');
                sessionStorage.setItem('initialLocation', JSON.stringify(locationData));
                showSuccessMessage('✅ تم تفعيل نظام الموقع بنجاح');
                console.log('📍 الموقع الحالي:', locationData);
            } else {
                sessionStorage.setItem('locationEnabled', 'false');
                showErrorMessage('❌ تعذر الحصول على الموقع الجغرافي - قد لا تتمكن من تسجيل الحضور');
            }
        } catch (gpsError) {
            sessionStorage.setItem('locationEnabled', 'false');
            console.warn('⚠️ خطأ في طلب GPS:', gpsError.message);
            showErrorMessage('⚠️ نظام الموقع غير متاح - يرجى تفعيل GPS في الجهاز');
        }

        // ✅ تحقق من حالة Check-In المحفوظة من قبل
        const savedCheckInState = getFromLocalStorage(`checkInState_${userID}`);
        if (savedCheckInState) {
            isCheckedIn = true;
            console.log('✅ تم استرجاع حالة الحضور المحفوظة');
        } else {
            isCheckedIn = false;
        }

        // تحميل بيانات الموظف
        await loadEmployeeData();

        // تحميل الإحصائيات
        await loadEmployeeStats();

        // تحميل السجل الشهري
        await loadAttendanceHistory();

        // ✅ تحديث حالة الأزرار بناءً على حالة Check-In
        updateAttendanceStatus();

        // بدء التحديث الدوري
        startAutoUpdate();

        // إعداد أزرار التحكم
        setupEventListeners();

        // عرض الساعة الحية
        updateClock();
        setInterval(updateClock, 1000);

    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showErrorMessage('فشل تحميل بيانات اللوحة');
    }
}

/**
 * تحميل بيانات الموظف
 */
async function loadEmployeeData() {
    try {
        const userID = getUserID();
        const userName = getUserName();

        // تحديث رأس الصفحة
        const userNameElements = document.querySelectorAll('#userName, #empName');
        userNameElements.forEach(el => el.textContent = userName);

        // محاولة جلب البيانات من الـ API
        const result = await sheetsAPI.getEmployeeData(userID);

        if (result.success && result.data) {
            employeeData = result.data;
        } else {
            // استخدام البيانات المحفوظة مؤقتاً
            employeeData = {
                id: userID,
                name: userName,
                position: getFromLocalStorage('userPosition') || '--',
                salary: getFromLocalStorage('userSalary') || 0,
                phone: getFromLocalStorage('userPhone') || '--',
                email: getFromLocalStorage('userEmail') || '--'
            };
        }

        // عرض البيانات
        displayEmployeeData();

    } catch (error) {
        console.error('Error loading employee data:', error);
    }
}

/**
 * عرض بيانات الموظف
 */
function displayEmployeeData() {
    if (!employeeData) return;

    const elements = {
        'empID': employeeData.id,
        'empName': employeeData.name,
        'empPosition': employeeData.position || '--',
        'empSalary': formatEgyptianCurrency(employeeData.salary),
        'empPhone': employeeData.phone || '--',
        'empEmail': employeeData.email || '--'
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

/**
 * تحميل إحصائيات الموظف
 */
async function loadEmployeeStats() {
    try {
        const userID = getUserID();
        const result = await sheetsAPI.getEmployeeStats(userID);

        if (result && result.success && result.data) {
            employeeStats = result.data;
            console.log('✅ تم تحميل الإحصائيات بنجاح', employeeStats);
        } else {
            // بيانات مؤقتة احتياطية
            console.warn('⚠️ استخدام بيانات احتياطية للإحصائيات');
            employeeStats = {
                totalAttendance: 0,
                totalAbsence: 0,
                totalLeave: 0,
                totalLate: 0,
                totalDiscount: 0,
                totalWarning: 0
            };
        }

        // عرض الإحصائيات
        displayStatistics();

    } catch (error) {
        console.error('❌ خطأ في تحميل الإحصائيات:', error);
        showErrorMessage('فشل تحميل الإحصائيات');
        employeeStats = {
            totalAttendance: 0,
            totalAbsence: 0,
            totalLeave: 0,
            totalLate: 0,
            totalDiscount: 0,
            totalWarning: 0
        };
        displayStatistics();
    }
}

/**
 * عرض الإحصائيات
 */
function displayStatistics() {
    if (!employeeStats) return;

    const stats = {
        'totalAttendance': employeeStats.totalAttendance,
        'totalAbsence': employeeStats.totalAbsence,
        'totalLeave': employeeStats.totalLeave,
        'totalLate': employeeStats.totalLate,
        'totalDiscount': employeeStats.totalDiscount,
        'totalWarning': employeeStats.totalWarning
    };

    Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

/**
 * تحميل سجل الحضور الشهري
 */
async function loadAttendanceHistory() {
    try {
        const userID = getUserID();
        const result = await sheetsAPI.getAttendanceHistory(userID);

        // التحقق من نجاح الطلب
        if (result && result.success && result.data && Array.isArray(result.data)) {
            // تصفية البيانات الفارغة
            const validRecords = result.data.filter(record => record.date && record.date.trim() !== '');
            
            if (validRecords.length > 0) {
                // ✅ البيانات تأتي مرتبة من AppsScript بالفعل (الأحدث أولاً)
                // لا نعكسها مرة أخرى!
                console.log(`📊 تم الحصول على ${validRecords.length} سجل حضور`);
                console.log(`🔝 آخر سجل (الأحدث): ${validRecords[0]?.date} - Check-in: ${validRecords[0]?.checkIn || '--'} - Check-out: ${validRecords[0]?.checkOut || '--'}`);
                
                displayAttendanceHistory(validRecords);
                updateCheckInStateFromLastRecord(validRecords);
                console.log('✅ تم تحميل سجل الحضور بنجاح');
            } else {
                console.warn('⚠️ لا توجد بيانات حضور للعرض');
                displayAttendanceHistory([]);
                isCheckedIn = false;
                updateAttendanceStatus();
            }
        } else {
            // معالجة الخطأ
            console.error('❌ فشل في جلب بيانات الحضور:', result?.message || result);
            displayAttendanceHistory([]);
            isCheckedIn = false;
            updateAttendanceStatus();
        }

    } catch (error) {
        console.error('❌ خطأ في تحميل سجل الحضور:', error);
        displayAttendanceHistory([]);
        isCheckedIn = false;
        updateAttendanceStatus();
    }
}

/**
 * ✅ تحديث حالة الحضور من آخر سجل في Google Sheets
 * إذا كان آخر سجل check-in بدون check-out = الموظف حاضر حالياً
 */
function updateCheckInStateFromLastRecord(records) {
    if (!records || records.length === 0) {
        isCheckedIn = false;
        console.log('⚠️ لا توجد سجلات للتحقق منها');
        updateAttendanceStatus();
        return;
    }
    
    // آخر سجل (الأحدث أولاً بعد الترتيب)
    const lastRecord = records[0];
    
    if (!lastRecord) {
        isCheckedIn = false;
        console.log('⚠️ السجل الأخير فارغ');
        updateAttendanceStatus();
        return;
    }
    
    // ✅ معالجة آمنة للبيانات - تحويل Date objects إلى strings
    let checkInValue = '';
    if (lastRecord.checkIn) {
        if (typeof lastRecord.checkIn === 'object' && lastRecord.checkIn instanceof Date) {
            // تحويل Date object إلى نص الوقت
            checkInValue = lastRecord.checkIn.toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } else {
            checkInValue = String(lastRecord.checkIn).trim();
        }
    }
    
    let checkOutValue = '';
    if (lastRecord.checkOut) {
        if (typeof lastRecord.checkOut === 'object' && lastRecord.checkOut instanceof Date) {
            checkOutValue = lastRecord.checkOut.toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } else {
            checkOutValue = String(lastRecord.checkOut).trim();
        }
    }
    
    const hasCheckIn = checkInValue !== '' && checkInValue !== '--';
    const hasCheckOut = checkOutValue !== '' && checkOutValue !== '--';
    
    console.log(`📍 آخر سجل: ${lastRecord.date}`);
    console.log(`  ✓ Check-in: ${checkInValue || 'خالي'}`);
    console.log(`  ✓ Check-out: ${checkOutValue || 'خالي'}`);
    
    // إذا كان هناك check-in بدون check-out = حاضر
    if (hasCheckIn && !hasCheckOut) {
        isCheckedIn = true;
        console.log('✅ الحالة: حاضر حالياً');
    } else {
        isCheckedIn = false;
        console.log('❌ الحالة: غير حاضر');
    }
    
    // تحديث الشاشة
    updateAttendanceStatus();
}

/**
 * عرض سجل الحضور في جدول
 */
function displayAttendanceHistory(records) {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!records || records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد بيانات</td></tr>';
        return;
    }

    records.forEach(record => {
        // ✅ معالجة آمنة للبيانات - تحويل Date objects إلى strings
        let checkInDisplay = '--';
        if (record.checkIn) {
            if (typeof record.checkIn === 'object' && record.checkIn instanceof Date) {
                // تحويل Date object إلى صيغة الوقت فقط
                checkInDisplay = record.checkIn.toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            } else {
                checkInDisplay = String(record.checkIn).trim() || '--';
            }
        }
        
        let checkOutDisplay = '--';
        if (record.checkOut) {
            if (typeof record.checkOut === 'object' && record.checkOut instanceof Date) {
                checkOutDisplay = record.checkOut.toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            } else {
                checkOutDisplay = String(record.checkOut).trim() || '--';
            }
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.date}</td>
            <td>${checkInDisplay}</td>
            <td>${checkOutDisplay}</td>
            <td>
                <span class="status-badge ${record.status === 'حاضر' ? 'status-present' : 'status-absent'}">
                    ${record.status}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * إعداد مستمعي الأحداث
 */
function setupEventListeners() {
    const checkInBtn = document.getElementById('checkInBtn');
    const checkOutBtn = document.getElementById('checkOutBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (checkInBtn) {
        checkInBtn.addEventListener('click', handleCheckIn);
    }

    if (checkOutBtn) {
        checkOutBtn.addEventListener('click', handleCheckOut);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('هل تريد تسجيل الخروج؟')) {
                // تسجيل الخروج
                clearUserSession();
                showSuccessMessage('تم تسجيل الخروج بنجاح');
                setTimeout(() => {
                    redirectTo('index.html');
                }, 1000);
            }
        });
    }
}

/**
 * التحقق من معرف الجهاز - حماية من استخدام موظف آخر
 */
function verifyDeviceID() {
    const currentDeviceID = deviceFingerprint.getID();
    const savedDeviceID = getFromLocalStorage(`approvedDevice_${getUserID()}`);
    
    if (savedDeviceID && savedDeviceID !== currentDeviceID) {
        console.error('❌ محاولة دخول من جهاز مختلف!');
        console.error('الجهاز المسجل:', savedDeviceID);
        console.error('الجهاز الحالي:', currentDeviceID);
        return false;
    }
    
    // حفظ معرف الجهاز الموثوق
    if (!savedDeviceID) {
        saveToLocalStorage(`approvedDevice_${getUserID()}`, currentDeviceID);
        console.log('✅ تم حفظ معرف الجهاز الموثوق');
    }
    
    return true;
}

/**
 * التحقق من موقع مكان العمل (بدون حفظ البيانات)
 * فقط للتحقق من أن الموظف داخل النطاق المسموح
 */
async function verifyOfficeLocation() {
    try {
        // قراءة من localStorage (الإحداثيات المحفوظة من واجهة الإدارة)
        const officeLatitude = parseFloat(getFromLocalStorage('office_latitude'));
        const officeLongitude = parseFloat(getFromLocalStorage('office_longitude'));
        const maxDistanceMeters = parseFloat(getFromLocalStorage('max_distance_meters') || '50');
        
        // التحقق من أن الإحداثيات موجودة
        if (!officeLatitude || !officeLongitude) {
            console.error('❌ إحداثيات مكان العمل غير محفوظة!');
            return { safe: false, message: '❌ إحداثيات مكان العمل غير محفوظة. يرجى تحديثها من قائمة الإإدارة' };
        }

        // الحصول على موقع المستخدم الحالي
        const currentLocation = await DeviceFingerprint.getCurrentLocation(15000);
        if (!currentLocation) {
            return { safe: false, message: '❌ فشل الحصول على موقعك الجغرافي' };
        }

        // حساب المسافة بين موقع المستخدم وموقع مكان العمل
        const distanceMeters = DeviceFingerprint.calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            officeLatitude,
            officeLongitude
        ) * 1000; // تحويل من كم إلى متر

        console.log(`📍 الموقع الحالي: ${currentLocation.latitude}, ${currentLocation.longitude}`);
        console.log(`📍 موقع العمل: ${officeLatitude}, ${officeLongitude}`);
        console.log(`📏 المسافة: ${distanceMeters.toFixed(2)} متر (الحد المسموح: ${maxDistanceMeters} متر)`);

        // التحقق من أن الموظف داخل النطاق
        if (distanceMeters <= maxDistanceMeters) {
            console.log(`✅ أنت داخل نطاق مكان العمل (${distanceMeters.toFixed(2)} متر)`);
            return { 
                safe: true, 
                message: `✅ أنت داخل نطاق مكان العمل (${distanceMeters.toFixed(2)} متر)`, 
                distance: distanceMeters 
            };
        } else {
            const message = `❌ أنت خارج نطاق مكان العمل\n📍 المسافة: ${distanceMeters.toFixed(2)} متر\n✅ الحد المسموح: ${maxDistanceMeters} متر`;
            console.warn('⚠️ محاولة تسجيل من خارج المكتب:', { distance: distanceMeters, allowed: maxDistanceMeters });
            return { safe: false, message: message, distance: distanceMeters };
        }

    } catch (error) {
        console.error('❌ خطأ في التحقق من الموقع:', error);
        return { safe: false, message: '❌ خطأ في التحقق من الموقع: ' + error.message, error: true };
    }
}

/**
 * التعامل مع تسجيل الحضور مع التحقق من الموقع (بدون حفظ بيانات GPS)
 */
async function handleCheckIn() {
    try {
        const userID = getUserID();
        const deviceID = deviceFingerprint.getID();

        // ✅ التحقق من معرف الجهاز أولاً
        if (!verifyDeviceID()) {
            showErrorMessage('❌ ⛔ محاولة دخول من جهاز غير مصرح به!\nيمنع استخدام جهاز شخص آخر.');
            console.error('🚨 محاولة دخول غير مصرح بها من جهاز مختلف!');
            return;
        }

        // تعطيل الزر مؤقتاً
        const checkInBtn = document.getElementById('checkInBtn');
        checkInBtn.disabled = true;
        checkInBtn.textContent = 'جاري التحقق من الشروط...';

        // 🔍 التحقق من شروط الحضور (الشرط الأساسي)
        console.log('🔍 جاري التحقق من شروط الحضور...');
        const conditionCheck = await sheetsAPI.checkInConditions(userID);
        
        // التحقق الآمن من النتيجة
        if (!conditionCheck || !conditionCheck.canCheckIn) {
            const errorMsg = conditionCheck?.message || '❌ لا يمكن تسجيل الحضور في الوقت الحالي';
            console.error('❌ فشل التحقق من شروط الحضور:', conditionCheck);
            showErrorMessage(errorMsg);
            checkInBtn.disabled = false;
            checkInBtn.innerHTML = '<span class="button-icon">📍</span><span>حضور</span>';
            return;
        }

        // تحديث النص
        checkInBtn.textContent = 'جاري التحقق من الموقع...';

        // 📍 التحقق من موقع مكان العمل (إلزامي)
        console.log('🔍 جاري التحقق من موقع العمل...');
        const locationCheck = await verifyOfficeLocation();
        
        if (!locationCheck.safe) {
            showErrorMessage(locationCheck.message);
            checkInBtn.disabled = false;
            checkInBtn.innerHTML = '<span class="button-icon">📍</span><span>حضور</span>';
            return;
        }

        // ✅ الموظف داخل النطاق - تسجيل الحضور (بدون حفظ بيانات GPS)
        console.log('✅ الموظف داخل النطاق - جاري تسجيل الحضور...');
        checkInBtn.textContent = 'جاري تسجيل الحضور...';

        const result = await sheetsAPI.checkIn(userID, deviceID);

        if (result.success) {
            showSuccessMessage('✅ ' + (result.message || 'تم تسجيل الحضور بنجاح'));
            
            // ✅ حفظ حالة الحضور في localStorage
            saveToLocalStorage(`checkInState_${userID}`, JSON.stringify({
                checkedIn: true,
                timestamp: new Date().toISOString()
            }));
            
            isCheckedIn = true;
            updateAttendanceStatus();

            // تحديث البيانات بعد ثانية
            setTimeout(() => {
                loadEmployeeStats();
                loadAttendanceHistory();
            }, 1000);
        } else {
            showErrorMessage('❌ ' + (result.message || 'فشل تسجيل الحضور'));
        }
    } catch (error) {
        console.error('❌ Check-in error:', error);
        showErrorMessage('❌ خطأ في تسجيل الحضور: ' + error.message);
    } finally {
        const checkInBtn = document.getElementById('checkInBtn');
        checkInBtn.disabled = false;
        checkInBtn.innerHTML = '<span class="button-icon">📍</span><span>حضور</span>';
    }
}

/**
 * التعامل مع تسجيل الانصراف مع التحقق من الموقع (بدون حفظ بيانات GPS)
 */
async function handleCheckOut() {
    try {
        const userID = getUserID();

        if (!isCheckedIn) {
            showWarningMessage('⚠️ يجب تسجيل الحضور أولاً');
            return;
        }

        // ✅ التحقق من معرف الجهاز أولاً
        if (!verifyDeviceID()) {
            showErrorMessage('❌ ⛔ محاولة دخول من جهاز غير مصرح به!\nيمنع استخدام جهاز شخص آخر.');
            console.error('🚨 محاولة انصراف غير مصرح بها من جهاز مختلف!');
            return;
        }

        // تعطيل الزر مؤقتاً
        const checkOutBtn = document.getElementById('checkOutBtn');
        checkOutBtn.disabled = true;
        checkOutBtn.textContent = 'جاري التحقق من الموقع...';

        // 📍 التحقق من موقع مكان العمل (إلزامي)
        console.log('🔍 جاري التحقق من موقع العمل...');
        const locationCheck = await verifyOfficeLocation();
        
        if (!locationCheck.safe) {
            showErrorMessage(locationCheck.message);
            checkOutBtn.disabled = false;
            checkOutBtn.innerHTML = '<span class="button-icon">🚪</span><span>انصراف</span>';
            return;
        }

        // ✅ الموظف داخل النطاق - تسجيل الانصراف (بدون حفظ بيانات GPS)
        console.log('✅ الموظف داخل النطاق - جاري تسجيل الانصراف...');
        checkOutBtn.textContent = 'جاري تسجيل الانصراف...';

        const result = await sheetsAPI.checkOut(userID);

        if (result.success) {
            showSuccessMessage('✅ تم تسجيل الانصراف بنجاح في الموقع المسموح');
            
            // ✅ حذف حالة الحضور من localStorage
            removeFromLocalStorage(`checkInState_${userID}`);
            
            isCheckedIn = false;
            updateAttendanceStatus();

            // تحديث البيانات بعد ثانية
            setTimeout(() => {
                loadEmployeeStats();
                loadAttendanceHistory();
            }, 1000);
        } else {
            showErrorMessage('❌ ' + (result.message || 'فشل تسجيل الانصراف'));
        }
    } catch (error) {
        console.error('❌ Check-out error:', error);
        showErrorMessage('❌ خطأ في تسجيل الانصراف: ' + error.message);
    } finally {
        const checkOutBtn = document.getElementById('checkOutBtn');
        checkOutBtn.disabled = false;
        checkOutBtn.innerHTML = '<span class="button-icon">🚪</span><span>انصراف</span>';
    }
}

/**
 * تحديث حالة الحضور
 */
function updateAttendanceStatus() {
    const statusDisplay = document.getElementById('attendanceStatus');
    if (!statusDisplay) return;

    if (isCheckedIn) {
        statusDisplay.innerHTML = '<span class="status-badge status-present">حاضر الآن</span>';
        const checkOutBtn = document.getElementById('checkOutBtn');
        if (checkOutBtn) checkOutBtn.disabled = false;
    } else {
        statusDisplay.innerHTML = '<span class="status-badge status-absent">غير حاضر</span>';
        const checkOutBtn = document.getElementById('checkOutBtn');
        if (checkOutBtn) checkOutBtn.disabled = true;
    }
}

/**
 * تحديث الساعة الحية
 */
function updateClock() {
    const now = new Date();
    
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = formatTime(now);
    }

    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = formatDateArabic(now);
    }
}

/**
 * تحديث آخر حضور/انصراف
 */
function updateLastAttendance() {
    // سيتم تحديثه من البيانات المسترجعة من الـ API
    const lastCheckInEl = document.getElementById('lastCheckIn');
    const lastCheckOutEl = document.getElementById('lastCheckOut');

    if (lastCheckInEl && employeeStats) {
        lastCheckInEl.textContent = employeeStats.lastCheckIn || '--';
    }

    if (lastCheckOutEl && employeeStats) {
        lastCheckOutEl.textContent = employeeStats.lastCheckOut || '--';
    }
}

/**
 * بدء التحديث الدوري للبيانات
 */
function startAutoUpdate() {
    // تحديث الإحصائيات كل 30 ثانية
    setInterval(() => {
        loadEmployeeStats();
    }, 30000);

    // تحديث السجل الشهري كل دقيقة
    setInterval(() => {
        loadAttendanceHistory();
    }, 60000);
}

/**
 * تنسيق العملة
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR'
    }).format(amount);
}
