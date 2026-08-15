import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, UserCheck } from 'lucide-react';

interface IdentityModalProps {
  initialFirstName?: string;
  initialLastName?: string;
  onSubmit: (firstName: string, lastName: string) => void;
}

export const IdentityModal: React.FC<IdentityModalProps> = ({
  initialFirstName = '',
  initialLastName = '',
  onSubmit
}) => {
  const [firstName, setFirstName] = useState(initialFirstName === 'Александр' ? '' : initialFirstName);
  const [lastName, setLastName] = useState(initialLastName === 'Северов' ? '' : initialLastName);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();

    if (!cleanFirst || !cleanLast) {
      setError('Пожалуйста, введите и Имя, и Фамилию.');
      return;
    }

    if (cleanFirst.length < 2 || cleanLast.length < 2) {
      setError('Имя и Фамилия должны содержать минимум 2 символа.');
      return;
    }

    onSubmit(cleanFirst, cleanLast);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#06080C]/95 backdrop-blur-2xl" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-[#0C0D12] border border-indigo-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(99,102,241,0.15)] flex flex-col"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            <ShieldCheck size={32} className="text-indigo-400" />
          </div>

          <span className="inline-block px-3 py-1 mb-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-[0.2em]">
            SA GOV TECH REGISTRY
          </span>

          <h2 className="text-2xl font-black text-white mb-2">
            Идентификация Гражданина
          </h2>
          <p className="text-sm font-mono text-zinc-400 leading-relaxed">
            Для работы в Государственном реестре укажите ваше полное Имя и Фамилию.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Имя гражданина</label>
            <input 
              type="text" 
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setError(''); }}
              placeholder="Например: Александр"
              autoFocus
              className="w-full bg-black/60 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white font-bold focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Фамилия</label>
            <input 
              type="text" 
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setError(''); }}
              placeholder="Например: Северов"
              className="w-full bg-black/60 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white font-bold focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-xl text-center"
            >
              {error}
            </motion.div>
          )}

          <button 
            type="submit" 
            className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30 active:scale-95 transition-all"
          >
            <UserCheck size={18} /> Подтвердить доступ
          </button>
        </form>
      </motion.div>
    </div>
  );
};
