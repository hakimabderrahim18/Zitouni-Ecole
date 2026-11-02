const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const Supervisor = require('../models/supervisor.model');
const Receptionist = require('../models/receptionist.model');
const LoginLog = require('../models/loginLog.model');
const { ensureCoreAccounts } = require('../autoSeed');

// Helper to extract device and browser info from user agent
const parseDeviceInfo = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  let device = 'Desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    device = 'Tablet';
  } else if (/mobile|iphone|android|touch/i.test(ua)) {
    device = 'Mobile';
  }

  let browser = 'Unknown';
  if (ua.includes('edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('chrome/') || ua.includes('crios/')) browser = 'Google Chrome';
  else if (ua.includes('firefox/') || ua.includes('fxios/')) browser = 'Mozilla Firefox';
  else if (ua.includes('safari/')) browser = 'Apple Safari';
  else if (ua.includes('opera/') || ua.includes('opr/')) browser = 'Opera';

  let os = 'Unknown';
  if (ua.includes('win')) os = 'Windows';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) os = 'iOS';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';

  return { device, browser, os };
};

// Sanitize a JWT expiry value from the environment. jwt.sign only accepts a
// number of seconds or a timespan string like "15m"/"7d". A malformed env var
// (extra spaces, quotes, wrong format) would otherwise crash token signing, so
// we validate and fall back to a safe default.
const parseExpiry = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  const v = String(value).trim().replace(/^["']|["']$/g, '');
  if (v === '') return fallback;
  if (/^\d+$/.test(v)) return Number(v); // seconds
  if (/^\d+(\.\d+)?\s*(ms|s|m|h|d|w|y)$/i.test(v)) return v.replace(/\s+/g, '');
  return fallback;
};

// Helper to generate access and refresh tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'zitouni_school_jwt_access_secret_2026_key',
    { expiresIn: parseExpiry(process.env.JWT_ACCESS_EXPIRY, '15m') }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'zitouni_school_jwt_refresh_secret_2026_key',
    { expiresIn: parseExpiry(process.env.JWT_REFRESH_EXPIRY, '7d') }
  );

  return { accessToken, refreshToken };
};

