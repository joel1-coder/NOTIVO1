import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import Routes
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import menuRoutes from './routes/menuRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notivo1';

// Middleware
app.use(cors());
app.use(express.json());

// Disable global buffering — so DB ops fail immediately when offline (not after 10s)
mongoose.set('bufferCommands', false);

// Database Connection — fast timeout so pages never hang when DB is offline
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 3000,  // fail fast if MongoDB is unreachable
  connectTimeoutMS:         3000,  // TCP connection timeout
  socketTimeoutMS:          5000,  // socket idle timeout
  bufferCommands:           false, // don't buffer ops — fail immediately if disconnected
})
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err.message));


// Register API Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/menus', menuRoutes);

// Base Route
app.get('/', (req, res) => {
  res.send('Notivo1 API is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
