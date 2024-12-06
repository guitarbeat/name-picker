'use client'

import { useState, useCallback } from 'react';
import NameInput from '@/components/features/name-picker/NameInput';
import ConfirmNames from '@/components/features/name-picker/ConfirmNames';
import BiasSorter from '@/components/features/name-picker/BiasSorter';
import { Option } from '@/lib/sortingLogic';
import { TournamentHistory } from '@/components/features/tournament/TournamentHistory';
import { toast } from 'react-hot-toast';
import { BracketType } from '@/lib/defaults';

type Step = 'input' | 'confirm' | 'sort';

export default function Home() {
  const [options, setOptions] = useState<Option[]>([]);
  const [step, setStep] = useState<Step>('input');
  const [savedLists, setSavedLists] = useState<{ 
    name: string; 
    options: string[]; 
    timestamp: string;
    type: string;
  }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nameLists');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [bracketType, setBracketType] = useState<BracketType>('single');

  const handleReset = useCallback(() => {
    setStep('input');
    setOptions([]);
  }, []);

  const handleNamesConfirmed = useCallback((names: string[], selectedBracketType: BracketType) => {
    const newOptions = names.map((name, index) => ({ id: index, name }));
    setOptions(newOptions);
    setBracketType(selectedBracketType);
    setStep('confirm');  // Show confirmation step first
  }, []);

  const handleSaveList = (listName: string) => {
    const newList = { 
      name: listName, 
      options: options.map(option => option.name),
      timestamp: new Date().toISOString(),
      type: 'nameList'
    };
    const updatedLists = [...savedLists, newList];
    setSavedLists(updatedLists);
    localStorage.setItem('nameLists', JSON.stringify(updatedLists));
  };

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
  );
}
