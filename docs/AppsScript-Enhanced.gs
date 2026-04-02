/* ============================================
   نظام الحضور والانصراف - Apps Script محسّن
   مع GPS, التوقيع الرقمي, وتقارير متقدمة
   ============================================ */

const SPREADSHEET_ID = "1Uhht7wSFYJx9NrtP965pBGUHASTtyQZptugu2AtTnTk";
let ss = null;

/**
 * دالة تهيئة قاعدة البيانات (تشغيل مرة واحدة)
 */
function initializeDatabase() {
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('✅ تم فتح Google Sheet بنجاح: ' + SPREADSHEET_ID);
    Logger.log('📊 عدد الأوراق الحالية: ' + ss.getSheets().length);
    
    // تسجيل أسماء الأوراق الموجودة
    const sheetNames = ss.getSheets().map(sheet => sheet.getName());
    Logger.log('📄 الأوراق الموجودة: ' + sheetNames.join(', '));
    
    // حذف الجداول القديمة إن وُجدت
    Logger.log('🧹 جاري حذف الجداول القديمة...');
    deleteSheetIfExists('Locations');
    deleteSheetIfExists('Settings');
    
    // إنشاء الجداول الجديدة
    Logger.log('🔨 جاري إنشاء الجداول الجديدة...');
    createLocationsSheet();
    createSettingsSheet();
    
    Logger.log('📊 عدد الأوراق بعد الإنشاء: ' + ss.getSheets().length);
    const finalSheetNames = ss.getSheets().map(sheet => sheet.getName());
    Logger.log('📄 الأوراق النهائية: ' + finalSheetNames.join(', '));
    
    Logger.log('✅✅✅ تم تهيئة قاعدة البيانات بنجاح - افتح Google Sheet وستجد الجداول!');
  } catch(error) {
    Logger.log('❌ خطأ في تهيئة قاعدة البيانات: ' + error.toString());
  }
}

/**
 * حذف جدول إذا كان موجوداً
 */
function deleteSheetIfExists(sheetName) {
  try {
    const sheet = ss.getSheetByName(sheetName);
    ss.deleteSheet(sheet);
    Logger.log('✅ تم حذف جدول ' + sheetName);
  } catch(e) {
    Logger.log('ℹ️ جدول ' + sheetName + ' غير موجود (لا بأس)');
  }
}

/**
 * إنشاء جدول الموقع الجغرافي
 */
function createLocationsSheet() {
  try {
    const sheet = ss.insertSheet('Locations');
    const headers = ['Employee_ID', 'Latitude', 'Longitude', 'Accuracy', 'Timestamp', 'Status', 'Address', 'Check_Type'];
    sheet.appendRow(headers);
    
    // تنسيق الرؤوس
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1e88e5');
    headerRange.setFontColor('white');
    headerRange.setFontWeight('bold');
    
    Logger.log('✅✅ تم إنشاء جدول Locations بنجاح مع التنسيق');
  } catch(error) {
    Logger.log('❌ خطأ في إنشاء Locations: ' + error.toString());
  }
}

/**
 * إنشاء جدول الإعدادات
 */
function createSettingsSheet() {
  try {
    const sheet = ss.insertSheet('Settings');
    Logger.log('✅ تم إنشاء الورقة بنجاح');
    
    // إضافة الرؤوس
    sheet.appendRow(['Setting', 'Value']);
    Logger.log('✅ تم إضافة الرؤوس');
    
    // إضافة البيانات
    const settingRows = [
      ['Max_Distance_Meters', '50'],           // تعديل: من KM إلى Meters
      ['Office_Latitude', '24.7136'],
      ['Office_Longitude', '46.6753'],
      ['Location_Required', 'true'],
      ['GPS_Timeout_Seconds', '30'],
      ['Work_Start_Time', '08:00'],
      ['Work_End_Time', '17:00'],
      ['Late_After_MINUTES', '10']
    ];
    
    settingRows.forEach(row => sheet.appendRow(row));
    Logger.log('✅ تم إضافة ' + settingRows.length + ' صفوف من البيانات');
    
    // تنسيق الرؤوس
    const headerRange = sheet.getRange(1, 1, 1, 2);
    headerRange.setBackground('#1e88e5');
    headerRange.setFontColor('white');
    headerRange.setFontWeight('bold');
    Logger.log('✅ تم تطبيق التنسيق');
    
    Logger.log('✅✅✅ تم إنشاء جدول Settings بنجاح مع كل البيانات!');
  } catch(error) {
    Logger.log('❌ خطأ في إنشاء Settings: ' + error.toString());
  }
}

/**
 * معالج الطلبات GET
 */
function doGet(e) {
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const action = e.parameter.action;
    
    switch(action) {
      case 'login':
        return handleEmployeeLogin(e);
      case 'adminLogin':
        return handleAdminLogin(e);
      case 'getEmployee':
        return handleGetEmployee(e);
      case 'getAdmin':
        return handleGetAdmin(e);
      case 'getStats':
        return handleGetStats(e);
      case 'getAttendanceHistory':
        return handleGetAttendanceHistory(e);
      case 'getAllEmployees':
        return handleGetAllEmployees(e);
      case 'getPendingDeviceRequests':
        return handleGetPendingDeviceRequests(e);
      case 'getAttendanceReport':
        return handleGetAttendanceReport(e);
      case 'getAbsenceReport':
        return handleGetAbsenceReport(e);
      case 'getLateReport':
        return handleGetLateReport(e);
      case 'getDisciplinesReport':
        return handleGetDisciplinesReport(e);
      case 'getAdvancesReport':
        return handleGetAdvancesReport(e);
      case 'getSettings':
        return handleGetSettings(e);
      case 'checkInConditions':
        return handleCheckInConditions(e);
      default:
        return jsonResponse({ success: false, message: 'إجراء غير معروف' });
    }
  } catch(error) {
    return jsonResponse({ success: false, message: 'خطأ في GET: ' + error.toString() });
  }
}

