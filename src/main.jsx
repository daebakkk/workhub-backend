import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const storedDark = localStorage.getItem('dark_mode') === 'true'
document.body.classList.toggle('dark', storedDark)
document.addEventListener('click', (event) => {
  if (document.body.classList.contains('sidebar-open')) {
    const clickedSidebarLink = event.target.closest('.sidebarLink');
    if (clickedSidebarLink) {
      document.body.classList.remove('sidebar-open')
      return
    }
    const clickedHamburger = event.target.closest('.navHamburger');
    if (clickedHamburger) {
      return
    }
    const clickedSidebar = event.target.closest('.dashSidebar');
    if (!clickedSidebar) {
      document.body.classList.remove('sidebar-open')
    }
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
