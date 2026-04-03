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

        // تحميل الموظفين
        await loadAllEmployees();

        // تحميل تقرير الحضور اليومي
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

/**
 * تحميل جميع الموظفين
 */
async function loadAllEmployees() {
    try {
        const result = await sheetsAPI.getAllEmployees();

        if (result.success && Array.isArray(result.data)) {
            allEmployees = result.data;
        } else {
            // بيانات مؤقتة للاختبار
            allEmployees = [
                { id: '001', name: 'أحمد محمد', position: 'مهندس', salary: 5000, phone: '0501234567', email: 'ahmed@example.com', status: 'نشط' },
                { id: '002', name: 'فاطمة علي', position: 'محاسبة', salary: 4500, phone: '0502345678', email: 'fatima@example.com', status: 'نشط' },
                { id: '003', name: 'محمد سالم', position: 'مبيعات', salary: 3500, phone: '0503456789', email: 'salem@example.com', status: 'نشط' }
            ];
        }

        // عرض الموظفين في الجدول
        displayEmployeesTable();

    } catch (error) {
        console.error('Error loading employees:', error);
        showErrorMessage('فشل في تحميل بيانات الموظفين');
    }
}

/**
 * عرض جدول الموظفين
 */
function displayEmployeesTable() {
    const tbody = document.getElementById('employeesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!allEmployees || allEmployees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">لا يوجد موظفون</td></tr>';
        return;
    }

    allEmployees.forEach(emp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.id}</td>
            <td>${emp.name}</td>
            <td>${emp.position}</td>
            <td>${formatCurrency(emp.salary)}</td>
            <td>${emp.phone}</td>
            <td>
                <span class="status-badge ${emp.status === 'نشط' ? 'status-present' : 'status-absent'}">
                    ${emp.status}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-info" onclick="editEmployee('${emp.id}')">تعديل</button>
                <button class="btn btn-sm btn-danger" onclick="deactivateEmployee('${emp.id}')">إيقاف</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

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
            showLoadingOverlay('Refreshing attendance data...');
            await loadDailyAttendanceReport();
            hideLoadingOverlay();
            showSuccessMessage('✓ Attendance data refreshed successfully');
        });
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
 * عرض نموذج إضافة موظف
 */
function showAddEmployeeForm() {
    const form = `
        <div class="modal" id="employeeModal" style="display: block; position: fixed; z-index: 1000; top: 0; right: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);">
            <div class="modal-content" style="background-color: white; margin: 5% auto; padding: 2rem; border-radius: 8px; width: 90%; max-width: 500px;">
                <span style="float: left; font-size: 1.5rem; cursor: pointer; color: #999;" onclick="closeModal('employeeModal')">&times;</span>
                <h2>إضافة موظف جديد</h2>
                <form id="addEmployeeForm">
                    <div class="form-group">
                        <label>رقم الموظف:</label>
                        <input type="text" id="empId" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>الاسم:</label>
                        <input type="text" id="empName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>الوظيفة:</label>
                        <input type="text" id="empPosition" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>الراتب:</label>
                        <input type="number" id="empSalary" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>الهاتف:</label>
                        <input type="tel" id="empPhone" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>البريد الإلكتروني:</label>
                        <input type="email" id="empEmail" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>كلمة المرور:</label>
                        <input type="password" id="empPassword" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-success btn-block">إضافة</button>
                </form>
            </div>
        </div>
    `;

    const container = document.getElementById('modalContainer') || document.body;
    container.insertAdjacentHTML('beforeend', form);

    const form_elem = document.getElementById('addEmployeeForm');
    form_elem.addEventListener('submit', async function(e) {
        e.preventDefault();

        const newEmployee = {
            id: document.getElementById('empId').value,
            name: document.getElementById('empName').value,
            position: document.getElementById('empPosition').value,
            salary: parseFloat(document.getElementById('empSalary').value),
            phone: document.getElementById('empPhone').value,
            email: document.getElementById('empEmail').value,
            password: document.getElementById('empPassword').value
        };

        try {
            const result = await sheetsAPI.addEmployee(newEmployee);
            if (result.success) {
                showSuccessMessage('تم إضافة الموظف بنجاح');
                closeModal('employeeModal');
                await loadAllEmployees();
            } else {
                showErrorMessage(result.message || 'فشل في إضافة الموظف');
            }
        } catch (error) {
            showErrorMessage('خطأ: ' + error.message);
        }
    });
}

/**
 * عرض نموذج تطبيق جزاء
 */
