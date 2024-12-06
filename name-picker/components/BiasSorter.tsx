'use client'

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { Option, initializeList, sortList, getNextComparison } from '../utils/sortingLogic';
import { motion } from 'framer-motion';

interface BiasSorterProps {
  title: string;
  options: Option[];
  onReset: () => void;
  sorterName: string;
  onSorterNameChange: (name: string) => void;
}

export default function BiasSorter({ 
  title, 
  options, 
  onReset,
  sorterName,
  onSorterNameChange 
}: BiasSorterProps) {
  const [lstMember, setLstMember] = useState<number[][]>([]);
  const [cmp1, setCmp1] = useState(0);
  const [cmp2, setCmp2] = useState(1);
  const [head1, setHead1] = useState(0);
  const [head2, setHead2] = useState(0);
  const [nrec, setNrec] = useState(0);
  const [finishSize, setFinishSize] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [sortedList, setSortedList] = useState<Option[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (options && options.length > 0 && !isInitialized) {
      const initialList = initializeList(options);
      setLstMember(initialList);
      setTotalSize(options.length - 1);
      setIsInitialized(true);
      
      const comparison = getNextComparison(initialList, 0, 1, 0, 0, options);
      if (comparison) {
        const [newCmp1, newCmp2, newHead1, newHead2] = comparison;
        setCmp1(newCmp1);
        setCmp2(newCmp2);
        setHead1(newHead1);
        setHead2(newHead2);
      }
    }
  }, [options, isInitialized]);

  const choose = (choice: number) => {
    if (!lstMember || lstMember.length === 0) return;

    const [newLstMember, newCmp1, newCmp2, newHead1, newHead2, newNrec] = sortList(
      lstMember,
      cmp1,
      cmp2,
      head1,
      head2,
      choice
    );

    setLstMember(newLstMember);
    setNrec(newNrec);
    setFinishSize(finishSize + newNrec);

    const comparison = getNextComparison(newLstMember, newCmp1, newCmp2, newHead1, newHead2, options);
    if (comparison) {
      const [nextCmp1, nextCmp2, nextHead1, nextHead2] = comparison;
      setCmp1(nextCmp1);
      setCmp2(nextCmp2);
      setHead1(nextHead1);
      setHead2(nextHead2);
    } else {
      const uniqueSortedList = Array.from(new Set(newLstMember[0].map(index => options[index].name)))
        .map((name, index) => ({ id: index, name }));
      setSortedList(uniqueSortedList);
    }
  };

  const progress = Math.min(Math.floor((finishSize / totalSize) * 100), 100);

  return (
    <div className="w-full space-y-6">
      <Card className="relative border-0 bg-gradient-to-b from-gray-900/95 to-gray-900/98 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-indigo-500/10 rounded-xl" />
        <CardHeader className="space-y-4 relative">
          <CardTitle className="text-3xl md:text-4xl text-center font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-transparent bg-clip-text">{title}</CardTitle>
          {!sortedList.length && (
            <div className="mt-4 animate-slide-in">
              <input
                type="text"
                placeholder="Enter your name"
                value={sorterName}
                onChange={(e) => onSorterNameChange(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-800/50 bg-gray-900/50 text-white text-lg transition-all focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none backdrop-blur-sm"
                required
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="h-2 w-full bg-gray-800/30 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${(finishSize / totalSize) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-gray-400 text-center">
              Progress: {Math.round((finishSize / totalSize) * 100)}%
            </p>
          </div>

          {/* Comparison section */}
          {!sortedList.length && lstMember.length > 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="animate-slide-in relative group"
                  style={{ animationDelay: '0.1s' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
                  <Button
                    onClick={() => choose(-1)}
                    className="relative w-full min-h-[8rem] text-lg md:text-xl font-medium p-4 border border-gray-800/50 bg-gray-900/50 hover:bg-gray-800/50 hover:border-gray-700/50 transition-all duration-300 backdrop-blur-sm rounded-xl"
                    variant="outline"
                    disabled={!lstMember[cmp1] || head1 >= lstMember[cmp1].length}
                  >
                    {lstMember[cmp1] && head1 < lstMember[cmp1].length ? options[lstMember[cmp1][head1]]?.name : ''}
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="animate-slide-in relative group"
                  style={{ animationDelay: '0.2s' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
                  <Button
                    onClick={() => choose(1)}
                    className="relative w-full min-h-[8rem] text-lg md:text-xl font-medium p-4 border border-gray-800/50 bg-gray-900/50 hover:bg-gray-800/50 hover:border-gray-700/50 transition-all duration-300 backdrop-blur-sm rounded-xl"
                    variant="outline"
                    disabled={!lstMember[cmp2] || head2 >= lstMember[cmp2].length}
                  >
                    {lstMember[cmp2] && head2 < lstMember[cmp2].length ? options[lstMember[cmp2][head2]]?.name : ''}
                  </Button>
                </motion.div>
              </div>

              {/* Additional options */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg blur-lg group-hover:blur-xl transition-all opacity-0 group-hover:opacity-100" />
                  <Button
                    onClick={() => choose(0)}
                    className="relative w-full p-3 text-sm md:text-base font-medium border border-gray-800/50 bg-gray-900/50 hover:bg-gray-800/50 hover:border-gray-700/50 transition-all duration-300 backdrop-blur-sm rounded-lg"
                    variant="outline"
                  >
                    Equal Preference
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-500/20 to-slate-500/20 rounded-lg blur-lg group-hover:blur-xl transition-all opacity-0 group-hover:opacity-100" />
                  <Button
                    onClick={() => choose(2)}
                    className="relative w-full p-3 text-sm md:text-base font-medium border border-gray-800/50 bg-gray-900/50 hover:bg-gray-800/50 hover:border-gray-700/50 transition-all duration-300 backdrop-blur-sm rounded-lg"
                    variant="outline"
                  >
                    No Opinion
                  </Button>
                </motion.div>
              </div>
            </div>
          )}

          {/* Results section */}
          {sortedList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h3 className="text-2xl md:text-3xl font-semibold text-center bg-gradient-to-r from-blue-500 to-indigo-500 text-transparent bg-clip-text">Final Rankings</h3>
              <div className="space-y-3">
                {sortedList.map((option, index) => (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 border border-gray-800/50 bg-gray-900/50 backdrop-blur-sm rounded-lg hover:bg-gray-800/50 hover:border-gray-700/50 transition-all hover:translate-x-2 group"
                  >
                    <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-transparent bg-clip-text min-w-[3rem]">
                      #{index + 1}
                    </span>
                    <span className="text-lg md:text-xl group-hover:text-blue-400 transition-colors">{option.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <Button
            onClick={onReset}
            variant="outline"
            className="w-full mt-6 py-6 text-lg border border-gray-800/50 bg-gray-900/50 hover:bg-gray-800/50 hover:border-gray-700/50 transition-all duration-300 backdrop-blur-sm rounded-xl relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-orange-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
            <span className="relative">Start Over</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
