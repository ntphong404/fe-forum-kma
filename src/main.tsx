import { createRoot } from 'react-dom/client';
import AppRouter from '@/routes/AppRouter';
import '@/styles/tailwind.css';
import '@/i18n';

createRoot(document.getElementById('root')!).render(<AppRouter />);
