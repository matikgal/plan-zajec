import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import NavbarComponent from './components/Navbar.tsx'
import './index.css'
import MainComponent from './components/MainComponent.tsx'
import FooterComponent from './components/Footer.tsx'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<NavbarComponent />
		<MainComponent />
		<FooterComponent />
	</StrictMode>
)
