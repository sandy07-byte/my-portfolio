import React from 'react'
import Navbar from './Components/navbar/Navbar'
import Home from './Components/navbar/home/Home'
import About from './Components/About/About'
import Projects from './Components/Projects/Projects'
import Contact from './Components/contact/contact'
import Footer from './Components/Footer/Footer'
import Certification from './Components/Certifiactions/Certification'
const App = () => {
  return (
    <div >
    <Navbar />
    <Home />
    <About />
    <Projects />
    <Certification />

    <Contact />
    <Footer />
    </div>

  )
}

export default App;