import { useState, useEffect } from 'react';

export interface SavedList {
  name: string;
  options: string[];
  timestamp: string;
  type: string;
}

export function useSavedLists() {
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);

  useEffect(() => {
    const loadSavedLists = () => {
      try {
        const saved = localStorage.getItem('nameLists');
        if (saved) {
          setSavedLists(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading saved lists:', error);
      }
    };

    loadSavedLists();
  }, []);

  const saveList = (listName: string, options: string[]) => {
    try {
      const newList: SavedList = {
        name: listName,
        options,
        timestamp: new Date().toISOString(),
        type: 'nameList'
      };
      const updatedLists = [...savedLists, newList];
      setSavedLists(updatedLists);
      localStorage.setItem('nameLists', JSON.stringify(updatedLists));
      return true;
    } catch (error) {
      console.error('Error saving list:', error);
      return false;
    }
  };

  const deleteList = (timestamp: string) => {
    try {
      const updatedLists = savedLists.filter(list => list.timestamp !== timestamp);
      setSavedLists(updatedLists);
      localStorage.setItem('nameLists', JSON.stringify(updatedLists));
      return true;
    } catch (error) {
      console.error('Error deleting list:', error);
      return false;
    }
  };

  return {
    savedLists,
    saveList,
    deleteList
  };
}
