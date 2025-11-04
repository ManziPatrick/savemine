const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Register user
 * @route   POST /auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email or phone already exists'
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    passwordHash: password // Will be hashed by pre-save middleware
  });

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token,
      refreshToken
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email }).select('+passwordHash');
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated'
    });
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Update last login
  await user.updateLastLogin();

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        lastLogin: user.lastLogin
      },
      token,
      refreshToken
    }
  });
});

/**
 * @desc    Refresh token
 * @route   POST /auth/refresh
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token required'
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

/**
 * @desc    Get current user profile
 * @route   GET /auth/me
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.json({
    success: true,
    data: {
      user
    }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /auth/me
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, preferences } = req.body;
  
  const updateData = {};
  
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

/**
 * @desc    Change password
 * @route   PUT /auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  const user = await User.findById(req.user._id).select('+passwordHash');

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.passwordHash = newPassword; // Will be hashed by pre-save middleware
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * @desc    Deactivate account
 * @route   DELETE /auth/me
 * @access  Private
 */
const deactivateAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required to deactivate account'
    });
  }

  const user = await User.findById(req.user._id).select('+passwordHash');

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Password is incorrect'
    });
  }

  // Deactivate user
  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount
};


