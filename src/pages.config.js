import EventSelection from './pages/EventSelection';
import Home from './pages/Home';
import ScanHistory from './pages/ScanHistory';
import Scanner from './pages/Scanner';


export const PAGES = {
    "EventSelection": EventSelection,
    "Home": Home,
    "ScanHistory": ScanHistory,
    "Scanner": Scanner,
}

export const pagesConfig = {
    mainPage: "EventSelection",
    Pages: PAGES,
};