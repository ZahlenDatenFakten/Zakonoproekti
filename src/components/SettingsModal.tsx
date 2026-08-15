import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { UserProfile, OfficialRole, RolePinRegistry, AuditLogEntry } from '../types/bill';
import { OFFICIAL_ROLE_LABELS } from '../types/bill';
import { CustomSelect } from './CustomSelect';
import { verifyRolePin, getPinRegistry, savePinRegistry, updateOfficialPin, isSystemAdmin, getAuditLogs } from '../services/securityService';
import { X, User, Key, ShieldCheck, Check, Clock, Lock } from 'lucide-react';
import { cn } from '../utils/cn';

interface SettingsModalProps {
  user: UserProfile;
  onUpdateProfile: (firstName: string, lastName: string, officialRole: OfficialRole, isVerified: boolean) => void;
  onClose: () => void;
  onToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  onUpdateProfile,
  onClose,
  onToast
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'official' | 'changepin' | 'admin' | 'audit'>('profile');

  // Profile Form
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);

  // Official PIN Form
  const [targetRole, setTargetRole] = useState<OfficialRole>('prosecutor');
  const [rolePin, setRolePin] = useState('');

  // Change PIN Form
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  // Admin Code Form
  const [adminCodeInput, setAdminCodeInput] = useState('');

  // Admin Manage PINs Form
  const [pinRegistry, setPinRegistryState] = useState<RolePinRegistry>(getPinRegistry());

  // Audit Logs
  const auditLogs: AuditLogEntry[] = getAuditLogs();

  const handleSaveProfile = () => {
    if (!firstName.trim() || !lastName.trim()) {
      onToast('error', 'Заполните Имя и Фамилию');
      return;
    }
    onUpdateProfile(firstName.trim(), lastName.trim(), user.officialRole, user.isOfficialVerified);
    onToast('success', 'Личные данные сохранены');
    onClose();
  };

  const handleActivateRole = () => {
    try {
      if (verifyRolePin(targetRole, rolePin)) {
        onUpdateProfile(firstName.trim(), lastName.trim(), targetRole, true);
        onToast('success', `Активирован служебный статус: ${OFFICIAL_ROLE_LABELS[targetRole]}`);
        setRolePin('');
        onClose();
      } else {
        onToast('error', 'Неверный служебный PIN-код для выбранной должности');
      }
    } catch (err: any) {
      onToast('error', err.message || 'Ошибка авторизации');
    }
  };

  const handleActivateAdmin = () => {
    try {
      if (verifyRolePin('admin', adminCodeInput)) {
        onUpdateProfile(firstName.trim(), lastName.trim(), 'admin', true);
        onToast('success', 'Права Системного Администратора подтверждены');
        setAdminCodeInput('');
        setActiveTab('admin');
      } else {
        onToast('error', 'Неверный Секретный Код Администратора');
      }
    } catch (err: any) {
      onToast('error', err.message || 'Ошибка авторизации');
    }
  };

  const handleChangePin = () => {
    if (!currentPinInput.trim() || !newPinInput.trim() || !confirmPinInput.trim()) {
      onToast('error', 'Заполните все поля смены PIN-кода');
      return;
    }
    if (newPinInput.trim() !== confirmPinInput.trim()) {
      onToast('error', 'Новый PIN-код и подтверждение не совпадают');
      return;
    }
    try {
      updateOfficialPin(user.officialRole, currentPinInput, newPinInput);
      onToast('success', `PIN-код успешно изменен для роли: ${OFFICIAL_ROLE_LABELS[user.officialRole]}`);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
    } catch (err: any) {
      onToast('error', err.message || 'Ошибка смены PIN-кода');
    }
  };

  const handleSavePinRegistry = () => {
    savePinRegistry(pinRegistry);
    onToast('success', 'Реестр служебных PIN-кодов ролей обновлен');
  };

  const handleResetRole = () => {
    onUpdateProfile(firstName.trim(), lastName.trim(), 'civilian', false);
    onToast('info', 'Служебный статус сброшен до Гражданина');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#0C0D12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <User size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Личный кабинет и Безопасность</h3>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">
                {user.firstName} {user.lastName} &bull; <span className="text-indigo-400 font-bold">{OFFICIAL_ROLE_LABELS[user.officialRole]}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 p-1 bg-black/60 border border-white/10 rounded-xl mb-6">
            {[
              { id: 'profile', label: '👤 Профиль' },
              { id: 'official', label: '🔑 Авторизация' },
              { id: 'changepin', label: '🛡️ Смена PIN' },
              { id: 'admin', label: '👑 Админ-панель' },
              { id: 'audit', label: '📝 Аудит' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={cn(
                  "flex-1 min-w-[100px] py-2 px-3 text-xs font-bold rounded-lg transition-all",
                  activeTab === t.id ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Имя гражданина / чиновника:</label>
                <input
                  type="text"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Имя..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Фамилия:</label>
                <input
                  type="text"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Фамилия..."
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                {user.isOfficialVerified ? (
                  <button
                    onClick={handleResetRole}
                    className="text-xs font-mono text-zinc-500 hover:text-zinc-300 underline underline-offset-4 transition-colors"
                  >
                    Сбросить служебный статус
                  </button>
                ) : <div/>}
                <button 
                  onClick={handleSaveProfile} 
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30 active:scale-95 transition-all"
                >
                  Сохранить профиль
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 2: Official Role PIN Activation */}
          {activeTab === 'official' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                Для голосования на 1-м этапе требуется авторизация служебным PIN-кодом:
              </p>

              <div>
                <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Должность Законодательной Комиссии:</label>
                <CustomSelect
                  options={[
                    { value: 'prosecutor', label: '⚖️ Генеральный прокурор' },
                    { value: 'judge', label: '🏛️ Председатель Верховного суда' },
                    { value: 'governor', label: '📜 Губернатор Штата' }
                  ]}
                  value={targetRole}
                  onChange={(val) => setTargetRole(val as OfficialRole)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Персональный PIN-код служащего:</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
                  placeholder="Введите PIN-код..."
                  value={rolePin}
                  onChange={(e) => setRolePin(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleActivateRole} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30 active:scale-95 transition-all"
                >
                  <Key size={16} /> Подтвердить полномочия
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 3: Change Official PIN Password */}
          {activeTab === 'changepin' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {!user.isOfficialVerified || user.officialRole === 'civilian' ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-xs text-amber-200/80 leading-relaxed font-medium">
                    ⚠️ <strong className="text-amber-400">Смена PIN-кода ограниченного доступа:</strong> Данный раздел предназначен для верифицированных должностных лиц (Губернатор, Генпрокурор, Председатель суда, Администратор). Сначала подтвердите свои полномочия на вкладке «Авторизация».
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-black/40 border border-white/10 rounded-xl p-4 mb-2">
                    <div className="text-sm font-bold text-indigo-400 mb-1 font-mono uppercase tracking-wider">
                      {OFFICIAL_ROLE_LABELS[user.officialRole]}
                    </div>
                    <div className="text-xs text-zinc-400 leading-relaxed">
                      Вы можете самостоятельно обновить свой персональный PIN-код для входа.
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Текущий PIN-код:</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
                      placeholder="Введите действующий PIN..."
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Новый PIN-код:</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
                      placeholder="Новый PIN-код (минимум 4 символа)..."
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Подтверждение нового PIN-кода:</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
                      placeholder="Повторите новый PIN-код..."
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={handleChangePin} 
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30 active:scale-95 transition-all"
                    >
                      <Lock size={16} /> Сохранить новый PIN-код
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: Admin Panel */}
          {activeTab === 'admin' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {!isSystemAdmin(user) ? (
                <div className="space-y-5">
                  <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                    Для доступа к вердиктам 2-го этапа введите Секретный Код Администратора:
                  </p>

                  <div>
                    <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Секретный Код Администратора:</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
                      placeholder="Код доступа..."
                      value={adminCodeInput}
                      onChange={(e) => setAdminCodeInput(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={handleActivateAdmin} 
                      className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-amber-500/20 border border-amber-400/30 active:scale-95 transition-all"
                    >
                      <ShieldCheck size={16} /> Авторизовать Администратора
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-3">
                    <Check size={18} className="text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">Системный Администратор авторизован (2-й этап активен).</span>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider mb-4">
                      Реестр PIN-кодов должностей
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">PIN Прокурора:</label>
                        <input
                          type="text"
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                          value={pinRegistry.prosecutor}
                          onChange={(e) => setPinRegistryState({ ...pinRegistry, prosecutor: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">PIN Судьи:</label>
                        <input
                          type="text"
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                          value={pinRegistry.judge}
                          onChange={(e) => setPinRegistryState({ ...pinRegistry, judge: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">PIN Губернатора:</label>
                        <input
                          type="text"
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                          value={pinRegistry.governor}
                          onChange={(e) => setPinRegistryState({ ...pinRegistry, governor: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Код Админа:</label>
                        <input
                          type="text"
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                          value={pinRegistry.adminCode}
                          onChange={(e) => setPinRegistryState({ ...pinRegistry, adminCode: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={handleSavePinRegistry} 
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-amber-500/20 border border-amber-400/30 active:scale-95 transition-all"
                    >
                      Сохранить PIN-коды
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 5: Audit Logs */}
          {activeTab === 'audit' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                    <ShieldCheck size={16} className="text-emerald-400" /> Защита Audit-Trail SA GOV TECH
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    Zero-Trust Access Control &bull; SHA-256 System Integrity
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider mb-4">
                  Журнал событий реестра
                </h4>

                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="bg-white/[0.02] border border-white/10 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">{log.action}</span>
                        <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                          <Clock size={12} /> {new Date(log.timestamp).toLocaleTimeString('ru-RU')}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-zinc-400 leading-relaxed break-words">{log.details}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-5 border-t border-white/10 bg-black/40 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-bold rounded-xl border border-white/10 transition-colors"
          >
            Закрыть
          </button>
        </div>

      </motion.div>
    </div>
  );
};
