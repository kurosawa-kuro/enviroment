import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Microposts } from './pages/Microposts'
import { About } from './pages/About'
import { Health } from './pages/Health'

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/microposts" element={<Microposts />} />
        <Route path="/about" element={<About />} />
        <Route path="/health" element={<Health />} />
      </Routes>
    </Layout>
  )
}
