import { createHashRouter, RouterProvider, Outlet } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { Layout } from './components/Layout'
import { CategoryView } from './components/CategoryView'

import { ListDetail } from './components/ListDetail'
import { SessionDetail } from './components/SessionDetail'

import { TodoView } from './components/TodoView'
import { ActivityLog } from './components/ActivityLog'
import { StatisticsView } from './components/StatisticsView'
import { ToastProvider } from './context/ToastContext'
import { ToastContainer } from './components/ToastContainer'
import { UpdatePrompt } from './components/UpdatePrompt'
import { WhatsNewModal } from './components/WhatsNewModal'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'

// Create the router configuration
const router = createHashRouter([
    {
        element: (
            <ProtectedRoute>
                <Layout>
                    <Outlet />
                    <ToastContainer />
                    <UpdatePrompt />
                    <WhatsNewModal />
                </Layout>
            </ProtectedRoute>
        ),
        children: [
            {
                path: "/",
                element: <CategoryView />,
            },
            {
                path: "/list/:listId",
                element: <ListDetail />,
            },
            {
                path: "/session/:sessionId",
                element: <SessionDetail />,
            },
            {
                path: "/todos",
                element: <TodoView />,
            },
            {
                path: "/activity",
                element: <ActivityLog />,
            },
            {
                path: "/statistics",
                element: <StatisticsView />,
            },
        ],
    },
]);

function App() {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <AuthProvider>
                    <AppProvider>
                        <RouterProvider router={router} />
                    </AppProvider>
                </AuthProvider>
            </ToastProvider>
        </ErrorBoundary>
    )
}

export default App
