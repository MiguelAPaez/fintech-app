import { useOutletContext } from 'react-router-dom';

export interface LayoutContext { openQuickAdd: () => void }

export const useLayout = () => useOutletContext<LayoutContext>();
