import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true }, // e.g., 'Starters', 'Main Course', 'Drinks'
  image: { type: String }, // URL to image
  isAvailable: { type: Boolean, default: true }
});

const MenuSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., 'Lunch Special'
  restaurantName: { type: String, default: 'Canteen' },
  items: [MenuItemSchema],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Menu', MenuSchema);
