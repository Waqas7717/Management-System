import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App';
import { initLang } from './core/lang';
initLang();

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
