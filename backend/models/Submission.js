import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  submissionId: { type: String, required: true, unique: true },
  template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Pending', 'Reviewed', 'Rejected'], default: 'Pending' },
  data: { type: Map, of: String }, // Flexible key-value pairs for dynamic form data
}, { timestamps: true });

export default mongoose.model('Submission', submissionSchema);
