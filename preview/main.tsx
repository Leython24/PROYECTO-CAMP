import React from 'react';
import {createRoot} from 'react-dom/client';
import App from '../src/App';
import {capmStorage,initializeStorage,waitForSave} from './storage';
import '../src/styles.css';
import './preview.css';
async function start(){await initializeStorage();const route=capmStorage.getItem("capm-preview-route");if(route&&!location.hash)location.hash=route;window.addEventListener("hashchange",()=>capmStorage.setItem("capm-preview-route",location.hash));Object.assign(window,{capmPreviewStorage:capmStorage,capmPreviewSaved:waitForSave});const root=document.getElementById('root')!;createRoot(root).render(<React.StrictMode><App/></React.StrictMode>)}
void start();
