import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  templateId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  columns: [{
    id: String,
    name: String,
    type: { type: String },
    enabled: Boolean
  }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  sharedWith: { type: String, default: 'Entire Users' },
}, { timestamps: true });

export default mongoose.model('Template', templateSchema);
