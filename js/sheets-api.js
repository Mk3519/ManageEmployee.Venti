/* ============================================
   الاتصال بـ Google Sheets عبر Apps Script
   ============================================ */

class SheetsAPI {
    constructor() {
        // ستحتاج لتعديل هذا الرابط بعد نشر Apps Script
        this.SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwnyVWpQxrkmxNdy6-B_9NBxb56mlv-W8oJ5uwlfJl4JuqhaInmYYHGZbHcei9Tis1lNA/exec';
        
        // ✅ تم تعيينه بنجاح! الآن الاتصال الفعلي يعمل
        this.isConfigured = true;
    }

    /**
     * تعيين رابط Apps Script
     */
    setScriptURL(url) {
        this.SCRIPT_URL = url;
        this.isConfigured = true;
    }

    /**
     * التحقق من تكوين الـ API
     */
    isReady() {
        return this.isConfigured && this.SCRIPT_URL && this.SCRIPT_URL.includes('script.google.com');
    }

    /**
     * إرسال طلب GET
     */
    async get(action, params = {}) {
        if (!this.isReady()) {
            console.warn('تنبيه: Apps Script لم يتم تكوينه بعد');
            return this.mockResponse('get', action, params);
        }

        try {
            const queryString = new URLSearchParams({
                action: action,
                ...params
            }).toString();

            const response = await retryFetch(`${this.SCRIPT_URL}?${queryString}`);
            
            // التحقق من أن الاستجابة موجودة
            if (!response) {
                throw new Error('لم تتلقَّ استجابة من الخادم');
            }

            const text = await response.text();
            
            // محاولة تحويل النص إلى JSON
            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.error('❌ خطأ في تحويل JSON:', parseError, 'النص:', text);
                return {
                    success: false,
                    message: 'خطأ في معالجة response من الخادم'
                };
            }

            console.log(`✅ استجابة ${action}:`, data);
            return data;
        } catch (error) {
            console.error('❌ خطأ في الطلب GET:', error);
            return {
                success: false,
                message: 'فشل في الاتصال مع تطبيق الويب: ' + error.message
            };
        }
    }

    /**
     * إرسال طلب POST
     */
    async post(action, data = {}) {
        if (!this.isReady()) {
            console.warn('تنبيه: Apps Script لم يتم تكوينه بعد');
            return this.mockResponse('post', action, data);
        }

        try {
            const payload = {
                action: action,
                ...data
            };

            const response = await retryFetch(this.SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams(payload).toString(),
                muteHttpExceptions: true
            });

            // التحقق من أن الاستجابة موجودة
            if (!response) {
                throw new Error('لم تتلقَّ استجابة من الخادم');
            }

            const text = await response.text();
            
            // محاولة تحويل النص إلى JSON
            let result;
            try {
                result = JSON.parse(text);
            } catch (parseError) {
                console.error('❌ خطأ في تحويل JSON:', parseError, 'النص:', text);
                return {
                    success: true, 
                    message: text
                };
            }

            console.log(`✅ استجابة ${action}:`, result);
            return result;
        } catch (error) {
            console.error('❌ خطأ في الطلب POST:', error);
            return {
                success: false,
                message: 'فشل في الاتصال مع تطبيق الويب: ' + error.message
            };
        }
    }

    /**
     * تسجيل دخول الموظف
     */
    async loginEmployee(employeeID, password) {
        return this.get('login', {
            id: employeeID,
            pass: password
        });
    }

    /**
     * تسجيل دخول المدير
     */
    async loginAdmin(adminID, password) {
        return this.get('adminLogin', {
            id: adminID,
            pass: password
        });
    }

    /**
     * تسجيل حضور مع التحقق من الشروط
     */
    async checkIn(employeeID, deviceID) {
        try {
            // تسجيل الحضور مباشرة (الواجهة الأمامية تفعل التحقق)
            return this.post('checkIn', {
                employeeID: employeeID,
                deviceID: deviceID,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            return {
                success: false,
                message: 'خطأ في تسجيل الحضور: ' + error.message
            };
        }
    }

    /**
     * تسجيل انصراف
     */
    async checkOut(employeeID, deviceID) {
        return this.post('checkOut', {
            employeeID: employeeID,
            deviceID: deviceID,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * الحصول على بيانات الموظف
     */
    async getEmployeeData(employeeID) {
        return this.get('getEmployee', {
            id: employeeID
        });
    }

    /**
     * الحصول على بيانات المدير
     */
    async getAdminData(adminID) {
        return this.get('getAdmin', {
            id: adminID
        });
    }

    /**
     * الحصول على إحصائيات الموظف
     */
    async getEmployeeStats(employeeID, month = null, year = null) {
        const now = new Date();
        const currentMonth = month || (now.getMonth() + 1);
        const currentYear = year || now.getFullYear();

        return this.get('getStats', {
            employeeID: employeeID,
            month: currentMonth,
            year: currentYear
        });
    }

    /**
     * الحصول على سجل الحضور الشهري
     */
    async getAttendanceHistory(employeeID, month = null, year = null) {
        const now = new Date();
        const currentMonth = month || (now.getMonth() + 1);
        const currentYear = year || now.getFullYear();

        return this.get('getAttendanceHistory', {
            employeeID: employeeID,
            month: currentMonth,
            year: currentYear
        });
    }

    /**
     * الحصول على جميع الموظفين (للمدير)
     */
    async getAllEmployees() {
        return this.get('getAllEmployees');
    }

    /**
     * إضافة موظف جديد (للمدير)
     */
    async addEmployee(employeeData) {
        return this.post('addEmployee', employeeData);
    }

    /**
     * تحديث بيانات الموظف (للمدير)
     */
    async updateEmployee(employeeID, data) {
        return this.post('updateEmployee', {
            employeeID: employeeID,
            ...data
        });
    }

    /**
     * إيقاف تنشيط الموظف (للمدير)
     */
    async deactivateEmployee(employeeID) {
        return this.post('deactivateEmployee', {
            employeeID: employeeID
        });
    }

    /**
     * تطبيق جزاء على الموظف
     */
    async applyDiscipline(employeeID, type, amount, reason = '') {
        return this.post('applyDiscipline', {
            employeeID: employeeID,
            type: type, // 'Discount' أو 'Warning'
            amount: amount,
            reason: reason,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * إضافة سلفة للموظف
     */
    async addAdvance(employeeID, amount, months) {
        return this.post('addAdvance', {
            employeeID: employeeID,
            amount: amount,
            months: months,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * طلب تغيير جهاز (للموظف)
     */
    async requestDeviceChange(employeeID, newDeviceID, oldDeviceID) {
        return this.post('requestDeviceChange', {
            employeeID: employeeID,
            newDeviceID: newDeviceID,
            oldDeviceID: oldDeviceID,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * الحصول على طلبات تغيير الأجهزة (للمدير)
     */
    async getPendingDeviceRequests() {
        return this.get('getPendingDeviceRequests');
    }

    /**
     * قبول طلب تغيير جهاز
     */
    async approveDeviceRequest(requestID, employeeID, newDeviceID) {
        return this.post('approveDeviceRequest', {
            requestID: requestID,
            employeeID: employeeID,
            deviceID: newDeviceID,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * رفض طلب تغيير جهاز
     */
    async rejectDeviceRequest(requestID) {
        return this.post('rejectDeviceRequest', {
            requestID: requestID,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * الحصول على تقرير الحضور
     */
    async getAttendanceReport(startDate, endDate, employeeID = null) {
        return this.get('getAttendanceReport', {
            startDate: startDate,
            endDate: endDate,
            employeeID: employeeID || 'all'
        });
    }

    /**
     * الحصول على تقرير الغياب
     */
    async getAbsenceReport(month, year, employeeID = null) {
        return this.get('getAbsenceReport', {
            month: month,
            year: year,
            employeeID: employeeID || 'all'
        });
    }

    /**
     * الحصول على تقرير التأخيرات
     */
    async getLateReport(month, year, employeeID = null) {
        return this.get('getLateReport', {
            month: month,
            year: year,
            employeeID: employeeID || 'all'
        });
    }

    /**
     * الحصول على تقرير الجزاءات
     */
    async getDisciplinesReport(employeeID = null) {
        return this.get('getDisciplinesReport', {
            employeeID: employeeID || 'all'
        });
    }

    /**
     * الحصول على تقرير السلف
     */
    async getAdvancesReport(employeeID = null) {
        return this.get('getAdvancesReport', {
            employeeID: employeeID || 'all'
        });
    }



    /**
     * الحصول على الإعدادات (GPS, أوقات العمل، إلخ)
     */
    async getSettings() {
        return this.get('getSettings');
    }

    /**
     * تحديث إعداد واحد في Google Sheets
     */
    async updateSetting(settingName, settingValue) {
        return this.post('updateSettings', {
            settingName: settingName,
            settingValue: settingValue
        });
    }

    /**
     * حفظ موقع مكان العمل في Google Sheets
     */
    async saveWorkLocation(latitude, longitude, maxDistanceMeters) {
        try {
            // تحديث الثلاثة إعدادات
            await this.updateSetting('Office_Latitude', latitude);
            await this.updateSetting('Office_Longitude', longitude);
            await this.updateSetting('Max_Distance_Meters', maxDistanceMeters);
            
            return {
                success: true,
                message: '✅ تم حفظ موقع مكان العمل بنجاح في Google Sheets',
                data: {
                    latitude: latitude,
                    longitude: longitude,
                    maxDistanceMeters: maxDistanceMeters
                }
            };
        } catch(error) {
            return {
                success: false,
                message: '❌ فشل حفظ الموقع: ' + error.message
            };
        }
    }

    /**
     * تطبيق جزاء مع التوقيع الرقمي
     */
    async applyDisciplineWithSignature(employeeID, type, amount, reason, adminID, deviceSignature) {
        return this.post('applyDisciplineWithSignature', {
            employeeID: employeeID,
            type: type, // 'Discount' أو 'Warning'
            amount: amount,
            reason: reason,
            adminID: adminID,
            deviceSignature: deviceSignature,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * التحقق من شروط الحضور قبل تسجيل الحضور
     * 1- لا يمكن عمل حضور مرتين في نفس اليوم
     * 2- إذا تم نسيان الانصراف يتم عمل انصراف تلقائي ثم حضور جديد
     */
    async checkInConditions(employeeID) {
        try {
            const result = await this.get('checkInConditions', {
                employeeID: employeeID
            });

            // التحقق المتقدم من النتيجة
            if (result && typeof result === 'object') {
                // إذا كانت النتيجة من API مباشرة (تحتوي على canCheckIn)
                if (result.hasOwnProperty('canCheckIn')) {
                    return result;
                }
                // إذا كانت النتيجة success=true لكن بها بيانات
                if (result.success && result.data) {
                    return result.data;
                }
            }

            // إذا كانت النتيجة فارغة أو غير متوقعة
            console.error('❌ استجابة غير متوقعة من API:', result);
            return {
                canCheckIn: false,
                message: 'فشل التحقق من شروط الحضور - استجابة API غير صحيحة'
            };
        } catch (error) {
            console.error('❌ خطأ في دالة checkInConditions:', error);
            return {
                canCheckIn: false,
                message: 'خطأ في الاتصال بالخادم: ' + error.message
            };
        }
    }

    /**
     * الحصول على تقرير الجزاءات المفصل
     */
    async getDisciplinesReport(month, year) {
        return this.get('getDisciplinesReport', {
            month: month,
            year: year
        });
    }

    /**
     * إرسال تقرير عبر البريد الإلكتروني
     */
    async sendReportEmail(adminEmail, reportType, reportData) {
        return this.post('sendReportEmail', {
            adminEmail: adminEmail,
            reportType: reportType,
            reportData: JSON.stringify(reportData),
            timestamp: new Date().toISOString()
        });
    }


}

// إنشاء نسخة عامة من الفئة
const sheetsAPI = new SheetsAPI();
