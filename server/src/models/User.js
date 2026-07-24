import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'OPERATIONS_MANAGER', 'WAREHOUSE_MANAGER', 'VIEWER'],
      default: 'VIEWER',
    },
    assignedFacility: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
    autoIndex: false, // Explicitly disable auto-indexing to prevent Mongoose query buffering delays
  }
);

// Pre-save hook to hash password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Helper method to compare candidate passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Transform to JSON (strip passwordHash)
UserSchema.methods.toJSON = function () {
  const userObj = this.toObject();
  delete userObj.passwordHash;
  userObj.id = userObj._id.toString();
  return userObj;
};

const User = mongoose.model('User', UserSchema);

export default User;
