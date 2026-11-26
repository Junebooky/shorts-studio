import {createRoot} from 'react-dom/client';
import {IconThemeProvider} from '../../icons/theme/IconThemeProvider';
import {MotionGraphicGallery} from './MotionGraphicGallery';
import './lab.css';
createRoot(document.getElementById('root')!).render(<IconThemeProvider><MotionGraphicGallery/></IconThemeProvider>);
