import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: { type: String },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  status: { type: String, enum: ['PENDING', 'IN PROGRESS', 'COMPLETED'], default: 'PENDING' },
  dueDate: { type: Date },
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
