const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');

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
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact administration.' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

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
    }

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        profilePic: user.profilePic,
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
  const { firstName, lastName, phoneNumber, profilePic } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (profilePic) user.profilePic = profilePic;

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
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

module.exports = { login, refreshToken, updateProfile };