function showAddDisciplineForm() {
    const adminID = getUserID();
    const deviceSignature = deviceFingerprint.getID();
    
    const modal = document.createElement('div');
    modal.id = 'disciplineModal';
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    modal.innerHTML = `
        <div class="modal-content" style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
            <h2 style="text-align: center; margin-bottom: 20px;">تطبيق جزاء على موظف</h2>
            <form id="disciplineForm" style="direction: rtl;">
                <div class="form-group">
                    <label>اختر الموظف:</label>
                    <select id="disciplineEmployeeSelect" class="form-control" required>
                        <option value="">-- اختر موظف --</option>
                        ${allEmployees.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>نوع الجزاء:</label>
                    <select id="disciplineType" class="form-control" required>
                        <option value="">-- اختر النوع --</option>
                        <option value="Discount">خصم من الراتب</option>
                        <option value="Warning">إنذار</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>المبلغ/السبب:</label>
                    <input type="text" id="disciplineAmount" class="form-control" placeholder="ادخل المبلغ أو السبب" required>
                </div>
                <div class="form-group">
                    <label>ملاحظات:</label>
                    <textarea id="disciplineReason" class="form-control" rows="3" placeholder="ملاحظات إضافية"></textarea>
                </div>
                <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 15px 0; font-size: 12px;">
                    <strong>📝 معلومات التوقيع:</strong><br>
                    المدير: <strong>${adminID}</strong><br>
                    التاريخ: <strong>${new Date().toLocaleDateString('ar-SA')}</strong>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button type="submit" class="btn btn-success" style="flex: 1;">تطبيق الجزاء</button>
                    <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="closeModal('disciplineModal')">إلغاء</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('disciplineForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const employeeID = document.getElementById('disciplineEmployeeSelect').value;
        const type = document.getElementById('disciplineType').value;
        const amount = document.getElementById('disciplineAmount').value;
        const reason = document.getElementById('disciplineReason').value;

        if (!employeeID || !type || !amount) {
            showErrorMessage('يرجى ملء جميع الحقول');
            return;
        }

        try {
            const result = await sheetsAPI.applyDisciplineWithSignature(employeeID, type, amount, reason, adminID, deviceSignature);
            if (result.success) {
                showSuccessMessage('✅ تم تطبيق الجزاء مع التوقيع الرقمي');
                console.log('التوقيع:', result.signature);
                closeModal('disciplineModal');
            } else {
                showErrorMessage(result.message || 'فشل التطبيق');
            }
        } catch (error) {
            showErrorMessage('خطأ: ' + error.message);
        }
    });
}

/**
 * عرض نموذج إضافة سلفة
 */
function showAddAdvanceForm() {
    const modal = document.createElement('div');
    modal.id = 'advanceModal';
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    modal.innerHTML = `
        <div class="modal-content" style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
            <h2 style="text-align: center; margin-bottom: 20px;">إضافة سلفة للموظف</h2>
            <form id="advanceForm" style="direction: rtl;">
                <div class="form-group">
                    <label>اختر الموظف:</label>
                    <select id="advanceEmployeeSelect" class="form-control" required>
                        <option value="">-- اختر موظف --</option>
                        ${allEmployees.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>مبلغ السلفة (ريال):</label>
                    <input type="number" id="advanceAmount" class="form-control" placeholder="أدخل المبلغ" required min="100">
                </div>
                <div class="form-group">
                    <label>عدد شهور الخصم:</label>
                    <input type="number" id="advanceMonths" class="form-control" placeholder="عدد الشهور" required min="1" max="12">
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button type="submit" class="btn btn-success" style="flex: 1;">إضافة السلفة</button>
                    <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="closeModal('advanceModal')">إلغاء</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('advanceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const employeeID = document.getElementById('advanceEmployeeSelect').value;
        const amount = document.getElementById('advanceAmount').value;
        const months = document.getElementById('advanceMonths').value;

        try {
            const result = await sheetsAPI.addAdvance(employeeID, amount, months);
            if (result.success) {
                showSuccessMessage('✅ تم إضافة السلفة بنجاح');
                closeModal('advanceModal');
            } else {
                showErrorMessage(result.message || 'فشل في إضافة السلفة');
            }
        } catch (error) {
            showErrorMessage('خطأ: ' + error.message);
        }
    });
}

/**
 * إغلاق النافذة المنبثقة
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

/**
 * تعديل الموظف
 */
async function editEmployee(employeeID) {
    const employee = allEmployees.find(emp => emp.id === employeeID);
    if (!employee) {
        showErrorMessage('لم يتم العثور على الموظف');
        return;
    }

    // سيتم تطويره لاحقاً
    showWarningMessage(`تعديل الموظف ${employee.name} قيد التطوير`);
}

/**
 * إيقاف الموظف
 */
async function deactivateEmployee(employeeID) {
    if (!confirm('هل أنت متأكد من إيقاف هذا الموظف؟')) {
        return;
    }

    try {
        const result = await sheetsAPI.deactivateEmployee(employeeID);
        if (result.success) {
            showSuccessMessage('تم إيقاف الموظف بنجاح');
            await loadAllEmployees();
        } else {
            showErrorMessage(result.message || 'فشل في إيقاف الموظف');
        }
    } catch (error) {
        showErrorMessage('خطأ: ' + error.message);
    }
}

/**
 * إنشاء تقرير الحضور
 */
async function generateAttendanceReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    if (!startDate || !endDate) {
        showWarningMessage('يرجى اختيار التاريخ من إلى');
        return;
    }

    try {
        const result = await sheetsAPI.getAttendanceReport(startDate, endDate);
        if (result.success && result.data) {
            displayAttendanceReport(result.data);
        } else {
            showErrorMessage('فشل في جلب التقرير');
        }
    } catch (error) {
        showErrorMessage('خطأ: ' + error.message);
    }
}

