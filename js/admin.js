/* ============================================
   لوحة المدير (Admin Dashboard)
   ============================================ */

let allEmployees = [];
let currentTab = 'employees';

document.addEventListener('DOMContentLoaded', function() {
    // التحقق من المصادقة
    if (!isUserAuthenticated() || !isAdmin()) {
        redirectToLogin();
        return;
    }

    // بدء تهيئة اللوحة
    initializeAdminDashboard();
});

/**
 * تهيئة لوحة المدير
 */
async function initializeAdminDashboard() {
    try {
        // تحديث اسم المدير
        const adminName = document.getElementById('adminName');
        if (adminName) {
            adminName.textContent = getUserName();
        }

        // تحميل تقرير الحضور اليومي (السرعة المهمة أكثر)
        await loadDailyAttendanceReport();

        // إعداد علامات التبويب
        setupTabs();

        // إعداد فلاتر الحضور
        setupAttendanceFilterListeners();

        // إعداد مستمعي الأحداث
        setupAdminEventListeners();

    } catch (error) {
        console.error('Admin dashboard initialization error:', error);
        showErrorMessage('فشل تحميل لوحة المدير');
    }
}

// ⚠️ دالة غير مستخدمة: loadAllEmployees() - تم حذفها لأن صفحة العرض تركز فقط على الحضور اليومي
// // إذا أصبحت هناك جداول موظفين في المستقبل، أعد تفعيل هذه الدالة

/**
 * إعداد علامات التبويب (Tabs)
 */
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;

            // إخفاء جميع التبويبات
            tabContents.forEach(content => {
                content.classList.remove('active');
            });

            // إزالة الحالة النشطة من جميع الأزرار
            tabBtns.forEach(b => {
                b.classList.remove('active');
            });

            // عرض التبويب المختار
            const selectedTab = document.getElementById(tabName);
            if (selectedTab) {
                selectedTab.classList.add('active');
            }

            // تفعيل الزر
            this.classList.add('active');

            // حفظ التبويب الحالي
            currentTab = tabName;
        });
    });
}

/**
 * إعداد مستمعي الأحداث
 */
function setupAdminEventListeners() {
    // زر تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
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

    // زر تحديث الحضور اليومي
    const refreshAttendanceBtn = document.getElementById('refreshAttendanceBtn');
    if (refreshAttendanceBtn) {
        refreshAttendanceBtn.addEventListener('click', async function() {
            // مسح cache قبل التحديث
            sheetsAPI.clearCacheFor('getDailyAttendance');
            // إعادة تحميل البيانات
            await loadDailyAttendanceReport();
            showSuccessMessage('✓ تم تحديث بيانات الحضور بنجاح');
        });
    }

    // زر تحميل تقرير Excel
    const downloadReportBtn = document.getElementById('downloadReportBtn');
    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', function() {
            showLoadingSpinner();
            setTimeout(() => {
                hideLoadingSpinner();
                downloadAttendanceReportAsExcel();
            }, 500);
        });
    }

    // زر تحميل التقرير الشهري
    const downloadMonthlyBtn = document.getElementById('downloadMonthlyBtn');
    if (downloadMonthlyBtn) {
        downloadMonthlyBtn.addEventListener('click', downloadMonthlyReport);
    }

    // زر إضافة موظف
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', showAddEmployeeForm);
    }

    // زر تطبيق جزاء
    const addDisciplineBtn = document.getElementById('addDisciplineBtn');
    if (addDisciplineBtn) {
        addDisciplineBtn.addEventListener('click', showAddDisciplineForm);
    }

    // زر إضافة سلفة
    const addAdvanceBtn = document.getElementById('addAdvanceBtn');
    if (addAdvanceBtn) {
        addAdvanceBtn.addEventListener('click', showAddAdvanceForm);
    }

    // أزرار التقارير
    const reportBtns = [
        { el: document.getElementById('generateAttendanceReport'), fn: generateAttendanceReport },
        { el: document.getElementById('generateAbsenceReport'), fn: generateAbsenceReport },
        { el: document.getElementById('generateLateReport'), fn: generateLateReport }
    ];

    reportBtns.forEach(btn => {
        if (btn.el) {
            btn.el.addEventListener('click', btn.fn);
        }
    });

    // أزرار حفظ الإعدادات
    const saveLocationBtn = document.getElementById('saveLocationBtn');
    if (saveLocationBtn) {
        saveLocationBtn.addEventListener('click', saveWorkLocation);
    }

    const saveTimingsBtn = document.getElementById('saveTimingsBtn');
    if (saveTimingsBtn) {
        saveTimingsBtn.addEventListener('click', saveWorkTimings);
    }
}

