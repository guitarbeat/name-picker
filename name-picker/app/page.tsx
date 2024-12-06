'use client'

import { useState, useCallback, useEffect } from 'react';
import NameInput from '@/components/features/name-picker/NameInput';
import ConfirmNames from '@/components/features/name-picker/ConfirmNames';
import BiasSorter from '@/components/features/name-picker/BiasSorter';
import { Option } from '@/app/lib/sortingLogic';
import { TournamentHistory } from '@/components/features/tournament/TournamentHistory';
import { toast } from 'react-hot-toast';
import { BracketType } from '@/app/lib/defaults';
import { useSavedLists } from './hooks/useSavedLists';
import ErrorBoundary from './components/ErrorBoundary';
import { useHotkeys } from 'react-hotkeys-hook';

type Step = 'input' | 'confirm' | 'sort';

export default function Home() {
  const [options, setOptions] = useState<Option[]>([]);
  const [step, setStep] = useState<Step>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [bracketType, setBracketType] = useState<BracketType>('single');
  
  const { savedLists, saveList, deleteList } = useSavedLists();

  // Keyboard shortcuts
  useHotkeys('ctrl+n, cmd+n', () => setStep('input'), { preventDefault: true });
  useHotkeys('esc', handleReset, { preventDefault: true });

  const handleReset = useCallback(() => {
    setStep('input');
    setOptions([]);
    toast.success('Reset complete');
  }, []);

  const handleNamesConfirmed = useCallback(async (names: string[], selectedBracketType: BracketType) => {
    try {
      setIsLoading(true);
      const newOptions = names.map((name, index) => ({ id: index, name }));
      setOptions(newOptions);
      setBracketType(selectedBracketType);
      setStep('confirm');  // Show confirmation step first
      toast.success('Names loaded successfully');
    } catch (error) {
      console.error('Error processing names:', error);
      toast.error('Error loading names. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveList = useCallback((listName: string) => {
    const success = saveList(listName, options.map(option => option.name));
    if (success) {
      toast.success('List saved successfully');
    } else {
      toast.error('Error saving list');
    }
  }, [options, saveList]);

  const handleLoadList = (list: { name: string; options: string[] }) => {
    const newOptions = list.options.map((name, index) => ({ id: index, name }));
    setOptions(newOptions);
    setStep('sort');
  };

  const handleRandomPick = () => {
    if (options.length === 0) return;
    const randomIndex = Math.floor(Math.random() * options.length);
    const randomName = options[randomIndex].name;
    alert(`Random Pick: ${randomName}`);
  };

  const handleEdit = () => {
    setStep('input');
  };

  const handleConfirm = () => {
    setStep('sort');
  };

  const handleTournamentComplete = (winner: Option) => {
    toast.success(`Tournament completed! Winner: ${winner.name}`, {
      duration: 3000,
    });
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
            {step === 'input' && (
              <NameInput 
                onSubmit={handleNamesConfirmed}
                savedLists={savedLists}
                onLoadList={handleLoadList}
              />
            )}
            {step === 'confirm' && (
              <ConfirmNames
                options={options}
                onConfirm={handleConfirm}
                onEdit={handleEdit}
                onSave={handleSaveList}
                onRandomPick={handleRandomPick}
              />
            )}
            {step === 'sort' && (
              <BiasSorter
                options={options}
                onReset={handleReset}
                onComplete={handleTournamentComplete}
                bracketType={bracketType}
              />
            )}
            {step === 'sort' && (
              <TournamentHistory />
            )}
          </main>
        )}
      </div>
    </ErrorBoundary>
  );
}