/**
 * معالج الطلبات POST
 */
function doPost(e) {
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const action = e.parameter.action;
    
    switch(action) {
      case 'checkIn':
        return handleCheckIn(e);
      case 'checkOut':
        return handleCheckOut(e);
      case 'addEmployee':
        return handleAddEmployee(e);
      case 'updateEmployee':
        return handleUpdateEmployee(e);
      case 'deactivateEmployee':
        return handleDeactivateEmployee(e);
      case 'applyDiscipline':
        return handleApplyDiscipline(e);
      case 'addAdvance':
        return handleAddAdvance(e);
      case 'requestDeviceChange':
        return handleRequestDeviceChange(e);
      case 'approveDeviceRequest':
        return handleApproveDeviceRequest(e);
      case 'rejectDeviceRequest':
        return handleRejectDeviceRequest(e);
      case 'applyDisciplineWithSignature':
        return handleApplyDisciplineWithSignature(e);
      case 'updateSettings':
        return handleUpdateSettings(e);
      default:
        return jsonResponse({ success: false, message: 'إجراء غير معروف' });
    }
  } catch(error) {
    return jsonResponse({ success: false, message: 'خطأ في POST: ' + error.toString() });
  }
}

// ============================================
// دالات المصادقة
// ============================================

function handleEmployeeLogin(e) {
  const employeeID = e.parameter.id;
  const password = e.parameter.pass;
  
  try {
    const employeesSheet = ss.getSheetByName('Employees');
    const data = employeesSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(employeeID) && String(data[i][6]) === String(password)) {
        
        // التحقق من حالة الموظف
        if (String(data[i][7]) !== 'Active') {
          return jsonResponse({
            success: false,
            message: 'حسابك قيد الإيقاف'
          });
        }
        
        return jsonResponse({
          success: true,
          message: 'تم تسجيل الدخول بنجاح',
          userRole: 'employee',
          userData: {
            id: data[i][0],
            name: data[i][1],
            position: data[i][2],
            salary: data[i][3],
            phone: data[i][4],
            email: data[i][5]
          }
        });
      }
    }
    
    return jsonResponse({
      success: false,
      message: 'بيانات تسجيل الدخول غير صحيحة'
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ في المصادقة: ' + error.toString()
    });
  }
}

function handleAdminLogin(e) {
  const adminID = e.parameter.id;
  const password = e.parameter.pass;
  
  try {
    const adminsSheet = ss.getSheetByName('Admins');
    const data = adminsSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(adminID) && String(data[i][3]) === String(password)) {
        return jsonResponse({
          success: true,
          message: 'تم تسجيل دخول المدير بنجاح',
          userRole: 'admin',
          userData: {
            id: data[i][0],
            name: data[i][1],
            email: data[i][2]
          }
        });
      }
    }
    
    return jsonResponse({
      success: false,
      message: 'بيانات تسجيل الدخول غير صحيحة'
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ في المصادقة: ' + error.toString()
    });
  }
}

// ============================================
// دالات الحضور والانصراف مع GPS
// ============================================

/**
 * معالج طلب التحقق من شروط الحضور
 */
function handleCheckInConditions(e) {
  const employeeID = e.parameter.employeeID;
  
  try {
    const validation = validateCheckInConditions(employeeID, new Date().toISOString());
    return jsonResponse(validation);
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ في التحقق من الشروط: ' + error.toString()
    });
  }
}

/**
 * التحقق من شروط الحضور:
 * 1- لا يمكن عمل حضور مرتين في نفس اليوم
 * 2- إذا تم نسيان الانصراف يتم عمل انصراف تلقائي للامس ثم حضور جديد
 */
function validateCheckInConditions(employeeID, timestamp) {
  try {
    const attendanceSheet = ss.getSheetByName('Attendance');
    const data = attendanceSheet.getDataRange().getValues();
    const currentDate = formatDate(new Date(timestamp));
    const currentTime = formatTime(new Date(timestamp));
    
    // البحث عن آخر تسجيل للموظف
    let lastCheckInRow = -1;
    let lastCheckInDate = null;
    let lastCheckInHasCheckOut = true;
    
    for (let i = data.length - 1; i > 0; i--) {
      if (String(data[i][0]) === String(employeeID)) {
        lastCheckInRow = i;
        // ✅ تنسيق التاريخ بصيغة DD/MM/YYYY إذا كان Date، أو استخدم كما هو إذا كان string
        lastCheckInDate = typeof data[i][1] === 'object' && data[i][1] instanceof Date
          ? formatDate(data[i][1])
          : String(data[i][1]);
        lastCheckInHasCheckOut = data[i][3] !== ''; // إذا كان في العمود 4 شيء = يوجد check-out
        break;
      }
    }
    
    // إذا لم يكن هناك أي تسجيل سابق
    if (lastCheckInRow === -1) {
      return {
        canCheckIn: true,
        autoCheckOut: false,
        reason: 'first_check_in'
      };
    }
    
    // الحالة 1: يوجد check-in في نفس اليوم
    if (isSameDateString(lastCheckInDate, currentDate)) {
      if (lastCheckInHasCheckOut) {
        // يوجد حضور و انصراف في نفس اليوم - ممنوع حضور ثاني
        return {
          canCheckIn: false,
          reason: 'already_checked_in_today',
          message: '❌ تم تسجيل الحضور بالفعل اليوم. لا يمكن عمل حضور مرتين في نفس اليوم'
        };
      } else {
        // يوجد حضور بدون انصراف في نفس اليوم - ممنوع حضور ثاني
        return {
          canCheckIn: false,
          reason: 'pending_check_out_today',
          message: '❌ يوجد حضور بدون انصراف في نفس اليوم. يرجى عمل انصراف أولاً'
        };
      }
    }
    
  if (!lastCheckInHasCheckOut) {
    return {
      canCheckIn: true,        // ✅ يسمح بالحضور
      autoCheckOut: false,     // ❌ يمنع الانصراف التلقائي
      reason: 'missing_checkout_previous_day',
      message: '⚠️ يوجد يوم سابق بدون انصراف، تم تسجيل حضور اليوم بشكل طبيعي'
    };
  }
    
    // الحالة 3: كل شيء طبيعي
    return {
      canCheckIn: true,
      autoCheckOut: false,
      reason: 'normal_check_in',
      message: '✅ يمكنك تسجيل الحضور الآن'
    };
    
  } catch(error) {
    Logger.log('❌ خطأ في التحقق من شروط الحضور: ' + error.toString());
    return {
      canCheckIn: false,
      reason: 'validation_error',
      message: 'خطأ في التحقق من الشروط: ' + error.toString()
    };
  }
}