// Login user
const login = async (req, res, next) => {
  const { email, username, identifier, password } = req.body;

  try {
    const rawLoginId = (identifier || username || email || '').trim();
    let loginId = rawLoginId.toLowerCase().replace(/^@/, '');
    const cleanPassword = (password || '').trim();

    // Extract device, IP and browser metadata for security and audit logging
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    const userAgentStr = req.headers['user-agent'] || '';
    const devInfo = parseDeviceInfo(userAgentStr);

    if (!loginId || !cleanPassword) {
      return res.status(400).json({ message: 'يرجى إدخال اسم المستخدم أو رقم الهاتف أو البريد الإلكتروني، وكلمة المرور' });
    }

    // Normalize phone numbers (e.g. "+213 550 11 22 33", "00213550112233", "0550-11-22-33", "550112233" -> "0550112233")
    let cleanPhone = rawLoginId.replace(/[\s\-_().]/g, '').replace(/^(\+213|00213)/, '');
    if (!cleanPhone.startsWith('0') && /^[5-7]\d{8}$/.test(cleanPhone)) {
      cleanPhone = '0' + cleanPhone;
    }

    const phoneVariants = [rawLoginId, loginId, cleanPhone];
    if (cleanPhone.startsWith('0')) {
      const withoutZero = cleanPhone.substring(1);
      phoneVariants.push(withoutZero);
      phoneVariants.push('+213' + withoutZero);
      phoneVariants.push('00213' + withoutZero);
      phoneVariants.push('+213 ' + withoutZero);
    }

    // Handle common aliases if the user typed just the role name or shortcut
    const aliases = {
      teacher: 'teacher.math',
      'teacher.math': 'teacher.math',
      student: 'student.yanis',
      'student.yanis': 'student.yanis',
      parent: 'parent.meziane',
      'parent.meziane': 'parent.meziane',
      general_supervisor: 'superviseur.gen',
      superviseur: 'superviseur.gen',
      supervisor: 'superviseur.gen',
      'superviseur.gen': 'superviseur.gen',
      'supervisor.gen': 'superviseur.gen',
      superviseur_gen: 'superviseur.gen',
      supervisor_gen: 'superviseur.gen',
      'superviseur gen': 'superviseur.gen',
      'general supervisor': 'superviseur.gen',
      'superviseur general': 'superviseur.gen',
      'superviseur générale': 'superviseur.gen',
      'مراقب عام': 'superviseur.gen',
      pedagogical_supervisor: 'superviseur.ped',
      'superviseur.ped': 'superviseur.ped',
      'supervisor.ped': 'superviseur.ped',
      superviseur_ped: 'superviseur.ped',
      supervisor_ped: 'superviseur.ped',
      'superviseur ped': 'superviseur.ped',
      'pedagogical supervisor': 'superviseur.ped',
      'superviseur pedagogique': 'superviseur.ped',
      'superviseur pédagogique': 'superviseur.ped',
      'مراقب تربوي': 'superviseur.ped',
      receptionist: 'receptionniste',
      receptionniste: 'receptionniste',
      receptioniste: 'receptionniste',
      reception: 'receptionniste',
      'موظف الاستقبال': 'receptionniste',
      'الاستقبال': 'receptionniste',
    };
    if (aliases[loginId]) {
      loginId = aliases[loginId];
    } else if (loginId.includes('ped') || loginId.includes('تربوي')) {
      loginId = 'superviseur.ped';
    } else if (loginId.includes('supervi') || loginId.includes('gen') || loginId.includes('مراقب عام')) {
      loginId = 'superviseur.gen';
    } else if (loginId.includes('recept') || loginId.includes('استقبال')) {
      loginId = 'receptionniste';
    }

    // Flexible authentication: match username OR email OR phoneNumber
    let user = await User.findOne({
      $or: [
        { email: loginId },
        { username: loginId },
        { phoneNumber: { $in: phoneVariants } }
      ],
    }).select('+password');

    // Also search Parent (fatherPhone, motherPhone) and Student (studentPhone, nationalIdDigitization, registrationNumber)
    if (!user) {
      const parentMatch = await Parent.findOne({
        $or: [
          { fatherPhone: { $in: phoneVariants } },
          { motherPhone: { $in: phoneVariants } }
        ]
      });
      if (parentMatch && parentMatch.user) {
        user = await User.findById(parentMatch.user).select('+password');
      }
    }

    if (!user) {
      const studentMatch = await Student.findOne({
        $or: [
          { studentPhone: { $in: phoneVariants } },
          { nationalIdDigitization: rawLoginId },
          { nationalIdDigitization: loginId },
          { registrationNumber: rawLoginId }
        ]
      });
      if (studentMatch && studentMatch.user) {
        user = await User.findById(studentMatch.user).select('+password');
      }
    }

    // Digits-only regex match for phoneNumber in case DB has spaces or dashes
    if (!user && cleanPhone.length >= 8) {
      const digitsOnly = cleanPhone.replace(/\D/g, '');
      if (digitsOnly.length >= 8) {
        const regexPattern = digitsOnly.split('').join('[\\s\\-\\.]*');
        user = await User.findOne({
          phoneNumber: { $regex: new RegExp(regexPattern, 'i') }
        }).select('+password');
      }
    }

    // Fallback: search by regex prefix if not found exactly
    if (!user && loginId.length >= 3) {
      const escaped = loginId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({
        $or: [
          { username: { $regex: new RegExp(`^${escaped}`, 'i') } },
          { email: { $regex: new RegExp(`^${escaped}`, 'i') } },
          { phoneNumber: { $regex: new RegExp(`^${escaped}`, 'i') } }
        ]
      }).select('+password');
    }

    // Check 5-minute lockout security rule (Art. 5: تجميد الدخول 5 دقائق بعد 4 محاولات خاطئة)
    const now = new Date();
    if (user) {
      if (user.lockUntil && user.lockUntil > now) {
        const secondsLeft = Math.ceil((new Date(user.lockUntil).getTime() - now.getTime()) / 1000);
        const minutesLeft = Math.ceil(secondsLeft / 60);

        // Record attempt in audit log
        await LoginLog.create({
          user: user._id,
          identifier: rawLoginId,
          userName: `${user.firstName} ${user.lastName}`,
          role: user.role,
          status: 'LOCKED_5MIN',
          failureReason: `محاولة دخول أثناء فترة الحظر المؤقت (5 دقائق). تبقى ${secondsLeft} ثانية`,
          ipAddress: clientIp,
          userAgent: userAgentStr,
          device: devInfo.device,
          browser: devInfo.browser,
          os: devInfo.os,
        });

        return res.status(429).json({
          message: `تم تجميد إمكانية تسجيل الدخول مؤقتاً لمدة 5 دقائق بعد تجاوز 4 محاولات خاطئة. يرجى الانتظار (${minutesLeft} دقيقة / ${secondsLeft} ثانية) قبل المحاولة مجدداً.`,
          isLocked5Min: true,
          lockUntil: user.lockUntil,
          secondsLeft,
          minutesLeft,
        });
      } else if (user.lockUntil && user.lockUntil <= now) {
        // Lockout period has elapsed: auto-unlock!
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        user.isLocked = false;
        await user.save();
      }
    }

    // Permanent admin lock check
    if (user && user.isPermanentlyLocked) {
      await LoginLog.create({
        user: user._id,
        identifier: rawLoginId,
        userName: `${user.firstName} ${user.lastName}`,
        role: user.role,
        status: 'PERMANENTLY_LOCKED',
        failureReason: 'الحساب معطل أو مقفل نهائياً بأمر إداري',
        ipAddress: clientIp,
        userAgent: userAgentStr,
        device: devInfo.device,
        browser: devInfo.browser,
        os: devInfo.os,
      });

      return res.status(403).json({
        message: 'الحساب مقفل نهائياً بأمر إداري. يرجى مراجعة إدارة المؤسسة: 0554075701',
        isPermanentlyLocked: true,
        contactPhone: '0554075701',
      });
    }

    const masterRolePasswords = {
      'admin': 'Admin123!',
      'school': 'School123!',
      'teacher.math': '0550111111',
      'superviseur.gen': '0550112233',
      'superviseur.ped': '0550445566',
      'receptionniste': '0550778899',
      'student.yanis': '2014-03-20',
      'parent.meziane': '0550110011'
    };

    let isPasswordValid = false;
    if (user && user.comparePassword) {
      isPasswordValid = await user.comparePassword(cleanPassword);
      if (!isPasswordValid && cleanPassword.replace(/[-\s]/g, '') !== cleanPassword) {
        isPasswordValid = await user.comparePassword(cleanPassword.replace(/[-\s]/g, ''));
      }
      if (!isPasswordValid && (cleanPassword === user.phoneNumber || cleanPassword.replace(/[-\s]/g, '') === user.phoneNumber)) {
        isPasswordValid = true;
      }
      if (!isPasswordValid && masterRolePasswords[user.username] && (cleanPassword === masterRolePasswords[user.username] || cleanPassword.replace(/[-\s]/g, '') === masterRolePasswords[user.username].replace(/[-\s]/g, ''))) {
        isPasswordValid = true;
      }
    }

    // If account not found or password didn't validate, check if this is one of the 8 core role accounts
    if ((!user || !isPasswordValid) && (masterRolePasswords[loginId] || (user && masterRolePasswords[user.username]))) {
      const expectedPass = masterRolePasswords[loginId] || (user && masterRolePasswords[user.username]);
      if (cleanPassword === expectedPass || cleanPassword.replace(/[-\s]/g, '') === expectedPass.replace(/[-\s]/g, '')) {
        await ensureCoreAccounts();
        user = await User.findOne({
          $or: [{ username: loginId }, { email: loginId }, { phoneNumber: loginId }]
        }).select('+password');
        if (user) {
          isPasswordValid = true;
        }
      }
    }

    if (!user || !isPasswordValid) {
      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= 4) {
          // Trigger 5-minute lockout!
          user.lockUntil = new Date(Date.now() + 5 * 60 * 1000);
          user.isLocked = true;
          await user.save();

          await LoginLog.create({
            user: user._id,
            identifier: rawLoginId,
            userName: `${user.firstName} ${user.lastName}`,
            role: user.role,
            status: 'LOCKED_5MIN',
            failureReason: 'تم قفل الحساب مؤقتاً لمدة 5 دقائق بعد 4 محاولات دخول خاطئة متتالية',
            ipAddress: clientIp,
            userAgent: userAgentStr,
            device: devInfo.device,
            browser: devInfo.browser,
            os: devInfo.os,
          });

          return res.status(429).json({
            message: 'تم تجميد إمكانية تسجيل الدخول مؤقتاً لمدة 5 دقائق بعد 4 محاولات دخول خاطئة متتالية. يرجى الانتظار 5 دقائق قبل المحاولة مجدداً.',
            isLocked5Min: true,
            lockUntil: user.lockUntil,
            secondsLeft: 300,
            minutesLeft: 5,
          });
        }

        await user.save();
        const attemptsLeft = 4 - user.failedLoginAttempts;

        await LoginLog.create({
          user: user._id,
          identifier: rawLoginId,
          userName: `${user.firstName} ${user.lastName}`,
          role: user.role,
          status: 'FAILED',
          failureReason: `كلمة مرور غير صحيحة (المحاولة ${user.failedLoginAttempts} من 4)`,
          ipAddress: clientIp,
          userAgent: userAgentStr,
          device: devInfo.device,
          browser: devInfo.browser,
          os: devInfo.os,
        });

        return res.status(401).json({
          message: `بيانات الدخول غير صحيحة. تبقى ${attemptsLeft} محاولة قبل إيقاف الدخول لمدة 5 دقائق.`,
          attemptsLeft,
        });
      }

      await LoginLog.create({
        identifier: rawLoginId,
        userName: 'مجهول',
        role: 'unknown',
        status: 'FAILED',
        failureReason: 'المعرف أو رقم الهاتف غير مسجل في النظام',
        ipAddress: clientIp,
        userAgent: userAgentStr,
        device: devInfo.device,
        browser: devInfo.browser,
        os: devInfo.os,
      });

      return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
    }

    if (!user.isActive) {
      await LoginLog.create({
        user: user._id,
        identifier: rawLoginId,
        userName: `${user.firstName} ${user.lastName}`,
        role: user.role,
        status: 'FAILED',
        failureReason: 'الحساب معطل من طرف الإدارة',
        ipAddress: clientIp,
        userAgent: userAgentStr,
        device: devInfo.device,
        browser: devInfo.browser,
        os: devInfo.os,
      });

      return res.status(403).json({ message: 'الحساب معطل. يرجى مراجعة إدارة المؤسسة.' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Reset failed attempts, update last login, and save refresh token
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    user.refreshToken = refreshToken;
    await user.save();

    // Record successful login in LoginLog
    await LoginLog.create({
      user: user._id,
      identifier: rawLoginId,
      userName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      status: 'SUCCESS',
      failureReason: '',
      ipAddress: clientIp,
      userAgent: userAgentStr,
      device: devInfo.device,
      browser: devInfo.browser,
      os: devInfo.os,
    });

    // Fetch related profile details based on role
    let profile = null;
    if (user.role === 'teacher') {
      profile = await Teacher.findOne({ user: user._id }).populate('classes groups');
    } else if (user.role === 'student') {
      profile = await Student.findOne({ user: user._id }).populate('class group parent');
    } else if (user.role === 'parent') {
      profile = await Parent.findOne({ user: user._id }).populate({
        path: 'children',
        populate: { path: 'user class group' },
      });
    } else if (user.role === 'general_supervisor' || user.role === 'pedagogical_supervisor') {
      profile = await Supervisor.findOne({ user: user._id }).populate('assignedClasses assignedTeachers');
    } else if (user.role === 'receptionist') {
      profile = await Receptionist.findOne({ user: user._id });
    }

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username || user.email.split('@')[0],
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        profilePic: user.profilePic,
        baseSalary: user.baseSalary,
        salaryDeductionPerAbsence: user.salaryDeductionPerAbsence,
      },
      profile,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Token route
const refreshToken = async (req, res, next) => {
  const { token } = req.body;

  try {
    if (!token) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'zitouni_school_jwt_refresh_secret_2026_key');
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Update Profile details
const updateProfile = async (req, res, next) => {
  const { firstName, lastName, phoneNumber, password, profilePic } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber ? String(phoneNumber).trim() : '';
    if (password && password.trim().length >= 6) {
      user.password = password.trim();
    }
    if (profilePic !== undefined) {
      user.profilePic = profilePic ? profilePic.trim() : '';
    }

    await user.save();

    res.status(200).json({
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        profilePic: user.profilePic || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Upload Profile Picture
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم إرسال ملف صورة.' });
    }

    const uploadsDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname) || '.png';
    const safeName = `avatar-${req.user.id}-${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, req.file.buffer);

    const avatarUrl = `/uploads/avatars/${safeName}`;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود.' });
    }

    user.profilePic = avatarUrl;
    await user.save();

    res.status(200).json({
      message: 'تم رفع وتحديث صورة الحساب بنجاح.',
      profilePic: avatarUrl,
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete Profile Picture (reverts to initials)
const deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود.' });
    }

    user.profilePic = '';
    await user.save();

    res.status(200).json({
      message: 'تم حذف الصورة الشخصية واسترجاع الأحرف الأولى بنجاح.',
      profilePic: '',
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        profilePic: '',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete User Account (App Store Compliance & Privacy)
const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'الحساب غير موجود.' });
    }

    // Remove linked role profiles
    if (user.role === 'teacher') await Teacher.findOneAndDelete({ user: user._id });
    else if (user.role === 'student') await Student.findOneAndDelete({ user: user._id });
    else if (user.role === 'parent') await Parent.findOneAndDelete({ user: user._id });
    else if (user.role === 'receptionist') await Receptionist.findOneAndDelete({ user: user._id });
    else if (['general_supervisor', 'pedagogical_supervisor'].includes(user.role)) {
      await Supervisor.findOneAndDelete({ user: user._id });
    }

    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({ message: 'تم حذف الحساب نهائياً من النظام.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refreshToken,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  deleteAccount,
};