/**
 * عرض تقرير الحضور في جدول
 */
function displayAttendanceReport(data) {
    const tbody = document.querySelector('#attendanceReportTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">لا توجد بيانات</td></tr>';
        return;
    }

    data.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.name}</td>
            <td>${record.employeeID}</td>
            <td>${record.date}</td>
            <td>${record.checkIn || '--'}</td>
            <td>${record.checkOut || '--'}</td>
            <td>${record.duration || '--'}</td>
            <td>
                <span class="status-badge ${record.status === 'present' ? 'status-present' : 'status-absent'}">
                    ${record.status}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * إنشاء تقرير الغياب
 */
async function generateAbsenceReport() {
    // سيتم تطويره لاحقاً
    showWarningMessage('هذه الميزة قيد التطوير');
}

/**
 * إنشاء تقرير التأخيرات
 */
async function generateLateReport() {
    // سيتم تطويره لاحقاً
    showWarningMessage('هذه الميزة قيد التطوير');
}

/**
 * حفظ موقع مكان العمل (مع المسافة بالمتر)
 */
function saveWorkLocation() {
    const latitude = document.getElementById('workLatitude').value;
    const longitude = document.getElementById('workLongitude').value;
    const radiusMeters = document.getElementById('workRadius').value;

    if (!latitude || !longitude || !radiusMeters) {
        showErrorMessage('❌ يرجى ملء جميع الحقول');
        return;
    }

    try {
        // 1️⃣ حفظ محلياً في localStorage (للفوري)
        const location = {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            radius_meters: parseInt(radiusMeters)
        };
        
        saveToLocalStorage('workLocation', location);
        
        // 2️⃣ تحديث localStorage لجميع الموظفين (مع المسافة بالمتر)
        saveToLocalStorage('office_latitude', latitude);
        saveToLocalStorage('office_longitude', longitude);
        saveToLocalStorage('max_distance_meters', radiusMeters);
        
        // 3️⃣ حفظ في Google Sheets أيضاً ✅
        showWarningMessage('⏳ جاري حفظ الموقع في Google Sheets...');
        
        sheetsAPI.saveWorkLocation(latitude, longitude, radiusMeters).then(result => {
            if (result.success) {
                showSuccessMessage(
                    `✅ تم حفظ موقع مكان العمل بنجاح!\n\n` +
                    `📍 الإحداثيات الجديدة:\n` +
                    `خط العرض: ${latitude}°\n` +
                    `خط الطول: ${longitude}°\n` +
                    `نطاق المسافة: ${radiusMeters} متر\n\n` +
                    `✅ تم الحفظ في Google Sheets أيضاً`
                );
                console.log('✅ تم حفظ موقع العمل:', location);
            } else {
                showWarningMessage('⚠️ تم الحفظ محلياً فقط، لكن حفظ Google Sheets فشل:\n' + result.message);
            }
        }).catch(error => {
            showWarningMessage('⚠️ تم الحفظ محلياً فقط. خطأ في Google Sheets:\n' + error.message);
        });

    } catch (error) {
        console.error('Error saving location:', error);
        showErrorMessage('❌ فشل حفظ الموقع: ' + error.message);
    }
}

/**
 * حفظ أوقات العمل
 */
function saveWorkTimings() {
    const startTime = document.getElementById('workStartTime').value;
    const endTime = document.getElementById('workEndTime').value;

    if (!startTime || !endTime) {
        showWarningMessage('يرجى ملء جميع الأوقات');
        return;
    }

    const timings = {
        startTime: startTime,
        endTime: endTime
    };

    saveToLocalStorage('workTimings', timings);
    showSuccessMessage('تم حفظ أوقات العمل بنجاح');
}

/**
 * تنسيق العملة بـ الجنيه المصري
 */
function formatCurrency(amount) {
    return formatEgyptianCurrency(amount);
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

        // جلب البيانات الحقيقية من Google Sheets via Apps Script
        const result = await sheetsAPI.getDailyAttendanceReport();

        // إخفاء loading spinner
        hideLoadingSpinner();

        if (result.success && result.data && Array.isArray(result.data)) {
            console.log('✅ Attendance data loaded successfully:', result.data);
            console.log('📅 Report Date:', result.date);
            
            processDailyAttendanceData(result.data);
            displayDailyAttendanceReport();
            updateAttendanceStats();
            
            showSuccessMessage(`Loaded ${result.data.length} employees from Google Sheets`);
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
        tbody.innerHTML = `<tr><td colspan="4" class="text-center">${message}</td></tr>`;
        return;
    }

    dataToDisplay.forEach(emp => {
        const row = document.createElement('tr');
        const statusBadgeClass = emp.status === 'present' ? 'status-present' : 'status-absent';
        const statusText = emp.status === 'present' ? 'Present' : 'Not Checked In';
        
        row.innerHTML = `
            <td>${emp.id}</td>
            <td><strong>${emp.name}</strong></td>
            <td>${emp.checkInTime}</td>
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
 * عرض loading overlay
 */
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
