# Notivo1 Admin Suite - Complete Setup & Run Guide

## 🚀 What's Been Done

All pages have been made **fully functional** with the following features:

### ✅ Frontend Enhancements
1. **API Service Layer** (`frontend/src/services/api.js`)
   - Centralized API client for all backend calls
   - Supports login, user management, tasks, templates, and submissions
   - Built-in export functionality (CSV, Excel, JSON)

2. **Working Pages**
   - **Login Page**: Now authenticates against backend (default: admin@notivo1.com / admin123)
   - **Task Management**: Fetches real tasks from API with filtering
   - **Create Task**: Saves new tasks to database
   - **Task Detail**: Loads specific task and allows approval/rejection
   - **User Management**: CRUD operations for users
   - **Saved Templates**: Lists and manages templates
   - **Form Builder**: Save and share templates
   - **System Overview**: Real-time dashboard with refresh
   - **Received Responses**: View submissions with export to CSV/Excel/JSON

3. **Excel Export Fixed**
   - Multiple export formats: CSV, Excel (.xlsx), JSON
   - Proper formatting and data handling
   - Download with timestamped filenames

### ✅ Backend Enhancements
1. **Complete API Routes**
   - GET /api/users - Get all users
   - POST /api/users - Create user
   - DELETE /api/users/:id - Delete user
   - POST /api/users/login - Authenticate user
   
   - GET /api/tasks - Get all tasks
   - GET /api/tasks/:id - Get specific task
   - POST /api/tasks - Create task
   - PUT /api/tasks/:id - Update task
   - DELETE /api/tasks/:id - Delete task
   
   - GET /api/templates - Get all templates
   - POST /api/templates - Create template
   - DELETE /api/templates/:id - Delete template
   
   - GET /api/submissions - Get all submissions
   - POST /api/submissions - Create submission
   - PATCH /api/submissions/:id/status - Update status

2. **Environment Configuration**
   - MongoDB connection configured
   - CORS enabled
   - Error handling middleware

---

## 📋 Prerequisites

Before running, ensure you have:
- **Node.js** (v14 or higher)
- **MongoDB** (running locally or remote)
- **npm** or **yarn**

---

## 🔧 Installation & Setup

### Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment Variables

**Backend** (create `backend/.env`):
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/notivo1
NODE_ENV=development
```

**Frontend** (create `frontend/.env`):
```
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start MongoDB

```bash
# On Windows:
mongod

# On macOS (if installed via Homebrew):
brew services start mongodb-community

# On Linux:
sudo systemctl start mongod
```

---

## 🎯 Running the Application

### Option 1: Run Backend & Frontend in Separate Terminals

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will start on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will start on `http://localhost:5173` (or similar)

### Option 2: Run Both with Root npm

```bash
npm start
```
This requires proper scripts configured in root `package.json`.

---

## 📝 Default Credentials

### Login Credentials
- **Email**: `admin@notivo1.com`
- **Password**: `admin123`

---

## 🌐 API Endpoints Summary

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/login` - Login

### Tasks
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task detail
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Templates
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Submissions
- `GET /api/submissions` - List submissions
- `POST /api/submissions` - Create submission
- `PATCH /api/submissions/:id/status` - Update status

---

## 🎨 Using the Application

### Dashboard
- View real-time statistics
- Refresh data with "Refresh Data" button
- Export reports (functionality enabled)

### Task Management
- Create new tasks with "Create Task" button
- Filter by status and category
- View task details
- Edit and delete tasks

### User Management
- Create new team members
- Assign roles (ADMIN, MODERATOR, USER)
- View user status
- Delete users

### Form Builder
- Create dynamic form templates
- Add/remove columns
- Configure field types
- Save and share templates

### Submissions
- **View all form submissions**
- **Export as CSV** - Click "Export to CSV" button
- **Export as Excel** - Click "Export to Excel" button
- **Export as JSON** - Click "Export to JSON" button
- View submitted data in detail modal

---

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is running
- Check connection string in `.env` file
- Verify MongoDB is listening on default port 27017

### "API not responding"
- Ensure backend is running on port 5000
- Check CORS is enabled
- Look for errors in backend terminal

### "Excel export not working"
- Ensure you're using the correct export button
- Check browser console for errors
- Try refreshing the page

### "Login fails with default credentials"
- Ensure backend is running
- Check MongoDB has user data
- Try using the fallback credentials: admin@notivo1.com / admin123

---

## 📦 Project Structure

```
NOTIVO1/
├── backend/
│   ├── index.js (Main server)
│   ├── models/ (Database schemas)
│   │   ├── User.js
│   │   ├── Task.js
│   │   ├── Template.js
│   │   └── Submission.js
│   ├── routes/ (API endpoints)
│   │   ├── userRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── templateRoutes.js
│   │   └── submissionRoutes.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx (Router)
│   │   ├── main.jsx (Entry point)
│   │   ├── services/ (API service)
│   │   │   └── api.js
│   │   ├── pages/workflow/
│   │   │   ├── WorkflowLogin.jsx
│   │   │   ├── WorkflowSystemOverview.jsx
│   │   │   ├── WorkflowTaskManagement.jsx
│   │   │   ├── WorkflowTaskDetail.jsx
│   │   │   ├── WorkflowCreateTask.jsx
│   │   │   ├── WorkflowUserManagement.jsx
│   │   │   ├── WorkflowTableBuilder.jsx
│   │   │   ├── WorkflowSavedTemplates.jsx
│   │   │   ├── WorkflowReceivedResponses.jsx
│   │   │   ├── WorkflowLayout.jsx
│   │   │   └── workflow.css
│   │   └── assets/
│   ├── vite.config.js
│   ├── package.json
│   └── .env
└── package.json
```

---

## 🚀 Next Steps

### Enhancements You Can Make
1. **Authentication**: Replace mock JWT with real implementation (jsonwebtoken, bcrypt)
2. **Database Seeding**: Create script to seed initial data
3. **Error Handling**: Add comprehensive error boundary components
4. **Testing**: Add Jest/Vitest tests
5. **Deployment**: Set up CI/CD pipeline for automated deployment
6. **Real-time**: Add WebSocket support for live updates
7. **File Upload**: Implement actual file attachment uploads
8. **Advanced Filtering**: Add more sophisticated search and filter options

---

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the backend terminal for server errors
3. Verify MongoDB is running
4. Ensure all environment variables are correctly set
5. Check network requests in browser DevTools

---

**Happy coding! 🎉**
