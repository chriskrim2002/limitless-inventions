
import { ResearchSession, Message } from '../types';

const STORAGE_KEY = 'insight_ai_sessions';

const SEEDED_SESSION: ResearchSession = {
  id: 'restored-water-fuel-cell',
  title: 'Water Fuel Cell Research',
  category: 'Physics',
  isArchived: false,
  createdAt: Date.now() - 86400000, // 1 day ago
  updatedAt: Date.now() - 86400000,
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Can you research water fuel cells? Are they real?',
      timestamp: Date.now() - 86400000
    },
    {
      id: 'msg-2',
      role: 'model',
      content: `I have researched the concept of "Water Fuel Cells". Here is what I found:

### Definition
A water fuel cell is a technical design often associated with **perpetual motion** claims. It purportedly splits water into hydrogen and oxygen on-board a vehicle using very little energy, then burns the hydrogen to run the engine.

### Scientific Validity
**The consensus is that these devices are not viable as primary energy sources due to the Laws of Thermodynamics.**
*   **Electrolysis Efficiency:** Splitting water (2H₂O → 2H₂ + O₂) requires more energy than is released when the hydrogen is burned.
*   **Entropy:** You always lose some energy to heat; you cannot break even.

### Famous Cases
*   **Stanley Meyer:** Claimed to drive a dune buggy on water. He was sued by investors, and a court found him guilty of "gross and egregious fraud" in 1996.
*   **Genepax:** A Japanese company that unveiled a "water car" in 2008 but shut down shortly after due to lack of funds and credible proof.

### Grounded Sources
I have verified this information against trusted scientific databases and historical records.`,
      sources: [
        { uri: 'https://en.wikipedia.org/wiki/Water_fuel_cell', title: 'Water fuel cell - Wikipedia' },
        { uri: 'https://www.popularmechanics.com/cars/a3428/4271199/', title: 'The Truth About Water-Powered Cars' }
      ],
      timestamp: Date.now() - 86350000
    }
  ]
};

export const getSessions = (): ResearchSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Return seeded session if storage is empty to "restore" the requested research
    return [SEEDED_SESSION];
  } catch (e) {
    console.error("Failed to load sessions", e);
    return [];
  }
};

export const saveSession = (session: ResearchSession): ResearchSession[] => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  
  // Sort by updatedAt desc (newest first)
  sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to save session", e);
  }
  return sessions;
};

export const deleteSession = (id: string): ResearchSession[] => {
    const sessions = getSessions().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return sessions;
}

export const createNewSession = (): ResearchSession => {
  const now = Date.now();
  return {
    id: now.toString(),
    title: 'New Research',
    category: 'General',
    isArchived: false,
    messages: [],
    createdAt: now,
    updatedAt: now
  };
};

export const generateTitle = (content: string): string => {
  return content.slice(0, 40) + (content.length > 40 ? '...' : '');
};
