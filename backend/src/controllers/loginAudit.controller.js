const LoginLog = require('../models/loginLog.model');
const User = require('../models/user.model');

// Retrieve paginated and filtered login logs with summary statistics
const getLoginLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status, role, search, startDate, endDate } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (role && role !== 'ALL') {
      query.role = role;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { identifier: regex },
        { userName: regex },
        { ipAddress: regex },
        { failureReason: regex },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Calculate Today's Date Range (Algeria UTC+1)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [logs, total, totalToday, successToday, failedToday, lockedToday] = await Promise.all([
      LoginLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      LoginLog.countDocuments(query),
      LoginLog.countDocuments({ createdAt: { $gte: todayStart } }),
      LoginLog.countDocuments({ createdAt: { $gte: todayStart }, status: 'SUCCESS' }),
      LoginLog.countDocuments({ createdAt: { $gte: todayStart }, status: 'FAILED' }),
      LoginLog.countDocuments({
        createdAt: { $gte: todayStart },
        status: { $in: ['LOCKED_5MIN', 'PERMANENTLY_LOCKED'] },
      }),
    ]);

    res.status(200).json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        totalToday,
        successToday,
        failedToday,
        lockedToday,
        successRate: totalToday > 0 ? Math.round((successToday / totalToday) * 100) : 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Manually unlock an account (Admin / General Supervisor)
const unlockUserAccount = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const mongoose = require('mongoose');
    let user = null;

    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user) {
      user = await User.findOne({
        $or: [{ username: userId }, { phoneNumber: userId }, { email: userId }],
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = null;
    user.isPermanentlyLocked = false;
    await user.save();

    res.status(200).json({
      message: `تم رفع الحظر بنجاح عن حساب: ${user.firstName} ${user.lastName} (${user.username || user.phoneNumber})`,
      user: {
        id: user._id,
        isLocked: false,
        lockUntil: null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLoginLogs,
  unlockUserAccount,
};
