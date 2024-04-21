import Navbar from './Navbar'
import About from './pages/About'
import Home from './pages/Home'
import RaspberryCam from './pages/RaspberryCam'
import { Route, Routes } from 'react-router-dom'

function App() {
  return (
    <>
      <Navbar />
      <div className='container'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/about' element={<About />} />
          <Route path='/RaspberryCam' element={<RaspberryCam />} />
        </Routes>
      </div>
    </>
  )
}

export default App
