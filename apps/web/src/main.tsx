import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './edits.css';
import '../../student/src/styles.css';
import '../../student/src/moderated.css';
import '../../student/src/quiz-themes.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
