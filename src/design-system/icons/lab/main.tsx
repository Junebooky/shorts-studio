import {createRoot} from 'react-dom/client';
import {IconThemeProvider} from '../index';
import {IconGallery} from './IconGallery';
import '../motion.css';
import './lab.css';
createRoot(document.getElementById('root')!).render(<IconThemeProvider><IconGallery/></IconThemeProvider>);