/**
 * ⚠️ الدوال التالية UNUSED - معلقة (commented)
 * غير مستخدمة لأن صفحة HTML بها حالياً تبويب واحد فقط (Daily Attendance)
 * سيتم تفعيلها عند إضافة تبويبات أخرى (الموظفين، الجزاءات، التقارير، إلخ)
 */

/* ❌ UNUSED: إضافة موظف - سيتم تفعيله عند إضافة تبويب الموظفين
function showAddEmployeeForm() {
    // ...code omitted...
}
*/

/* ❌ UNUSED: تطبيق جزاء - سيتم تفعيله عند إضافة تبويب الجزاءات
function showAddDisciplineForm() {
    // ...code omitted...
}
*/

/* ❌ UNUSED: إضافة سلفة - سيتم تفعيله عند إضافة تبويب السلف
function showAddAdvanceForm() {
    // ...code omitted...
}
*/

/**
 * إغلاق النافذة المنبثقة
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}


/* ============================================
   التقرير اليومي للحضور (Daily Attendance)
   ============================================ */

let dailyAttendanceData = {
    present: [],
    absent: [],
    all: []
};

let currentAttendanceFilter = 'all';

/**
 * تحميل وعرض تقرير الحضور اليومي (البيانات الحقيقية من Google Sheets)
 */
async function loadDailyAttendanceReport() {
    try {
        // عرض loading spinner
        showLoadingSpinner();

        // تحديث تاريخ اليوم
        updateTodayDate();
        
        // 🕐 عرض آخر وقت تحديث من localStorage
        const lastUpdateTime = getFromLocalStorage('lastDailyAttendanceUpdate');
        const lastUpdateElement = document.getElementById('lastUpdateTime');
        if (lastUpdateElement && lastUpdateTime) {
            lastUpdateElement.textContent = `Last update: ${lastUpdateTime}`;
        }

        // جلب البيانات الحقيقية من Google Sheets via Apps Script
        const result = await sheetsAPI.getDailyAttendanceReport();

        // إخفاء loading spinner
        hideLoadingSpinner();

        if (result.success && result.data && Array.isArray(result.data)) {
            console.log('✅ Attendance data loaded successfully:', result.data);
            console.log('📅 Report Date:', result.date);
            
            // 💾 حفظ وقت آخر تحديث
            const now = new Date();
            const timeString = now.toLocaleTimeString('ar-EG');
            saveToLocalStorage('lastDailyAttendanceUpdate', timeString);
            
            // 🕐 عرض وقت آخر تحديث
            const lastUpdateElement = document.getElementById('lastUpdateTime');
            if (lastUpdateElement) {
                lastUpdateElement.textContent = `Last update: ${timeString}`;
            }
            
            processDailyAttendanceData(result.data);
            displayDailyAttendanceReport();
            updateAttendanceStats();
            
            showSuccessMessage(`✅ تم تحميل ${result.data.length} موظف بنجاح`);
        } else {
            // إذا كانت الاستجابة غير صحيحة
            console.error('❌ Invalid API response:', result);
            hideLoadingSpinner();
            showErrorMessage('Failed to load attendance data: ' + (result.message || 'Unknown error'));
            
            // عرض الجدول فارغ
            dailyAttendanceData = { present: [], absent: [], all: [] };
            displayDailyAttendanceReport();
            updateAttendanceStats();
        }
    } catch (error) {
        console.error('Error loading daily attendance:', error);
        hideLoadingSpinner();
        showErrorMessage('Connection error: ' + error.message);
        
        // عرض الجدول فارغ
        dailyAttendanceData = { present: [], absent: [], all: [] };
        displayDailyAttendanceReport();
        updateAttendanceStats();
    }
}

/**
 * تحديث تاريخ اليوم
 */
function updateTodayDate() {
    const todayElement = document.getElementById('todayDate');
    if (todayElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date().toLocaleDateString('en-US', options);
        todayElement.textContent = `Today: ${today}`;
    }
}

/**
 * معالجة بيانات الحضور اليومي
 */
