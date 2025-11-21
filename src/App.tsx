import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { Layout } from './components/Layout'
import { CategoryView } from './components/CategoryView'
import { CategoryDetail } from './components/CategoryDetail'
import { ListDetail } from './components/ListDetail'
import { RoadmapView } from './components/RoadmapView'
import { ToastProvider } from './context/ToastContext'
import { ToastContainer } from './components/ToastContainer'

function App() {
    return (
        <ToastProvider>
            <AppProvider>
                <BrowserRouter>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<CategoryView />} />
                            <Route path="/category/:categoryId" element={<CategoryDetail />} />
                            <Route path="/list/:listId" element={<ListDetail />} />
                            <Route path="/roadmap" element={<RoadmapView />} />
                        </Routes>
                        <ToastContainer />
                    </Layout>
                </BrowserRouter>
            </AppProvider>
        </ToastProvider>
    )
}

export default App
