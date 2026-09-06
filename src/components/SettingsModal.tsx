import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { UserProfile, OfficialRole, RolePinRegistry, AuditLogEntry } from '../types/bill';
import { OFFICIAL_ROLE_LABELS } from '../types/bill';
import { CustomSelect } from './CustomSelect';
import { verifyRolePin, getPinRegistry, savePinRegistry, updateOfficialPin, isSystemAdmin, getAuditLogs } from '../services/securityService';
import { X, User, Key, ShieldCheck, Check, Clock, Lock } from 'lucide-react';
import { R, ft, label, mono, shadow, chip, btnAccent, btnOutline } from '../lib/ui';
import { ConfirmModal } from './ConfirmModal';

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
  const [showConfirmResetRole, setShowConfirmResetRole] = useState(false);

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
      onClose();
    } catch (err: any) {
      onToast('error', err.message || 'Ошибка смены PIN-кода');
    }
  };

  const handleSavePinRegistry = () => {
    savePinRegistry(pinRegistry);
    onToast('success', 'Реестр служебных PIN-кодов успешно обновлен');
  };

  const handleResetRole = () => {
    setShowConfirmResetRole(true);
  };

  const executeResetRole = () => {
    setShowConfirmResetRole(false);
    onUpdateProfile(user.firstName, user.lastName, 'civilian', false);
    onToast('info', 'Служебный статус сброшен до Гражданского лица');
    onClose();
  };

  const tabs = [
    { id: 'profile', label: 'Профиль' },
    { id: 'official', label: 'Авторизация' },
    { id: 'changepin', label: 'Смена PIN' },
    { id: 'admin', label: 'Админ-панель' },
    { id: 'audit', label: 'Аудит' },
  ] as const;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(10, 9, 8, 0.7)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
          background: R.bgPanel,
          border: ft.strong,
          borderRadius: 2,
          boxShadow: shadow.panel,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: ft.hair,
            background: R.bgElevated,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', background: R.accentSubtle, color: R.accent, borderRadius: 2 }}>
              <User size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: R.text, margin: 0 }}>
                Личный кабинет и безопасность
              </h3>
              <div style={{ fontSize: 11, fontFamily: mono, color: R.textMuted, marginTop: 1 }}>
                {user.firstName} {user.lastName} · {OFFICIAL_ROLE_LABELS[user.officialRole]}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{
              background: 'none',
              border: 'none',
              color: R.textMuted,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div style={{ padding: 20, overflowY: 'auto' }} className="rt-scroll">
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={chip(activeTab === t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ ...label, display: 'block', marginBottom: 6 }}>Имя гражданина / чиновника:</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Имя..."
                  style={{
                    width: '100%',
                    height: 38,
                    padding: '0 12px',
                    fontSize: 14,
                    fontWeight: 700,
                    background: R.bgInput,
                    border: ft.edge,
                    color: R.text,
                    borderRadius: 2,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ ...label, display: 'block', marginBottom: 6 }}>Фамилия:</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Фамилия..."
                  style={{
                    width: '100%',
                    height: 38,
                    padding: '0 12px',
                    fontSize: 14,
                    fontWeight: 700,
                    background: R.bgInput,
                    border: ft.edge,
                    color: R.text,
                    borderRadius: 2,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
                {user.isOfficialVerified ? (
                  <button
                    onClick={handleResetRole}
                    style={{ fontSize: 11, fontFamily: mono, color: R.textMuted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Сбросить служебный статус
                  </button>
                ) : <div/>}
                <button 
                  onClick={handleSaveProfile} 
                  style={btnAccent}
                >
                  Сохранить профиль
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Official Role PIN Activation */}
          {activeTab === 'official' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 13, color: R.textSecondary, margin: 0 }}>
                Для голосования на 1-м этапе требуется авторизация служебным PIN-кодом:
              </p>

              <div>
                <label style={{ ...label, display: 'block', marginBottom: 6 }}>Должность Законодательной Комиссии:</label>
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
                <label style={{ ...label, display: 'block', marginBottom: 6 }}>Персональный PIN-код служащего:</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Введите PIN-код..."
                  value={rolePin}
                  onChange={(e) => setRolePin(e.target.value)}
                  style={{
                    width: '100%',
                    height: 38,
                    padding: '0 12px',
                    fontSize: 14,
                    background: R.bgInput,
                    border: ft.edge,
                    color: R.text,
                    borderRadius: 2,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                <button 
                  onClick={handleActivateRole} 
                  style={btnAccent}
                >
                  <Key size={14} /> Подтвердить полномочия
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Change Official PIN */}
          {activeTab === 'changepin' && (
            <div>
              {!user.isOfficialVerified || user.officialRole === 'civilian' ? (
                <div style={{ padding: 14, background: R.warningSubtle, border: `1px solid ${R.warning}`, borderRadius: 2 }}>
                  <p style={{ fontSize: 12, color: R.warning, margin: 0 }}>
                    ⚠️ <strong>Смена PIN-кода ограниченного доступа:</strong> Данный раздел предназначен для верифицированных должностных лиц (Губернатор, Генпрокурор, Председатель суда, Администратор). Сначала подтвердите свои полномочия на вкладке «Авторизация».
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: R.bgInput, border: ft.hair, borderRadius: 2, padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: R.accent, fontFamily: mono, textTransform: 'uppercase' }}>
                      {OFFICIAL_ROLE_LABELS[user.officialRole]}
                    </div>
                    <div style={{ fontSize: 12, color: R.textMuted, marginTop: 4 }}>
                      Вы можете самостоятельно обновить свой персональный PIN-код для входа.
                    </div>
                  </div>

                  <div>
                    <label style={{ ...label, display: 'block', marginBottom: 6 }}>Текущий PIN-код:</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Введите действующий PIN..."
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value)}
                      style={{
                        width: '100%',
                        height: 38,
                        padding: '0 12px',
                        fontSize: 14,
                        background: R.bgInput,
                        border: ft.edge,
                        color: R.text,
                        borderRadius: 2,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ ...label, display: 'block', marginBottom: 6 }}>Новый PIN-код:</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Новый PIN-код (минимум 4 символа)..."
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value)}
                      style={{
                        width: '100%',
                        height: 38,
                        padding: '0 12px',
                        fontSize: 14,
                        background: R.bgInput,
                        border: ft.edge,
                        color: R.text,
                        borderRadius: 2,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ ...label, display: 'block', marginBottom: 6 }}>Подтверждение нового PIN-кода:</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Повторите новый PIN-код..."
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value)}
                      style={{
                        width: '100%',
                        height: 38,
                        padding: '0 12px',
                        fontSize: 14,
                        background: R.bgInput,
                        border: ft.edge,
                        color: R.text,
                        borderRadius: 2,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                    <button 
                      onClick={handleChangePin} 
                      style={btnAccent}
                    >
                      <Lock size={14} /> Сохранить новый PIN-код
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Admin Panel */}
          {activeTab === 'admin' && (
            <div>
              {!isSystemAdmin(user) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: 13, color: R.textSecondary, margin: 0 }}>
                    Для доступа к вердиктам 2-го этапа введите Секретный Код Администратора:
                  </p>

                  <div>
                    <label style={{ ...label, display: 'block', marginBottom: 6 }}>Секретный Код Администратора:</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Код доступа..."
                      value={adminCodeInput}
                      onChange={(e) => setAdminCodeInput(e.target.value)}
                      style={{
                        width: '100%',
                        height: 38,
                        padding: '0 12px',
                        fontSize: 14,
                        background: R.bgInput,
                        border: ft.edge,
                        color: R.text,
                        borderRadius: 2,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                    <button 
                      onClick={handleActivateAdmin} 
                      style={btnAccent}
                    >
                      <ShieldCheck size={14} /> Авторизовать Администратора
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: R.successSubtle, border: `1px solid ${R.success}`, padding: '10px 14px', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Check size={16} color={R.success} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: R.success }}>Системный Администратор авторизован (2-й этап активен).</span>
                  </div>

                  <div>
                    <div style={{ ...label, marginBottom: 10, color: R.accent }}>
                      Реестр PIN-кодов должностей
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ ...label, display: 'block', marginBottom: 4 }}>PIN Прокурора:</label>
                        <input
                          type="text"
                          value={pinRegistry.prosecutor}
                          onChange={(e) => setPinRegistryState({ ...pinRegistry, prosecutor: e.target.value })}
                          style={{ width: '100%', height: 34, padding: '0 10px', fontSize: 12, fontFamily: mono, background: R.bgInput, border: ft.edge, color: R.text, borderRadius: 2 }}
                        />
                      </div>

                      <div>
                        <label style={{ ...label, display: 'block', marginBottom: 4 }}>PIN Судьи:</label>
                        <input
                          type="text"
                          value={pinRegistry.judge}
                          onChange={(e) => setPinRegistryState({ ...pinRegistry, judge: e.target.value })}
                          style={{ width: '100%', height: 34, padding: '0 10px', fontSize: 12, fontFamily: mono, background: R.bgInput, border: ft.edge, color: R.text, borderRadius: 2 }}
                        />
                      </div>

                      <div>
                        <label style={{ ...label, display: 'block', marginBottom: 4 }}>PIN Губернатора:</label>
                        <input
                          type="text"
                          value={pinRegistry.governor}
                          onChange={(e) => setPinRegistryState({ ...pinRegistry, governor: e.target.value })}
                          style={{ width: '100%', height: 34, padding: '0 10px', fontSize: 12, fontFamily: mono, background: R.bgInput, border: ft.edge, color: R.text, borderRadius: 2 }}
                        />
                      </div>

                      <div>
                        <label style={{ ...label, display: 'block', marginBottom: 4 }}>Код Админа:</label>
                        <input
                          type="text"
                          value={pinRegistry.adminCode}
                          onChange={(e) => setPinRegistryState({ ...pinRegistry, adminCode: e.target.value })}
                          style={{ width: '100%', height: 34, padding: '0 10px', fontSize: 12, fontFamily: mono, background: R.bgInput, border: ft.edge, color: R.text, borderRadius: 2 }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                    <button 
                      onClick={handleSavePinRegistry} 
                      style={btnAccent}
                    >
                      Сохранить PIN-коды
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Audit Logs */}
          {activeTab === 'audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: R.bgInput, border: ft.hair, borderRadius: 2, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: R.text }}>
                  <ShieldCheck size={15} color={R.success} /> Журнал аудита SA GOV TECH
                </div>
                <div style={{ fontSize: 10, fontFamily: mono, color: R.textMuted, marginTop: 2, textTransform: 'uppercase' }}>
                  Zero-Trust Access Control · SHA-256 System Integrity
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }} className="rt-scroll">
                {auditLogs.map((log) => (
                  <div key={log.id} style={{ background: R.bgInput, border: ft.hair, borderRadius: 2, padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: R.text }}>{log.action}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontFamily: mono, color: R.textMuted }}>
                        <Clock size={11} /> {new Date(log.timestamp).toLocaleTimeString('ru-RU')}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, fontFamily: mono, color: R.textSecondary, lineHeight: 1.4 }}>{log.details}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: ft.hair,
            background: R.bgElevated,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button 
            onClick={onClose} 
            style={btnOutline}
          >
            Закрыть
          </button>
        </div>

      </motion.div>

      {showConfirmResetRole && (
        <ConfirmModal
          title="Сбросить служебный статус?"
          message="Вы перейдете в статус Гражданского лица. Доступ к голосованию в Законодательной Комиссии и служебным разделам будет деактивирован."
          confirmLabel="Сбросить статус"
          onConfirm={executeResetRole}
          onCancel={() => setShowConfirmResetRole(false)}
        />
      )}
    </div>
  );
};
