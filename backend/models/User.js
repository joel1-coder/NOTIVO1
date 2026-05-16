import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // In production, this must be hashed
  role: { type: String, enum: ['ADMIN', 'MODERATOR', 'USER'], default: 'USER' },
  status: { type: String, enum: ['Active', 'Offline', 'Away'], default: 'Active' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
