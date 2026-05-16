import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// ── Admin Portal ──────────────────────────────────────────────────────────────
import WorkflowLogin             from './pages/workflow/WorkflowLogin'
import WorkflowSystemOverview    from './pages/workflow/WorkflowSystemOverview'
import WorkflowTaskManagement    from './pages/workflow/WorkflowTaskManagement'
import WorkflowTaskDetail        from './pages/workflow/WorkflowTaskDetail'
import WorkflowCreateTask        from './pages/workflow/WorkflowCreateTask'
import WorkflowUserManagement    from './pages/workflow/WorkflowUserManagement'
import WorkflowTableBuilder      from './pages/workflow/WorkflowTableBuilder'
import WorkflowSavedTemplates    from './pages/workflow/WorkflowSavedTemplates'
import WorkflowReceivedResponses from './pages/workflow/WorkflowReceivedResponses'
import WorkflowProfile           from './pages/workflow/WorkflowProfile'
import WorkflowMenuManagement    from './pages/workflow/WorkflowMenuManagement'
import WorkflowMenuEditor        from './pages/workflow/WorkflowMenuEditor'

// ── User Portal ───────────────────────────────────────────────────────────────
import UserLogin       from './pages/user/UserLogin'
import UserDashboard  from './pages/user/UserDashboard'
import UserTasks      from './pages/user/UserTasks'
import UserTimetable  from './pages/user/UserTimetable'
import UserSubmissions from './pages/user/UserSubmissions'
import UserProgress   from './pages/user/UserProgress'
import UserSettings   from './pages/user/UserSettings'

// ── Public Pages ──────────────────────────────────────────────────────────────
import PublicView from './pages/public/PublicView'
import DigitalMenu from './pages/public/DigitalMenu'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default → Admin Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ── Admin Auth ── */}
        <Route path="/login" element={<WorkflowLogin />} />

        {/* ── Admin Pages ── */}
        <Route path="/dashboard"       element={<WorkflowSystemOverview />} />
        <Route path="/tasks"           element={<WorkflowTaskManagement />} />
        <Route path="/task-detail"     element={<WorkflowTaskDetail />} />
        <Route path="/create-task"     element={<WorkflowCreateTask />} />
        <Route path="/users"           element={<WorkflowUserManagement />} />
        <Route path="/form-builder"    element={<WorkflowTableBuilder />} />
        <Route path="/saved-templates" element={<WorkflowSavedTemplates />} />
        <Route path="/responses"       element={<WorkflowReceivedResponses />} />
        <Route path="/profile"         element={<WorkflowProfile />} />
        <Route path="/menu-management" element={<WorkflowMenuManagement />} />
        <Route path="/menu-editor/:id" element={<WorkflowMenuEditor />} />

        {/* ── User Portal Auth ── */}
        <Route path="/user/login"       element={<UserLogin />} />

        {/* ── User Portal Pages ── */}
        <Route path="/user/dashboard"   element={<UserDashboard />} />
        <Route path="/user/tasks"       element={<UserTasks />} />
        <Route path="/user/timetable"   element={<UserTimetable />} />
        <Route path="/user/submissions" element={<UserSubmissions />} />
        <Route path="/user/progress"    element={<UserProgress />} />
        <Route path="/user/settings"    element={<UserSettings />} />

        {/* ── Public Access (QR Code) ── */}
        <Route path="/public/view/:id" element={<PublicView />} />
        <Route path="/public/menu/:id" element={<DigitalMenu />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
