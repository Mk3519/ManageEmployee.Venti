/* ============================================
   معرّف الجهاز (Device Fingerprinting)
   ============================================ */

class DeviceFingerprint {
    constructor() {
        this.deviceID = null;
        this.deviceData = null;
        this.initDeviceID();
    }

    /**
     * إنشاء معرّف الجهاز
     */
    initDeviceID() {
        let deviceID = getFromLocalStorage('deviceID');
        
        if (!deviceID) {
            // إنشاء معرّف جديد للجهاز
            deviceID = this.generateDeviceID();
            saveToLocalStorage('deviceID', deviceID);
        }
        
        this.deviceID = deviceID;
        this.deviceData = this.getDeviceData();
    }

    /**
     * إنشاء معرّف الجهاز
     * يتكون من: User Agent + Screen Resolution + Timezone
     */
    generateDeviceID() {
        const userAgent = navigator.userAgent;
        const screenResolution = `${screen.width}x${screen.height}`;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timestamp = new Date().getTime();
        
        const deviceString = `${userAgent}|${screenResolution}|${timezone}|${timestamp}`;
        return this.hashDevice(deviceString);
    }

    /**
     * دالة تجزئة بسيطة
     */
    hashDevice(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // تحويل إلى 32-bit integer
        }
        return 'DEVICE_' + Math.abs(hash).toString(16);
    }

    /**
     * الحصول على بيانات الجهاز الشاملة
     */
    getDeviceData() {
        return {
            deviceID: this.deviceID,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            screenSize: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            onLine: navigator.onLine,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,
            maxTouchPoints: navigator.maxTouchPoints,
            platform: navigator.platform,
            vendor: navigator.vendor
        };
    }

    /**
     * الحصول على معرّف الجهاز
     */
    getID() {
        return this.deviceID;
    }

    /**
     * الحصول على بيانات الجهاز كاملة
     */
    getData() {
        return this.deviceData;
    }

    /**
     * مقارنة معرّف الجهاز الحالي مع معرّف آخر محفوظ
     */
    isCurrentDevice(savedDeviceID) {
        return this.deviceID === savedDeviceID;
    }

    /**
     * التحقق من تغيير الجهاز
     */
    hasDeviceChanged() {
        const approvedDevices = getFromLocalStorage('approvedDevices', []);
        return !approvedDevices.includes(this.deviceID);
    }

    /**
     * إضافة الجهاز الحالي إلى قائمة الأجهزة المعتمدة
     */
    approveCurrentDevice() {
        let approvedDevices = getFromLocalStorage('approvedDevices', []);
        if (!approvedDevices.includes(this.deviceID)) {
            approvedDevices.push(this.deviceID);
            saveToLocalStorage('approvedDevices', approvedDevices);
        }
    }

    /**
     * الحصول على قائمة الأجهزة المعتمدة
     */
    getApprovedDevices() {
        return getFromLocalStorage('approvedDevices', []);
    }

    /**
     * عرض معلومات الجهاز في صفحة تسجيل الدخول
     */
    displayDeviceInfo() {
        const element = document.getElementById('deviceInfo');
        if (!element) return;

        const info = `
            الجهاز: ${this.deviceData.platform} | 
            الشاشة: ${this.deviceData.screenResolution} | 
            المنطقة الزمنية: ${this.deviceData.timezone}
        `;
        element.textContent = info;
    }

    /**
     * إرسال بيانات الجهاز مع طلب المصادقة
     */
    getAuthPayload() {
        return {
            deviceID: this.deviceID,
            deviceData: {
                userAgent: this.deviceData.userAgent,
                screenResolution: this.deviceData.screenResolution,
                timezone: this.deviceData.timezone,
                language: this.deviceData.language
            }
        };
    }

    /**
     * التحقق من دعم الموقع الجغرافي
     */
    static isGeolocationSupported() {
        return 'geolocation' in navigator;
    }

    /**
     * الحصول على الموقع الجغرافي الحالي (محسّن)
     * @param {number} timeout - المدة القصوى بالميلي ثانية (افتراضي: 20 ثانية)
     * @param {boolean} highAccuracy - تفعيل دقة عالية (افتراضي: true)
     */
    static async getCurrentLocation(timeout = 20000, highAccuracy = true) {
        return new Promise((resolve, reject) => {
            if (!DeviceFingerprint.isGeolocationSupported()) {
                reject({
                    code: 0,
                    message: 'الموقع الجغرافي غير مدعوم في هذا الجهاز'
                });
                return;
            }

            const options = {
                enableHighAccuracy: highAccuracy,
                timeout: Math.min(timeout, 20000),  // حد أقصى 20 ثانية
                maximumAge: 5000  // استخدم بيانات حديثة جداً (5 ثوانٍ)
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: position.timestamp
                    });
                },
                (error) => {
                    reject({
                        code: error.code,
                        message: DeviceFingerprint.getGeolocationErrorMessage(error.code)
                    });
                },
                options
            );
        });
    }

    /**
     * الحصول على الموقع الجغرافي مع إعادة محاولة ذكية
     * محاولة أولى: enableHighAccuracy: false، timeout: 10 ثوانٍ
     * إذا فشلت + كود الخطأ ليس "permission denied" → محاولة ثانية مع enableHighAccuracy: true
     * @param {number} timeoutFirst - timeout للمحاولة الأولى (افتراضي: 10 ثوانٍ)
     * @param {number} timeoutSecond - timeout للمحاولة الثانية (افتراضي: 15 ثانية)
     * @returns {Promise<Object>} بيانات الموقع
     */
    static async getCurrentLocationWithRetry(timeoutFirst = 10000, timeoutSecond = 15000) {
        try {
            console.log('🔄 محاولة أولى للحصول على الموقع (enableHighAccuracy: false)...');
            const location = await DeviceFingerprint.getCurrentLocation(timeoutFirst, false);
            console.log('✅ تم الحصول على الموقع في المحاولة الأولى');
            return location;
        } catch (firstError) {
            // إذا كان الخطأ "permission denied" - لا نحاول مرة أخرى
            if (firstError.code === 1) {
                console.error('❌ تم رفض إذن الموقع (Permission Denied)');
                throw firstError;
            }

            // محاولة ثانية مع enableHighAccuracy: true فقط إذا لم يكن permission denied
            try {
                console.log('🔄 محاولة ثانية للحصول على الموقع (enableHighAccuracy: true)...');
                const location = await DeviceFingerprint.getCurrentLocation(timeoutSecond, true);
                console.log('✅ تم الحصول على الموقع في المحاولة الثانية');
                return location;
            } catch (secondError) {
                console.error('❌ فشلت المحاولة الثانية أيضاً:', secondError.message);
                throw secondError;
            }
        }
    }

    /**
     * حساب المسافة بين نقطتين (Haversine formula)
     */
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // نصف قطر الأرض بالكيلومتر
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return distance;
    }

    /**
     * التحقق من أن الموظف داخل نطاق المكتب
     */
    static async isWithinOfficeRange(officeLatitude, officeLongitude, maxDistanceKm = 1) {
        try {
            const location = await DeviceFingerprint.getCurrentLocation();
            const distance = DeviceFingerprint.calculateDistance(
                location.latitude,
                location.longitude,
                parseFloat(officeLatitude),
                parseFloat(officeLongitude)
            );

            return {
                within: distance <= maxDistanceKm,
                distance: distance.toFixed(2),
                location: location
            };
        } catch (error) {
            return {
                within: false,
                distance: null,
                error: error.message
            };
        }
    }

    /**
     * رسالة خطأ GPS
     */
    static getGeolocationErrorMessage(code) {
        const messages = {
            0: 'خطأ غير محدد في الموقع الجغرافي',
            1: 'لم يتم منح إذن الوصول للموقع. يرجى تفعيل الموقع',
            2: 'تعذر الحصول على الموقع. تأكد من تفعيل GPS',
            3: 'تأخر في الحصول على الموقع. تأكد من إتصال GPS جيد وحاول مرة أخرى'
        };
        return messages[code] || 'خطأ غير معروف';
    }

    /**
     * تحويل الإحداثيات إلى عنوان (Reverse Geocoding)
     */
    static async getAddressFromCoordinates(latitude, longitude) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                { headers: { 'User-Agent': 'AttendanceSystem/1.0' } }
            );
            
            const data = await response.json();
            return data.address ? data.address.city || data.address.town || data.display_name : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * التحقق الآمن من الموقع
     */
    static async verifyLocationSafety(officeLatitude, officeLongitude, maxDistanceKm = 1) {
        try {
            const result = await DeviceFingerprint.isWithinOfficeRange(
                officeLatitude,
                officeLongitude,
                maxDistanceKm
            );

            if (result.within) {
                return {
                    safe: true,
                    message: `أنت داخل نطاق المكتب (${result.distance} كم)`,
                    location: result.location
                };
            } else {
                return {
                    safe: false,
                    message: `أنت خارج نطاق المكتب (${result.distance} كم)`,
                    location: result.location
                };
            }
        } catch (error) {
            return {
                safe: false,
                message: 'خطأ في التحقق: ' + error.message,
                error: error
            };
        }
    }
}

// إنشاء نسخة عامة من الفئة
const deviceFingerprint = new DeviceFingerprint();
