import EventSelection from './pages/EventSelection';
import Scanner from './pages/Scanner';
import ScanHistory from './pages/ScanHistory';
import Home from './pages/Home';


export const PAGES = {
    "EventSelection": EventSelection,
    "Scanner": Scanner,
    "ScanHistory": ScanHistory,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "EventSelection",
    Pages: PAGES,
};