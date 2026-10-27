import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../dist/index.css';
import './styles/showcase.css';
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Failed to find the root element with id "root".');
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