function processDailyAttendanceData(data) {
    dailyAttendanceData = {
        present: [],
        absent: [],
        all: []
    };

    if (!Array.isArray(data)) {
        console.error('❌ Data is not an array:', data);
        console.error('Type:', typeof data);
        return;
    }

    console.log(`📊 معالجة ${data.length} موظف...`);

    // فصل الحاضرين والغائبين
    data.forEach((employee, index) => {
        // تجاهل الموظفين الفارغين
        if (!employee || Object.keys(employee).length === 0) {
            console.warn(`⚠️ موظف رقم ${index} فارغ ({})`);
            return;
        }

        const employeeRecord = {
            id: employee.id || employee.employeeID || '--',
            name: employee.name || 'Unknown',
            position: employee.position || '--',
            checkInTime: employee.checkInTime || employee.checkin_time || '--',
            checkOutTime: employee.checkOutTime || employee.checkout_time || '--',
            status: employee.status || 'absent',
            device: employee.device || employee.deviceID || '--'
        };

        // التحقق من البيانات
        if (!employeeRecord.id || employeeRecord.id === '--') {
            console.warn(`⚠️ موظف بدون ID:`, employeeRecord);
        }

        dailyAttendanceData.all.push(employeeRecord);

        if (employeeRecord.status === 'present' || employeeRecord.checkInTime !== '--') {
            dailyAttendanceData.present.push(employeeRecord);
            console.log(`✅ موظف حاضر: ${employeeRecord.name} (${employeeRecord.id}) - الوقت: ${employeeRecord.checkInTime}`);
        } else {
            dailyAttendanceData.absent.push(employeeRecord);
        }
    });

    console.log('📊 ملخص البيانات:', {
        present: dailyAttendanceData.present.length,
        absent: dailyAttendanceData.absent.length,
        total: dailyAttendanceData.all.length
    });
    console.log('🔍 البيانات الكاملة:', dailyAttendanceData);
}

/**
 * تحميل بيانات تجريبية
 */
function loadDemoAttendanceData() {
    const demoDataPresent = [
        { id: '001', name: 'Ahmed Mohammed', position: 'Engineer', checkInTime: '08:15', status: 'present', device: 'DEV-001' },
        { id: '002', name: 'Fatima Ali', position: 'Accountant', checkInTime: '08:30', status: 'present', device: 'DEV-002' },
        { id: '003', name: 'Mohammed Salem', position: 'Sales', checkInTime: '08:45', status: 'present', device: 'DEV-003' },
        { id: '004', name: 'Sara Ibrahim', position: 'HR', checkInTime: '09:00', status: 'present', device: 'DEV-004' }
    ];

    const demoDataAbsent = [
        { id: '005', name: 'Noor Hassan', position: 'Developer', checkInTime: '--', status: 'absent', device: '--' },
        { id: '006', name: 'Layla Ahmed', position: 'Designer', checkInTime: '--', status: 'absent', device: '--' },
        { id: '007', name: 'Omar Khalid', position: 'Manager', checkInTime: '--', status: 'absent', device: '--' }
    ];

    dailyAttendanceData = {
        present: demoDataPresent,
        absent: demoDataAbsent,
        all: [...demoDataPresent, ...demoDataAbsent]
    };
}

/**
 * تحديث إحصائيات الحضور
 */
function updateAttendanceStats() {
    const presentCount = dailyAttendanceData.present.length;
    const absentCount = dailyAttendanceData.absent.length;
    const totalCount = dailyAttendanceData.all.length;

    document.getElementById('presentCount').textContent = presentCount;
    document.getElementById('absentCount').textContent = absentCount;
    document.getElementById('totalCount').textContent = totalCount;
}

/**
 * عرض تقرير الحضور اليومي في جدول
 */
