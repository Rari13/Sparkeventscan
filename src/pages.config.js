import EventSelection from './pages/EventSelection';
import Scanner from './pages/Scanner';
import ScanHistory from './pages/ScanHistory';


export const PAGES = {
    "EventSelection": EventSelection,
    "Scanner": Scanner,
    "ScanHistory": ScanHistory,
}

export const pagesConfig = {
    mainPage: "EventSelection",
    Pages: PAGES,
};