function handleCheckIn(e) {
  const employeeID = e.parameter.employeeID;
  const deviceID = e.parameter.deviceID;
  const timestamp = e.parameter.timestamp;
  
  try {
    const attendanceSheet = ss.getSheetByName('Attendance');

    // ✅ إنشاء التاريخ بشكل صحيح (بتوقيت مصر)
    const dateObj = timestamp ? new Date(timestamp) : new Date();

    // ✅ الوقت فقط كـ string
    const time = Utilities.formatDate(dateObj, "Africa/Cairo", "HH:mm:ss");

    // ✅ التحقق من شروط الحضور
    const validation = validateCheckInConditions(employeeID, dateObj.toISOString());

    if (!validation.canCheckIn) {
      return jsonResponse({
        success: false,
        reason: validation.reason,
        message: validation.message || 'لا يمكن تسجيل الحضور'
      });
    }



    // ✅ تسجيل الحضور (التاريخ كـ Date object)
    attendanceSheet.appendRow([
      employeeID,
      dateObj,   // 🔥 أهم تعديل (Date object)
      time,
      '',
      '',
      deviceID,
      'حاضر'
    ]);

    return jsonResponse({
      success: true,
      message: '✅ تم تسجيل الحضور بنجاح'
    });

  } catch (error) {
    return jsonResponse({
      success: false,
      message: '❌ خطأ في تسجيل الحضور: ' + error.toString()
    });
  }
}

function handleCheckOut(e) {
  const employeeID = e.parameter.employeeID;
  const timestamp = e.parameter.timestamp;
  
  try {
    const attendanceSheet = ss.getSheetByName('Attendance');
    const data = attendanceSheet.getDataRange().getValues();
    const currentDate = formatDate(new Date(timestamp));
    const time = formatTime(new Date(timestamp));
    
    Logger.log(`🔍 البحث عن سجل حضور للموظف ${employeeID} في التاريخ ${currentDate}`);
    
    for (let i = data.length - 1; i > 0; i--) {
      if (String(data[i][0]).trim() !== String(employeeID).trim()) {
        continue; // غير هذا الموظف
      }
      
      // ✅ تحويل آمن للتاريخ
      let recordDate = data[i][1];
      if (recordDate instanceof Date) {
        recordDate = formatDate(recordDate);
      } else {
        recordDate = String(recordDate).trim();
      }
      
      Logger.log(`📅 فحص السجل: تاريخ="${recordDate}", حالة check-out="${data[i][3] || ''}"`);
      
      // ✅ مقارنة آمنة للتاريخ
      if (isSameDateString(recordDate, currentDate) && (data[i][3] === '' || data[i][3] === null || data[i][3] === undefined)) {
        Logger.log(`✅ وُجد سجل حضور بدون انصراف في ${recordDate}`);
        
        try {
          const checkInTimeStr = String(data[i][2]).trim();
          if (!checkInTimeStr || checkInTimeStr === '--') {
            Logger.log(`⚠️ وقت الحضور فارغ أو غير صحيح: "${checkInTimeStr}"`);
            continue;
          }
          
          const checkInTime = new Date('2000-01-01 ' + checkInTimeStr);
          const checkOutTime = new Date('2000-01-01 ' + time);
          const durationMs = checkOutTime - checkInTime;
          const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(2);
          
          Logger.log(`⏱️ حساب المدة: check-in="${checkInTimeStr}", check-out="${time}", مدة=${durationHours} ساعة`);
          
          attendanceSheet.getRange(i + 1, 4).setValue(time);
          attendanceSheet.getRange(i + 1, 5).setValue(durationHours);
          
          Logger.log(`✅ تم تسجيل الانصراف بنجاح - الموظف: ${employeeID} في ${currentDate} الساعة ${time}`);
          
          return jsonResponse({
            success: true,
            message: '✅ تم تسجيل الانصراف بنجاح'
          });
        } catch(calcError) {
          Logger.log(`⚠️ خطأ في حساب المدة: ${calcError.toString()}`);
          continue;
        }
      }
    }
    
    Logger.log(`❌ لم يتم العثور على سجل حضور بدون انصراف للموظف ${employeeID} في ${currentDate}`);
    return jsonResponse({
      success: false,
      message: '❌ لم يتم العثور على تسجيل حضور للانصراف. تأكد أنك سجلت حضور أولاً'
    });
  } catch(error) {
    Logger.log(`❌ خطأ في handleCheckOut: ${error.toString()}`);
    return jsonResponse({
      success: false,
      message: 'خطأ في تسجيل الانصراف: ' + error.toString()
    });
  }
}

// ============================================
// دالات جلب البيانات المحسنة
// ============================================

