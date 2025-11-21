import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { Layout } from './components/Layout'
import { CategoryView } from './components/CategoryView'
import { CategoryDetail } from './components/CategoryDetail'
import { ListDetail } from './components/ListDetail'

function App() {
    return (
        <BrowserRouter>
            <AppProvider>
                <Layout>
                    <Routes>
                        <Route path="/" element={<CategoryView />} />
                        <Route path="/category/:categoryId" element={<CategoryDetail />} />
                        <Route path="/list/:listId" element={<ListDetail />} />
                    </Routes>
                </Layout>
            </AppProvider>
        </BrowserRouter>
    )
}

export default App
