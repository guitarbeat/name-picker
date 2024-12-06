'use client'

import { useState } from 'react';
import NameInput from '../components/NameInput';
import ConfirmNames from '../components/ConfirmNames';
import BiasSorter from '../components/BiasSorter';
import { Option } from '../utils/sortingLogic';

type Step = 'input' | 'confirm' | 'sort';

export default function Home() {
  const [options, setOptions] = useState<Option[]>([]);
  const [step, setStep] = useState<Step>('input');
  const [sorterName, setSorterName] = useState<string>('');
  const [savedLists, setSavedLists] = useState<{ 
    name: string; 
    options: Option[]; 
    sorterName: string;
    timestamp: string;
  }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedLists');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const handleNameSubmit = (names: string[]) => {
    const newOptions = names.map((name, index) => ({
      id: index + 1,
      name: name.trim()
    }));
    setOptions(newOptions);
    setStep('confirm');
  };

  const handleSaveList = (listName: string) => {
    const newList = { 
      name: listName, 
      options,
      sorterName,
      timestamp: new Date().toISOString()
    };
    const updatedLists = [...savedLists, newList];
    setSavedLists(updatedLists);
    localStorage.setItem('savedLists', JSON.stringify(updatedLists));
  };

  const handleLoadList = (list: { name: string; options: Option[] }) => {
    setOptions(list.options);
    setStep('confirm');
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

  const handleReset = () => {
    setOptions([]);
    setStep('input');
  };

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Name Picker</h1>
        {step === 'input' && (
          <div className="space-y-6 w-full max-w-2xl mx-auto">
            <NameInput 
              onSubmit={handleNameSubmit} 
              initialNames={options.map(opt => opt.name)}
              savedLists={savedLists}
              onLoadList={handleLoadList}
            />
          </div>
        )}
        {step === 'confirm' && (
          <div className="space-y-4 w-full max-w-2xl mx-auto">
            <ConfirmNames 
              options={options}
              onConfirm={handleConfirm}
              onEdit={handleEdit}
              onSave={handleSaveList}
              onRandomPick={handleRandomPick}
            />
          </div>
        )}
        {step === 'sort' && (
          <div className="w-full max-w-2xl mx-auto">
            <BiasSorter 
              title="My Bias Sorter" 
              options={options} 
              onReset={handleReset}
              sorterName={sorterName}
              onSorterNameChange={setSorterName}
            />
          </div>
        )}
      </div>
    </main>
  );
}