function displayDailyAttendanceReport() {
    const tbody = document.getElementById('dailyAttendanceTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    let dataToDisplay = [];
    
    // تحديد البيانات المراد عرضها بناءً على الفلتر الحالي
    if (currentAttendanceFilter === 'present') {
        dataToDisplay = dailyAttendanceData.present;
    } else if (currentAttendanceFilter === 'absent') {
        dataToDisplay = dailyAttendanceData.absent;
    } else {
        dataToDisplay = dailyAttendanceData.all;
    }

    if (dataToDisplay.length === 0) {
        const message = currentAttendanceFilter === 'all' 
            ? 'No employee data available' 
            : `No ${currentAttendanceFilter} employees found`;
        tbody.innerHTML = `<tr><td colspan="5" class="text-center">${message}</td></tr>`;
        return;
    }

    dataToDisplay.forEach(emp => {
        const row = document.createElement('tr');
        const statusBadgeClass = emp.status === 'present' ? 'status-present' : 'status-absent';
        const statusText = emp.status === 'present' ? 'Present' : 'Absent';
        
        row.innerHTML = `
            <td>${emp.id}</td>
            <td><strong>${emp.name}</strong></td>
            <td><span class="time-display">${emp.checkInTime}</span></td>
            <td><span class="time-display">${emp.checkOutTime}</span></td>
            <td>
                <span class="status-badge ${statusBadgeClass}">
                    ${statusText}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * إعداد مستمعي الأحداث للفلاتر
 */
function setupAttendanceFilterListeners() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // إزالة active من جميع الفلاتر
            filterTabs.forEach(t => t.classList.remove('active'));
            
            // إضافة active للفلتر المختار
            this.classList.add('active');
            
            // تحديث الفلتر الحالي
            currentAttendanceFilter = this.dataset.filter;
            
            // عرض البيانات المفلترة
            displayDailyAttendanceReport();
        });
    });
}

/**
 * Stub Functions - سيتم تطويرها في الإصدارات المستقبلية
 * عند إضافة تبويبات إضافية (موظفين، جزاءات، تقارير، إلخ)
 */

/**
 * عرض نموذج إضافة موظف (Stub)
 */
function showAddEmployeeForm() {
    showWarningMessage('⚠️ ميزة إضافة الموظف ستُضاف قريباً');
}

/**
 * عرض نموذج تطبيق جزاء (Stub)
 */
function showAddDisciplineForm() {
    showWarningMessage('⚠️ ميزة تطبيق الجزاء ستُضاف قريباً');
}

/**
 * عرض نموذج إضافة سلفة (Stub)
 */
function showAddAdvanceForm() {
    showWarningMessage('⚠️ ميزة إضافة السلفة ستُضاف قريباً');
}

/**
 * توليد تقرير الحضور (Stub)
 */
async function generateAttendanceReport() {
    showWarningMessage('⚠️ تقرير الحضور ستُضاف قريباً');
}

/**
 * توليد تقرير الغياب (Stub)
 */
async function generateAbsenceReport() {
    showWarningMessage('⚠️ تقرير الغياب ستُضاف قريباً');
}

/**
 * توليد تقرير التأخيرات (Stub)
 */
async function generateLateReport() {
    showWarningMessage('⚠️ تقرير التأخيرات ستُضاف قريباً');
}

/**
 * حفظ موقع مكان العمل (Stub)
 */
function saveWorkLocation() {
    showWarningMessage('⚠️ ضبط موقع العمل ستُضاف قريباً');
}

/**
 * حفظ أوقات العمل (Stub)
 */
function saveWorkTimings() {
    showWarningMessage('⚠️ ضبط أوقات العمل ستُضاف قريباً');
}


/**
 * عرض تفاصيل الموظف
 */
function viewEmployeeDetails(employeeID) {
    const employee = dailyAttendanceData.all.find(emp => emp.id === employeeID);
    if (employee) {
        alert(`
Employee Details:
ID: ${employee.id}
Name: ${employee.name}
Position: ${employee.position}
Check-In Time: ${employee.checkInTime}
Status: ${employee.status === 'present' ? 'Present' : 'Not Checked In'}
Device: ${employee.device}
        `);
    }
}

/**
 * تحميل تقرير الحضور كملف Excel
 */
function downloadAttendanceReportAsExcel() {
    try {
        // التحقق من وجود بيانات
        if (!dailyAttendanceData.all || dailyAttendanceData.all.length === 0) {
            showWarningMessage('⚠️ لا توجد بيانات لتحميلها');
            return;
        }

        // التحقق من تحميل مكتبة XLSX
        if (typeof XLSX === 'undefined') {
            console.warn('⚠️ XLSX مكتبة غير محمّلة، جاري محاولة التحميل...');
            // محاولة تحميل المكتبة من CDN بديل
            loadXLSXLibrary(downloadAttendanceReportAsExcel);
            return;
        }

        // تحضير البيانات للـ Excel
        const excelData = dailyAttendanceData.all.map(emp => ({
            'الكود': emp.id,
            'الاسم': emp.name,
            'الاتشيك ان (Check-In)': emp.checkInTime,
            'الاتشيك اوت (Check-Out)': emp.checkOutTime,
            'حالة الحضور': emp.status === 'present' ? 'حاضر (Present)' : 'غائب (Absent)'
        }));

        // الحصول على التاريخ الحالي بدون أحرف محظورة
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const dateStr = `${day}-${month}-${year}`;  // بدلاً من: 15/04/2026

        // إنشاء ورقة عمل
        const ws = XLSX.utils.json_to_sheet(excelData);

        // تنسيق الأعمدة
        const colWidths = [
            { wch: 12 },  // الكود
            { wch: 25 },  // الاسم
            { wch: 18 },  // الاتشيك ان
            { wch: 18 },  // الاتشيك اوت
            { wch: 20 }   // حالة الحضور
        ];
        ws['!cols'] = colWidths;

        // تنسيق رؤوس الأعمدة (خط غامق + خلفية زرقاء)
        const headerRange = XLSX.utils.decode_range(ws['!ref']);
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
            const cellAddress = XLSX.utils.encode_col(col) + '1';
            if (!ws[cellAddress]) continue;
            ws[cellAddress].s = {
                font: { bold: true, color: { rgb: 'FFFFFF' } },
                fill: { fgColor: { rgb: '1e88e5' } },
                alignment: { horizontal: 'center', vertical: 'center' }
            };
        }

        // إنشاء مصنف Excel
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'الحضور يومي');  // بدون تاريخ في الاسم

        // تحميل الملف
        const fileName = `تقرير_حضور_يومي_${dateStr}.xlsx`;
        XLSX.writeFile(wb, fileName);

        showSuccessMessage(`✅ تم تحميل: ${fileName}`);
    } catch (error) {
        console.error('❌ خطأ في تحميل التقرير:', error);
        showErrorMessage('فشل تحميل التقرير: ' + error.message);
    }
}

/**
 * تحميل مكتبة XLSX من CDN بديل
 */
function loadXLSXLibrary(callback) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload = function() {
        console.log('✅ تم تحميل XLSX');
        if (callback && typeof callback === 'function') {
            callback();
        }
    };
    script.onerror = function() {
        console.error('❌ فشل تحميل XLSX من CDN');
        showErrorMessage('❌ فشل تحميل مكتبة Excel - تحقق من الاتصال بالإنترنت');
    };
    document.head.appendChild(script);
}

/**
 * تحميل تقرير شهري لجميع الموظفين
 */
async function downloadMonthlyReport() {
    try {
        showLoadingSpinner();

        // التحقق من تحميل مكتبة XLSX
        if (typeof XLSX === 'undefined') {
            loadXLSXLibrary(downloadMonthlyReport);
            return;
        }

        // جلب البيانات الشهرية من Google Sheets
        const result = await sheetsAPI.get('getMonthlyAttendance', {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
        });

        hideLoadingSpinner();

        if (!result.success || !result.data || result.data.length === 0) {
            showWarningMessage('⚠️ لا توجد بيانات شهرية متاحة');
            return;
        }

        // تحضير البيانات للـ Excel
        const excelData = result.data.map(emp => ({
            'الكود': emp.id || emp.employeeID || '--',
            'الاسم': emp.name || '--',
            'التاريخ': emp.date || '--',
            'الاتشيك ان': emp.checkInTime || '--',
            'الاتشيك اوت': emp.checkOutTime || '--',
            'الحالة': emp.status === 'present' ? 'حاضر (Present)' : 'غائب (Absent)'
        }));

        // إنشاء اسم الملف
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const sheetName = 'الحضور الشهري';
        const fileName = `تقرير_حضور_شهري_${year}-${month}.xlsx`;

        // إنشاء ملف Excel
        createExcelFile(excelData, sheetName, fileName);
    } catch (error) {
        console.error('❌ خطأ في التقرير الشهري:', error);
        hideLoadingSpinner();
        showErrorMessage('فشل تحميل التقرير الشهري: ' + error.message);
    }
}

/**
 * إنشاء ملف Excel (مشترك بين التقارير)
 */
function createExcelFile(excelData, sheetName, fileName) {
    try {
        if (!excelData || excelData.length === 0) {
            showWarningMessage('⚠️ لا توجد بيانات لتصديرها');
            return;
        }

        // إنشاء ورقة عمل
        const ws = XLSX.utils.json_to_sheet(excelData);

        // تنسيق الأعمدة
        const colWidths = [
            { wch: 12 },  // الكود
            { wch: 25 },  // الاسم
            { wch: 18 },  // التاريخ
            { wch: 18 },  // الاتشيك ان
            { wch: 18 },  // الاتشيك اوت
            { wch: 15 }   // الحالة
        ];
        ws['!cols'] = colWidths;

        // تنسيق رؤوس الأعمدة
        const headerRange = XLSX.utils.decode_range(ws['!ref']);
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
            const cellAddress = XLSX.utils.encode_col(col) + '1';
            if (!ws[cellAddress]) continue;
            ws[cellAddress].s = {
                font: { bold: true, color: { rgb: 'FFFFFF' } },
                fill: { fgColor: { rgb: '1e88e5' } },
                alignment: { horizontal: 'center', vertical: 'center' }
            };
        }

        // إنشاء مصنف
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // تحميل الملف
        XLSX.writeFile(wb, fileName);

        showSuccessMessage(`✅ تم تحميل: ${fileName}`);
    } catch (error) {
        console.error('❌ خطأ في Excel:', error);
        showErrorMessage('فشل إنشاء الملف: ' + error.message);
    }
}