function handleGetEmployee(e) {
  const employeeID = e.parameter.id;
  
  try {
    const employeesSheet = ss.getSheetByName('Employees');
    const data = employeesSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(employeeID)) {
        return jsonResponse({
          success: true,
          data: {
            id: data[i][0],
            name: data[i][1],
            position: data[i][2],
            salary: data[i][3],
            phone: data[i][4],
            email: data[i][5],
            status: data[i][7]
          }
        });
      }
    }
    
    return jsonResponse({
      success: false,
      message: 'لم يتم العثور على الموظف'
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

function handleGetAdmin(e) {
  const adminID = e.parameter.id;
  
  try {
    const adminsSheet = ss.getSheetByName('Admins');
    const data = adminsSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(adminID)) {
        return jsonResponse({
          success: true,
          data: {
            id: data[i][0],
            name: data[i][1],
            email: data[i][2]
          }
        });
      }
    }
    
    return jsonResponse({
      success: false,
      message: 'لم يتم العثور على المدير'
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

function handleGetStats(e) {
  const employeeID = e.parameter.employeeID;
  const month = parseInt(e.parameter.month) || new Date().getMonth() + 1;
  const year = parseInt(e.parameter.year) || new Date().getFullYear();
  
  try {
    Logger.log(`📊 حساب الإحصائيات للموظف ${employeeID} - ${month}/${year}`);
    
    let stats = {
      totalAttendance: 0,
      totalAbsence: 0,
      totalLeave: 0,
      totalLate: 0,
      totalDiscount: 0,
      totalWarning: 0,
      workDays: 22
    };
    
    // ============================================
    // حساب الحضور
    // ============================================
    const attendanceSheet = ss.getSheetByName('Attendance');
    const attendanceData = attendanceSheet.getDataRange().getValues();
    Logger.log(`📋 عدد صفوف الحضور: ${attendanceData.length}`);
    
    for (let i = 1; i < attendanceData.length; i++) {
      if (!attendanceData[i][0]) continue; // تخطي الصفوف الفارغة
      
      if (String(attendanceData[i][0]).trim() === String(employeeID).trim()) {
        let dateStr = attendanceData[i][1];
        
        if (!dateStr) {
          Logger.log(`⚠️ تاريخ فارغ في صف الحضور ${i}`);
          continue;
        }
        
        // تحويل آمن للتاريخ
        let formattedDate = dateStr;
        if (dateStr instanceof Date) {
          formattedDate = formatDate(dateStr);
        } else {
          formattedDate = String(dateStr).trim();
        }
        
        try {
          const dateParts = formattedDate.split('/');
          if (dateParts.length !== 3) throw new Error('صيغة خاطئة');
          
          const recordMonth = parseInt(dateParts[1]);
          const recordYear = parseInt(dateParts[2]);
          
          if (recordMonth === month && recordYear === year) {
            stats.totalAttendance++;
            Logger.log(`✅ حضور: ${formattedDate}`);
            
            // فحص التأخير
            const checkInTime = attendanceData[i][2];
            if (checkInTime && String(checkInTime).trim() > '08:00') {
              stats.totalLate++;
              Logger.log(`⏰ تأخير: ${checkInTime}`);
            }
          }
        } catch(e) {
          Logger.log(`⚠️ خطأ في التاريخ "${formattedDate}": ${e.toString()}`);
        }
      }
    }
    
    // ============================================
    // حساب الجزاءات والإنذارات
    // ============================================
    try {
      const disciplinesSheet = ss.getSheetByName('Disciplines');
      const disciplinesData = disciplinesSheet.getDataRange().getValues();
      Logger.log(`📋 عدد صفوف الجزاءات: ${disciplinesData.length}`);
      
      for (let i = 1; i < disciplinesData.length; i++) {
        if (!disciplinesData[i][0]) continue;
        
        if (String(disciplinesData[i][0]).trim() === String(employeeID).trim()) {
          let dateStr = disciplinesData[i][3];
          
          if (!dateStr) continue;
          
          let formattedDate = dateStr;
          if (dateStr instanceof Date) {
            formattedDate = formatDate(dateStr);
          } else {
            formattedDate = String(dateStr).trim();
          }
          
          try {
            const dateParts = formattedDate.split('/');
            const recordMonth = parseInt(dateParts[1]);
            const recordYear = parseInt(dateParts[2]);
            
            if (recordMonth === month && recordYear === year) {
              const type = String(disciplinesData[i][1]).trim();
              if (type === 'Discount') {
                const amount = parseInt(disciplinesData[i][2]) || 0;
                stats.totalDiscount += amount;
                Logger.log(`💰 خصم: ${amount} ج.م`);
              } else if (type === 'Warning') {
                stats.totalWarning++;
                Logger.log(`⚠️ إنذار`);
              }
            }
          } catch(e) {
            Logger.log(`⚠️ خطأ في جزاء: ${e.toString()}`);
          }
        }
      }
    } catch(e) {
      Logger.log(`❌ خطأ في قراءة جدول الجزاءات: ${e.toString()}`);
    }
    
    // ============================================
    // حساب الإجازات
    // ============================================
    try {
      const leaveSheet = ss.getSheetByName('Leave');
      const leaveData = leaveSheet.getDataRange().getValues();
      Logger.log(`📋 عدد صفوف الإجازات: ${leaveData.length}`);
      
      for (let i = 1; i < leaveData.length; i++) {
        if (!leaveData[i][0]) continue;
        
        if (String(leaveData[i][0]).trim() === String(employeeID).trim()) {
          const status = String(leaveData[i][5]).trim();
          if (status === 'Approved' || status === 'Active') {
            const days = parseInt(leaveData[i][2]) || 0;
            stats.totalLeave += days;
            Logger.log(`🏖️ إجازة: ${days} يوم (${status})`);
          }
        }
      }
    } catch(e) {
      Logger.log(`❌ خطأ في قراءة جدول الإجازات: ${e.toString()}`);
    }
    
    // حساب الغياب
    stats.totalAbsence = Math.max(0, stats.workDays - stats.totalAttendance - stats.totalLeave);
    
    Logger.log(`📊 الإحصائيات النهائية: ${JSON.stringify(stats)}`);
    
    return jsonResponse({
      success: true,
      data: stats
    });
    
  } catch(error) {
    Logger.log(`❌ خطأ في handleGetStats: ${error.toString()}`);
    return jsonResponse({
      success: false,
      message: 'خطأ في حساب الإحصائيات: ' + error.toString()
    });
  }
}

function handleGetAttendanceHistory(e) {
  const employeeID = e.parameter.employeeID;
  const month = parseInt(e.parameter.month) || new Date().getMonth() + 1;
  const year = parseInt(e.parameter.year) || new Date().getFullYear();
  
  try {
    const attendanceSheet = ss.getSheetByName('Attendance');
    const data = attendanceSheet.getDataRange().getValues();
    const history = [];
    
    Logger.log(`🔍 البحث عن سجلات الموظف ${employeeID} للشهر ${month}/${year}`);
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(employeeID).trim()) {
        let dateStr = data[i][1];
        
        if (!dateStr) {
          Logger.log(`⚠️ تاريخ فارغ في الصف ${i}`);
          continue;
        }
        
        // تحويل آمن للتاريخ إلى صيغة DD/MM/YYYY
        let formattedDate = dateStr;
        if (dateStr instanceof Date) {
          formattedDate = formatDate(dateStr);
        } else {
          formattedDate = String(dateStr).trim();
        }
        
        Logger.log(`📅 معالجة التاريخ: "${formattedDate}"`);
        
        try {
          const dateParts = formattedDate.split('/');
          if (dateParts.length !== 3) {
            Logger.log(`❌ صيغة التاريخ غير صحيحة: "${formattedDate}"`);
            continue;
          }
          
          const recordMonth = parseInt(dateParts[1]);
          const recordYear = parseInt(dateParts[2]);
          
          // مقارنة الشهر والسنة
          if (recordMonth === month && recordYear === year) {
            // ✅ تحويل آمن للأوقات من Date objects إلى strings
            let checkInTime = data[i][2];
            if (checkInTime instanceof Date) {
              checkInTime = formatTime(checkInTime);
            } else {
              checkInTime = String(checkInTime).trim() || '--';
            }
            
            let checkOutTime = data[i][3];
            if (checkOutTime instanceof Date) {
              checkOutTime = formatTime(checkOutTime);
            } else {
              checkOutTime = String(checkOutTime).trim() || '--';
            }
            
            const record = {
              date: formattedDate,
              checkIn: checkInTime,
              checkOut: checkOutTime,
              duration: data[i][4] || '--',
              deviceID: data[i][5] || '--',
              status: data[i][6] || '--'
            };
            
            Logger.log(`✅ تم إضافة سجل: ${JSON.stringify(record)}`);
            history.push(record);
          }
        } catch(e) {
          Logger.log(`⚠️ خطأ في معالجة التاريخ "${formattedDate}": ${e.toString()}`);
        }
      }
    }
    
    Logger.log(`✅ تم جلب ${history.length} سجل للموظف ${employeeID}`);
    
    return jsonResponse({
      success: true,
      data: history.reverse() // الأحدث أولاً
    });
    
  } catch(error) {
    Logger.log(`❌ خطأ في handleGetAttendanceHistory: ${error.toString()}`);
    return jsonResponse({
      success: false,
      message: 'خطأ في جلب سجل الحضور: ' + error.toString()
    });
  }
}

function handleGetAllEmployees(e) {
  try {
    const employeesSheet = ss.getSheetByName('Employees');
    const data = employeesSheet.getDataRange().getValues();
    const employees = [];
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][7]) === 'Active') {
        employees.push({
          id: data[i][0],
          name: data[i][1],
          position: data[i][2],
          salary: data[i][3],
          phone: data[i][4],
          email: data[i][5],
          status: data[i][7]
        });
      }
    }
    
    return jsonResponse({
      success: true,
      data: employees
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

function handleGetPendingDeviceRequests(e) {
  try {
    const devicesSheet = ss.getSheetByName('Devices');
    const data = devicesSheet.getDataRange().getValues();
    const pending = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === 'Pending') {
        // الحصول على اسم الموظف
        const empName = getEmployeeName(data[i][0]);
        pending.push({
          employeeID: data[i][0],
          employeeName: empName,
          deviceID: data[i][1],
          status: data[i][2],
          requestDate: data[i][3]
        });
      }
    }
    
    return jsonResponse({
      success: true,
      data: pending
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

// ============================================
// التقارير المتقدمة
// ============================================

function handleGetAttendanceReport(e) {
  const month = parseInt(e.parameter.month) || new Date().getMonth() + 1;
  const year = parseInt(e.parameter.year) || new Date().getFullYear();
  
  try {
    const attendanceSheet = ss.getSheetByName('Attendance');
    const employeesSheet = ss.getSheetByName('Employees');
    const attendanceData = attendanceSheet.getDataRange().getValues();
    const employeesData = employeesSheet.getDataRange().getValues();
    
    const report = [];
    const employeeRecords = {};
    
    // تجميع السجلات حسب الموظف
    for (let i = 1; i < attendanceData.length; i++) {
      const dateStr = attendanceData[i][1];
      if (dateStr) {
        const dateParts = dateStr.split('/');
        const recordMonth = parseInt(dateParts[1]);
        const recordYear = parseInt(dateParts[2]);
        
        if (recordMonth === month && recordYear === year) {
          const empID = attendanceData[i][0];
          if (!employeeRecords[empID]) {
            employeeRecords[empID] = [];
          }
          employeeRecords[empID].push({
            date: attendanceData[i][1],
            checkIn: attendanceData[i][2],
            checkOut: attendanceData[i][3],
            duration: attendanceData[i][4],
            status: attendanceData[i][6]
          });
        }
      }
    }
    
    // بناء التقرير
    for (let empID in employeeRecords) {
      const empName = getEmployeeName(empID);
      report.push({
        employeeID: empID,
        employeeName: empName,
        records: employeeRecords[empID]
      });
    }
    
    return jsonResponse({
      success: true,
      data: report
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

function handleGetAbsenceReport(e) {
  const month = parseInt(e.parameter.month) || new Date().getMonth() + 1;
  const year = parseInt(e.parameter.year) || new Date().getFullYear();
  
  try {
    const employeesSheet = ss.getSheetByName('Employees');
    const attendanceSheet = ss.getSheetByName('Attendance');
    const leaveSheet = ss.getSheetByName('Leave');
    
    const employeesData = employeesSheet.getDataRange().getValues();
    const attendanceData = attendanceSheet.getDataRange().getValues();
    const leaveData = leaveSheet.getDataRange().getValues();
    
    const report = [];
    const workDays = 22;
    
    for (let i = 1; i < employeesData.length; i++) {
      const empID = employeesData[i][0];
      const empName = employeesData[i][1];
      
      // حساب الحضور
      let attendanceCount = 0;
      for (let j = 1; j < attendanceData.length; j++) {
        if (String(attendanceData[j][0]) === String(empID)) {
          const dateStr = attendanceData[j][1];
          if (dateStr) {
            const dateParts = dateStr.split('/');
            const recordMonth = parseInt(dateParts[1]);
            const recordYear = parseInt(dateParts[2]);
            
            if (recordMonth === month && recordYear === year) {
              attendanceCount++;
            }
          }
        }
      }
      
      // حساب الإجازات
      let leaveCount = 0;
      for (let j = 1; j < leaveData.length; j++) {
        if (String(leaveData[j][0]) === String(empID) && (leaveData[j][5] === 'Approved' || leaveData[j][5] === 'Active')) {
          leaveCount += parseInt(leaveData[j][2]) || 0;
        }
      }
      
      const absenceCount = Math.max(0, workDays - attendanceCount - leaveCount);
      
      if (absenceCount > 0) {
        report.push({
          employeeID: empID,
          employeeName: empName,
          absenceDays: absenceCount
        });
      }
    }
    
    return jsonResponse({
      success: true,
      data: report
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

function handleGetLateReport(e) {
  const month = parseInt(e.parameter.month) || new Date().getMonth() + 1;
  const year = parseInt(e.parameter.year) || new Date().getFullYear();
  
  try {
    const attendanceSheet = ss.getSheetByName('Attendance');
    const data = attendanceSheet.getDataRange().getValues();
    const report = [];
    
    for (let i = 1; i < data.length; i++) {
      const dateStr = data[i][1];
      if (dateStr) {
        const dateParts = dateStr.split('/');
        const recordMonth = parseInt(dateParts[1]);
        const recordYear = parseInt(dateParts[2]);
        
        if (recordMonth === month && recordYear === year) {
          const checkIn = data[i][2];
          if (checkIn && checkIn > '08:00') {
            report.push({
              employeeID: data[i][0],
              employeeName: getEmployeeName(data[i][0]),
              date: data[i][1],
              checkIn: checkIn
            });
          }
        }
      }
    }
    
    return jsonResponse({
      success: true,
      data: report
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

function handleGetDisciplinesReport(e) {
  const month = parseInt(e.parameter.month) || new Date().getMonth() + 1;
  const year = parseInt(e.parameter.year) || new Date().getFullYear();
  
  try {
    const disciplinesSheet = ss.getSheetByName('Disciplines');
    const data = disciplinesSheet.getDataRange().getValues();
    const report = [];
    
    for (let i = 1; i < data.length; i++) {
      const dateStr = data[i][3];
      if (dateStr) {
        const dateParts = dateStr.split('/');
        const recordMonth = parseInt(dateParts[1]);
        const recordYear = parseInt(dateParts[2]);
        
        if (recordMonth === month && recordYear === year) {
          report.push({
            employeeID: data[i][0],
            employeeName: getEmployeeName(data[i][0]),
            type: data[i][1],
            amount: data[i][2],
            reason: data[i][5],
            date: data[i][3],
            admin: data[i][4]
          });
        }
      }
    }
    
    return jsonResponse({
      success: true,
      data: report
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

function handleGetAdvancesReport(e) {
  try {
    const advancesSheet = ss.getSheetByName('Advances');
    const data = advancesSheet.getDataRange().getValues();
    const report = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][5] === 'Active') {
        report.push({
          employeeID: data[i][0],
          employeeName: getEmployeeName(data[i][0]),
          amount: data[i][1],
          monthlyDeduction: data[i][3],
          monthsRemaining: data[i][4],
          approvalDate: data[i][2]
        });
      }
    }
    
    return jsonResponse({
      success: true,
      data: report
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

function handleGetLocationHistory(e) {
  const employeeID = e.parameter.employeeID;
  const days = parseInt(e.parameter.days) || 7;
  
  try {
    const locationsSheet = ss.getSheetByName('Locations');
    const data = locationsSheet.getDataRange().getValues();
    const history = [];
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(employeeID)) {
        history.push({
          latitude: data[i][1],
          longitude: data[i][2],
          accuracy: data[i][3],
          timestamp: data[i][4],
          address: data[i][6],
          checkType: data[i][7]
        });
      }
    }
    
    return jsonResponse({
      success: true,
      data: history.reverse().slice(0, 50)
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

function handleGetSettings(e) {
  try {
    const settings = getSettingsMap();
    return jsonResponse({
      success: true,
      data: settings
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

// ============================================
// التوقيع الرقمي والجزاءات المحسنة
// ============================================

function handleApplyDiscipline(e) {
  const employeeID = e.parameter.employeeID;
  const type = e.parameter.type;
  const amount = e.parameter.amount;
  const reason = e.parameter.reason;
  const adminID = e.parameter.adminID;
  
  try {
    const disciplinesSheet = ss.getSheetByName('Disciplines');
    
    // إنشاء توقيع رقمي
    const signature = generateDigitalSignature(adminID, employeeID, type, amount);
    
    const dateObj = new Date();
    disciplinesSheet.appendRow([
      employeeID,
      type,
      amount,
      formatDate(dateObj),
      adminID,
      reason,
      signature,  // عمود التوقيع الجديد
      formatDate(dateObj) + ' ' + formatTime(dateObj)
    ]);
    
    return jsonResponse({
      success: true,
      message: 'تم تطبيق الجزاء بنجاح مع التوقيع الرقمي',
      signature: signature
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

/**
 * دالة جديدة: تطبيق جزاء مع التوقيع
 */
function handleApplyDisciplineWithSignature(e) {
  const employeeID = e.parameter.employeeID;
  const type = e.parameter.type;  // Discount أو Warning
  const amount = e.parameter.amount;
  const reason = e.parameter.reason;
  const adminID = e.parameter.adminID;
  const deviceSignature = e.parameter.deviceSignature;
  const timestamp = e.parameter.timestamp;
  
  try {
    const disciplinesSheet = ss.getSheetByName('Disciplines');
    
    // إنشاء توقيع رقمي معقد
    const signature = generateComplexSignature(adminID, employeeID, type, amount, deviceSignature, timestamp);
    
    const dateObj = new Date();
    disciplinesSheet.appendRow([
      employeeID,
      type,
      amount,
      formatDate(dateObj),
      adminID,
      reason,
      signature,
      formatDate(dateObj) + ' ' + formatTime(dateObj),
      deviceSignature,
      timestamp
    ]);
    
    return jsonResponse({
      success: true,
      message: 'تم تطبيق الجزاء مع التوقيع الرقمي الآمن',
      signature: signature
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

/**
 * إنشاء توقيع رقمي بسيط
 */
function generateDigitalSignature(adminID, employeeID, type, amount) {
  const timestamp = new Date().getTime();
  const data = `${adminID}|${employeeID}|${type}|${amount}|${timestamp}`;
  
  // حساب hash بسيط
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return 'SIG-' + Math.abs(hash).toString(16).toUpperCase();
}

/**
 * إنشاء توقيع رقمي معقد (آمن أكثر)
 */
function generateComplexSignature(adminID, employeeID, type, amount, deviceSignature, timestamp) {
  const data = `${adminID}|${employeeID}|${type}|${amount}|${deviceSignature}|${timestamp}`;
  
  // حساب hash معقد
  let hash = 0;
  let ch;
  for (let i = 0; i < data.length; i++) {
    ch = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash = hash & hash;
  }
  
  // إضافة معلومات إضافية
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  return `SIG-${year}${month}-${Math.abs(hash).toString(16).toUpperCase().slice(0, 12)}`;
}

// ============================================
// دالات إضافة وتحديث البيانات
// ============================================

function handleAddEmployee(e) {
  const id = e.parameter.id;
  const name = e.parameter.name;
  const position = e.parameter.position;
  const salary = e.parameter.salary;
  const phone = e.parameter.phone;
  const email = e.parameter.email;
  const password = e.parameter.password;
  
  try {
    const employeesSheet = ss.getSheetByName('Employees');
    
    employeesSheet.appendRow([
      id,
      name,
      position,
      salary,
      phone,
      email,
      password,
      'Active',
      formatDate(new Date())
    ]);
    
    return jsonResponse({
      success: true,
      message: 'تم إضافة الموظف بنجاح'
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

function handleUpdateEmployee(e) {
  const employeeID = e.parameter.employeeID;
  const name = e.parameter.name;
  const position = e.parameter.position;
  const salary = e.parameter.salary;
  const phone = e.parameter.phone;
  const email = e.parameter.email;
  
  try {
    const employeesSheet = ss.getSheetByName('Employees');
    const data = employeesSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(employeeID)) {
        employeesSheet.getRange(i + 1, 2).setValue(name);
        employeesSheet.getRange(i + 1, 3).setValue(position);
        employeesSheet.getRange(i + 1, 4).setValue(salary);
        employeesSheet.getRange(i + 1, 5).setValue(phone);
        employeesSheet.getRange(i + 1, 6).setValue(email);
        
        return jsonResponse({
          success: true,
          message: 'تم تحديث بيانات الموظف بنجاح'
        });
      }
    }
    
    return jsonResponse({
      success: false,
      message: 'لم يتم العثور على الموظف'
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

function handleDeactivateEmployee(e) {
  const employeeID = e.parameter.employeeID;
  
  try {
    const employeesSheet = ss.getSheetByName('Employees');
    const data = employeesSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(employeeID)) {
        employeesSheet.getRange(i + 1, 8).setValue('Inactive');
        
        return jsonResponse({
          success: true,
          message: 'تم إيقاف الموظف'
        });
      }
    }
    
    return jsonResponse({
      success: false,
      message: 'لم يتم العثور على الموظف'
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

function handleAddAdvance(e) {
  const employeeID = e.parameter.employeeID;
  const amount = e.parameter.amount;
  const months = e.parameter.months;
  
  try {
    const advancesSheet = ss.getSheetByName('Advances');
    
    advancesSheet.appendRow([
      employeeID,
      amount,
      formatDate(new Date()),
      amount / months,
      months,
      'Active'
    ]);
    
    return jsonResponse({
      success: true,
      message: 'تم إضافة السلفة بنجاح'
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

function handleRequestDeviceChange(e) {
  const employeeID = e.parameter.employeeID;
  const newDeviceID = e.parameter.newDeviceID;
  
  try {
    const devicesSheet = ss.getSheetByName('Devices');
    
    devicesSheet.appendRow([
      employeeID,
      newDeviceID,
      'Pending',
      formatDate(new Date()),
      '',
      ''
    ]);
    
    return jsonResponse({
      success: true,
      message: 'تم إرسال الطلب للموافقة'
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

function handleApproveDeviceRequest(e) {
  const employeeID = e.parameter.employeeID;
  
  try {
    const devicesSheet = ss.getSheetByName('Devices');
    const data = devicesSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(employeeID) && data[i][2] === 'Pending') {
        devicesSheet.getRange(i + 1, 3).setValue('Approved');
        devicesSheet.getRange(i + 1, 5).setValue(formatDate(new Date()));
        devicesSheet.getRange(i + 1, 6).setValue(e.parameter.adminID);
        
        return jsonResponse({
          success: true,
          message: 'تم قبول الطلب'
        });
      }
    }
    
    return jsonResponse({
      success: false,
      message: 'لم يتم العثور على الطلب'
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

function handleRejectDeviceRequest(e) {
  const employeeID = e.parameter.employeeID;
  
  try {
    const devicesSheet = ss.getSheetByName('Devices');
    const data = devicesSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(employeeID) && data[i][2] === 'Pending') {
        devicesSheet.getRange(i + 1, 3).setValue('Rejected');
        
        return jsonResponse({
          success: true,
          message: 'تم رفض الطلب'
        });
      }
    }
    
    return jsonResponse({
      success: false,
      message: 'لم يتم العثور على الطلب'
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: 'خطأ: ' + error.toString()
    });
  }
}

// ============================================
// دوال مساعدة
// ============================================

/**
 * تنسيق التاريخ بصيغة يوم/شهر/سنة (مصري)
 */
function formatDate(dateObj) {
  return Utilities.formatDate(dateObj, "Africa/Cairo", "dd/MM/yyyy");
}

/**
 * تنسيق الوقت بصيغة ساعة:دقيقة:ثانية
 */
function formatTime(dateObj) {
  return Utilities.formatDate(dateObj, "Africa/Cairo", "HH:mm:ss");
}

/**
 * مقارنة التاريخين - هل متساويان؟ (صيغة DD/MM/YYYY)
 * ✅ تتعامل مع Date objects و strings بصيغ مختلفة
 */
function isSameDateString(dateStr1, dateStr2) {
  // إذا كان أحد النصين فارغاً أو غير موجود
  if (!dateStr1 || !dateStr2) {
    Logger.log('⚠️ isSameDateString: كل أحد التاريخ فارغ');
    return false;
  }
  
  try {
    // تحويل Date objects إلى strings بصيغة DD/MM/YYYY
    let date1String = dateStr1;
    let date2String = dateStr2;
    
    // إذا كانت Date object
    if (dateStr1 instanceof Date) {
      date1String = formatDate(dateStr1);
    }
    if (dateStr2 instanceof Date) {
      date2String = formatDate(dateStr2);
    }
    
    // تحويل إلى string بشكل آمن
    date1String = String(date1String).trim();
    date2String = String(date2String).trim();
    
    Logger.log(`📅 مقارنة التواريخ: "${date1String}" مع "${date2String}"`);
    
    // إذا لم تكن بصيغة DD/MM/YYYY، حاول تحويلها
    if (!date1String.includes('/')) {
      try {
        const d1 = new Date(date1String);
        date1String = formatDate(d1);
      } catch(e) {
        Logger.log('❌ لا يمكن تحويل التاريخ الأول: ' + date1String);
        return false;
      }
    }
    
    if (!date2String.includes('/')) {
      try {
        const d2 = new Date(date2String);
        date2String = formatDate(d2);
      } catch(e) {
        Logger.log('❌ لا يمكن تحويل التاريخ الثاني: ' + date2String);
        return false;
      }
    }
    
    // تقسيم والتحقق من الطول
    const date1Parts = date1String.split('/');
    const date2Parts = date2String.split('/');
    
    if (date1Parts.length !== 3 || date2Parts.length !== 3) {
      Logger.log('❌ صيغة التاريخ غير صحيحة');
      return false;
    }
    
    // مقارنة اليوم والشهر والسنة
    const result = date1Parts[0] === date2Parts[0] && 
                   date1Parts[1] === date2Parts[1] && 
                   date1Parts[2] === date2Parts[2];
    
    Logger.log(`✅ نتيجة المقارنة: ${result}`);
    return result;
    
  } catch(error) {
    Logger.log('❌ خطأ في isSameDateString: ' + error.toString());
    return false;
  }
}

function getEmployeeName(employeeID) {
  try {
    const employeesSheet = ss.getSheetByName('Employees');
    const data = employeesSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(employeeID)) {
        return data[i][1];
      }
    }
    return 'موظف غير معروف';
  } catch(error) {
    return 'خطأ في البحث';
  }
}

function getSettingsMap() {
  try {
    const settingsSheet = ss.getSheetByName('Settings');
    const data = settingsSheet.getDataRange().getValues();
    const settings = {};
    
    for (let i = 1; i < data.length; i++) {
      settings[data[i][0]] = data[i][1];
    }
    
    return settings;
  } catch(error) {
    // ✅ FIXED: اسم الإعداد يجب أن يطابق ما يبحث عنه الكود
    return {
      'Max_Distance_Meters': '50',
      'Office_Latitude': '24.7136',
      'Office_Longitude': '46.6753',
      'Location_Required': 'true',
      'GPS_Timeout_Seconds': '30'
    };
  }
}

/**
 * تحديث الإعدادات في Google Sheets
 */
function handleUpdateSettings(e) {
  try {
    const settingsSheet = ss.getSheetByName('Settings');
    const settingName = e.parameter.settingName;
    const settingValue = e.parameter.settingValue;
    
    if (!settingName || settingValue === undefined) {
      return jsonResponse({
        success: false,
        message: '❌ يجب تحديد اسم الإعداد والقيمة'
      });
    }
    
    // البحث عن الصف الذي يحتوي على الإعداد
    const data = settingsSheet.getDataRange().getValues();
    let found = false;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === settingName) {
        // تحديث القيمة
        settingsSheet.getRange(i + 1, 2).setValue(settingValue);
        found = true;
        break;
      }
    }
    
    if (!found) {
      // إضافة إعدادية جديدة إذا لم تكن موجودة
      settingsSheet.appendRow([settingName, settingValue]);
    }
    
    return jsonResponse({
      success: true,
      message: `✅ تم تحديث الإعداد: ${settingName}`
    });
  } catch(error) {
    return jsonResponse({
      success: false,
      message: '❌ خطأ في تحديث الإعدادات: ' + error.toString()
    });
  }
}

/**
 * دالة تجاوب JSON
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
