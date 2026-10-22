import React from 'react';import {createRoot} from 'react-dom/client';import App from './App';import AppBoundary from './components/AppBoundary';import '@picocss/pico/css/pico.min.css';import './styles.css';import './theme.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><AppBoundary><App/></AppBoundary></React.StrictMode>);
