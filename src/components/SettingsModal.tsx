import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { UserProfile, OfficialRole, RolePinRegistry, AuditLogEntry } from '../types/bill';
import { OFFICIAL_ROLE_LABELS } from '../types/bill';
import { CustomSelect } from './CustomSelect';
import { 
  verifyRolePin, 
  getPinRegistry, 
  savePinRegistry, 
  updateOfficialPin, 
  isSystemAdmin, 
  getAuditLogs,
  isUserRevokedFromRole,
  isDefaultRolePin,
  isCurrentRolePinDefault,
  isPinTrivialOrUnsafe
} from '../services/securityService';
import { X, User, Key, ShieldCheck, Check, Clock, Lock, ShieldAlert, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { R, ft, label, mono, shadow, chip, btnAccent, btnOutline } from '../lib/ui';
import { ConfirmModal } from './ConfirmModal';

interface SettingsModalProps {
  user: UserProfile;
  onUpdateProfile: (firstName: string, lastName: string, officialRole: OfficialRole, isVerified: boolean) => void;
  onClose: () => void;
  onToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

interface ForcedPasswordChangeState {
  role: OfficialRole;
  enteredPin: string;
  firstName: string;
  lastName: string;
  reason?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  onUpdateProfile,
  onClose,
  onToast
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'official' | 'changepin' | 'admin' | 'audit'>('profile');
  const [showConfirmResetRole, setShowConfirmResetRole] = useState(false);

  // Mandatory Password Change state when entering or having default PINs
  const [forcedPasswordChange, setForcedPasswordChange] = useState<ForcedPasswordChangeState | null>(null);
  const [forcedNewPin, setForcedNewPin] = useState('');
  const [forcedConfirmPin, setForcedConfirmPin] = useState('');
  const [showForcedPin, setShowForcedPin] = useState(false);

  // Profile Form
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);

  // Official PIN Form
  const [targetRole, setTargetRole] = useState<OfficialRole>(() => {
    if (user.officialRole && user.officialRole !== 'civilian') {
      return user.officialRole;
    }
    return 'governor';
  });
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
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const revoked = isUserRevokedFromRole(cleanFirst, cleanLast, user.officialRole);
    const roleToSet = revoked.isRevoked ? 'civilian' : user.officialRole;
    const verifiedToSet = revoked.isRevoked ? false : user.isOfficialVerified;

    onUpdateProfile(cleanFirst, cleanLast, roleToSet, verifiedToSet);
    if (revoked.isRevoked) {
      onToast('error', revoked.reason || 'Служебные полномочия отозваны.');
    } else {
      onToast('success', 'Личные данные сохранены');
    }
    onClose();
  };

  const handleActivateRole = () => {
    try {
      const cleanFirst = firstName.trim();
      const cleanLast = lastName.trim();

      // Smart auto-detect role if entered PIN matches another position (e.g. entered Governor PIN while dropdown is on another role)
      let roleToVerify = targetRole;
      if (!verifyRolePin(targetRole, rolePin, cleanFirst, cleanLast)) {
        if (verifyRolePin('governor', rolePin, cleanFirst, cleanLast)) {
          roleToVerify = 'governor';
        } else if (verifyRolePin('admin', rolePin, cleanFirst, cleanLast)) {
          roleToVerify = 'admin';
        } else if (verifyRolePin('judge', rolePin, cleanFirst, cleanLast)) {
          roleToVerify = 'judge';
        } else if (verifyRolePin('prosecutor', rolePin, cleanFirst, cleanLast)) {
          roleToVerify = 'prosecutor';
        }
      }

      const revoked = isUserRevokedFromRole(cleanFirst, cleanLast, roleToVerify);
      if (revoked.isRevoked) {
        onToast('error', revoked.reason || 'Служебные полномочия для данного гражданина отозваны.');
        return;
      }

      if (verifyRolePin(roleToVerify, rolePin, cleanFirst, cleanLast)) {
        const enteredIsDefault = isDefaultRolePin(roleToVerify, rolePin);
        const currentIsDefault = isCurrentRolePinDefault(roleToVerify);

        // Security Requirement: If entered PIN is default or role still uses default, force password change immediately
        if (enteredIsDefault || currentIsDefault) {
          setForcedPasswordChange({
            role: roleToVerify,
            enteredPin: rolePin.trim(),
            firstName: cleanFirst,
            lastName: cleanLast,
            reason: enteredIsDefault 
              ? 'Обнаружен стандартный заводской дефолтный пароль.' 
              : 'Для данной должности в системе всё ещё активен дефолтный пароль.'
          });
          setForcedNewPin('');
          setForcedConfirmPin('');
          onToast('info', '⚠️ Внимание: Введён стандартный заводской пароль! Перед получением доступа вы обязаны установить новый защищённый пароль.');
          return;
        }

        onUpdateProfile(cleanFirst, cleanLast, roleToVerify, true);
        onToast('success', `Активирован служебный статус: ${OFFICIAL_ROLE_LABELS[roleToVerify]}`);
        setRolePin('');
        if (roleToVerify === 'admin') {
          setActiveTab('admin');
        } else {
          onClose();
        }
      } else {
        onToast('error', roleToVerify === 'admin' ? 'Неверный Секретный Код Администратора' : 'Неверный служебный PIN-код для выбранной должности');
      }
    } catch (err: any) {
      onToast('error', err.message || 'Ошибка авторизации');
    }
  };

  const handleActivateAdmin = () => {
    try {
      const cleanAdminPin = adminCodeInput.trim();
      const cleanFirst = firstName.trim();
      const cleanLast = lastName.trim();

      if (verifyRolePin('admin', cleanAdminPin)) {
        const enteredIsDefault = isDefaultRolePin('admin', cleanAdminPin);
        const currentIsDefault = isCurrentRolePinDefault('admin');

        if (enteredIsDefault || currentIsDefault) {
          setForcedPasswordChange({
            role: 'admin',
            enteredPin: cleanAdminPin,
            firstName: cleanFirst,
            lastName: cleanLast,
            reason: 'Введён стандартный заводской код Администратора (999000).'
          });
          setForcedNewPin('');
          setForcedConfirmPin('');
          onToast('info', '⚠️ Внимание: Введён стандартный код Администратора (999000)! Перед получением доступа вы обязаны установить новый защищённый пароль.');
          return;
        }

        onUpdateProfile(cleanFirst, cleanLast, 'admin', true);
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

  const handleCommitForcedPasswordChange = () => {
    if (!forcedPasswordChange) return;

    const cleanNew = forcedNewPin.trim();
    const cleanConfirm = forcedConfirmPin.trim();

    if (!cleanNew || !cleanConfirm) {
      onToast('error', 'Заполните оба поля: новый пароль и подтверждение');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      onToast('error', 'Новый пароль и подтверждение не совпадают');
      return;
    }

    try {
      updateOfficialPin(forcedPasswordChange.role, forcedPasswordChange.enteredPin, cleanNew);
      onUpdateProfile(forcedPasswordChange.firstName, forcedPasswordChange.lastName, forcedPasswordChange.role, true);
      onToast('success', `🎉 Новый защищённый пароль успешно сохранён! Активирован статус: ${OFFICIAL_ROLE_LABELS[forcedPasswordChange.role]}`);
      
      const activatedRole = forcedPasswordChange.role;
      setForcedPasswordChange(null);
      setRolePin('');
      setAdminCodeInput('');
      setForcedNewPin('');
      setForcedConfirmPin('');
      setPinRegistryState(getPinRegistry());

      if (activatedRole === 'admin') {
        setActiveTab('admin');
      } else {
        onClose();
      }
    } catch (err: any) {
      onToast('error', err.message || 'Ошибка сохранения пароля');
    }
  };

  const handleCancelForcedPasswordChange = () => {
    setForcedPasswordChange(null);
    setRolePin('');
    setAdminCodeInput('');
    setForcedNewPin('');
    setForcedConfirmPin('');
    onToast('info', 'Авторизация отменена. Стандартный пароль не был активирован.');
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
      setPinRegistryState(getPinRegistry());
      onClose();
    } catch (err: any) {
      onToast('error', err.message || 'Ошибка смены PIN-кода');
    }
  };

  const handleSavePinRegistry = () => {
    let hasUnsafe = false;
    for (const [, pin] of Object.entries(pinRegistry)) {
      if (isPinTrivialOrUnsafe(pin)) {
        hasUnsafe = true;
        break;
      }
    }
    savePinRegistry(pinRegistry);
    if (hasUnsafe) {
      onToast('info', 'Внимание: В реестре сохранены стандартные (небезопасные) PIN-коды. Рекомендуется сменить их.');
    } else {
      onToast('success', 'Реестр служебных PIN-кодов успешно обновлен');
    }
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

  const isAdmin = isSystemAdmin(user);
  const isOfficial = user.isOfficialVerified && user.officialRole !== 'civilian';

  const tabs = useMemo(() => {
    const list: { id: 'profile' | 'official' | 'changepin' | 'admin' | 'audit'; label: string }[] = [
      { id: 'profile', label: 'Профиль' },
      { id: 'official', label: 'Авторизация' },
    ];
    if (isOfficial) {
      list.push({ id: 'changepin', label: 'Смена PIN' });
    }
    if (isAdmin) {
      list.push({ id: 'admin', label: 'Админ-панель' });
      list.push({ id: 'audit', label: 'Аудит' });
    }
    return list;
  }, [isOfficial, isAdmin]);

  useEffect(() => {
    if (!isAdmin && (activeTab === 'admin' || activeTab === 'audit')) {
      setActiveTab('profile');
    }
    if (!isOfficial && activeTab === 'changepin') {
      setActiveTab('profile');
    }
  }, [isAdmin, isOfficial, activeTab]);

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
            background: forcedPasswordChange ? 'rgba(239, 68, 68, 0.08)' : R.bgElevated,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 32, 
              height: 32, 
              display: 'grid', 
              placeItems: 'center', 
              background: forcedPasswordChange ? 'rgba(239, 68, 68, 0.2)' : R.accentSubtle, 
              color: forcedPasswordChange ? '#ef4444' : R.accent, 
              borderRadius: 2 
            }}>
              {forcedPasswordChange ? <ShieldAlert size={18} /> : <User size={16} />}
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: forcedPasswordChange ? '#ef4444' : R.text, margin: 0 }}>
                {forcedPasswordChange ? 'Обязательная смена стандартного пароля' : 'Личный кабинет и безопасность'}
              </h3>
              <div style={{ fontSize: 11, fontFamily: mono, color: R.textMuted, marginTop: 1 }}>
                {forcedPasswordChange 
                  ? `Должность: ${OFFICIAL_ROLE_LABELS[forcedPasswordChange.role]} (${forcedPasswordChange.firstName} ${forcedPasswordChange.lastName})`
                  : `${user.firstName} ${user.lastName} · ${OFFICIAL_ROLE_LABELS[user.officialRole]}`
                }
              </div>
            </div>
          </div>
          <button 
            onClick={forcedPasswordChange ? handleCancelForcedPasswordChange : onClose} 
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
          {forcedPasswordChange ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Security Alert Banner */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 4,
                padding: '14px 16px',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start'
              }}>
                <AlertTriangle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171', marginBottom: 4 }}>
                    Обнаружен стандартный (заводской) пароль!
                  </div>
                  <div style={{ fontSize: 12, color: R.textSecondary, lineHeight: 1.5 }}>
                    Вы ввели стандартный дефолтный код для должности <strong>{OFFICIAL_ROLE_LABELS[forcedPasswordChange.role]}</strong>. 
                    Оставлять систему с общеизвестным паролем категорически запрещено протоколом кибербезопасности. 
                    Перед получением доступа к государственным полномочиям необходимо установить новый персональный защищённый пароль.
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div>
                <label style={{ ...label, display: 'block', marginBottom: 6 }}>
                  Новый защищённый пароль:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showForcedPin ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Придумайте надёжный пароль (минимум 4 символа)..."
                    value={forcedNewPin}
                    onChange={(e) => setForcedNewPin(e.target.value)}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 40px 0 12px',
                      fontSize: 14,
                      background: R.bgInput,
                      border: ft.edge,
                      color: R.text,
                      borderRadius: 2,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowForcedPin(!showForcedPin)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: R.textMuted,
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    {showForcedPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ ...label, display: 'block', marginBottom: 6 }}>
                  Подтверждение нового пароля:
                </label>
                <input
                  type={showForcedPin ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Повторите новый защищённый пароль..."
                  value={forcedConfirmPin}
                  onChange={(e) => setForcedConfirmPin(e.target.value)}
                  style={{
                    width: '100%',
                    height: 40,
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

              {/* Security criteria */}
              <div style={{
                background: R.bgElevated,
                border: ft.hair,
                borderRadius: 2,
                padding: '10px 14px',
                fontSize: 11,
                color: R.textMuted,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div style={{ fontWeight: 700, color: R.textSecondary }}>Требования к защищённому паролю:</div>
                <div>• Не может совпадать со стандартными заводскими кодами (111000, 222000, 333000, 999000)</div>
                <div>• Минимум 4 символа (рекомендуется от 6 символов с буквами и цифрами)</div>
                <div>• Новый пароль должен отличаться от исходного кода</div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
                <button
                  type="button"
                  onClick={handleCancelForcedPasswordChange}
                  style={btnOutline}
                >
                  Отмена входа
                </button>
                <button
                  type="button"
                  onClick={handleCommitForcedPasswordChange}
                  style={btnAccent}
                >
                  <ShieldCheck size={14} /> Установить защищённый пароль и войти
                </button>
              </div>
            </div>
          ) : (
            <>
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


              {user.isOfficialVerified && user.officialRole !== 'civilian' && isCurrentRolePinDefault(user.officialRole) && (
                <div 
                  onClick={() => setActiveTab('changepin')}
                  style={{
                    cursor: 'pointer',
                    padding: '10px 14px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} color="#f87171" />
                    <span style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>
                      Внимание: Для вашей должности установлен стандартный заводской пароль! Нажмите, чтобы сменить его.
                    </span>
                  </div>
                  <Key size={14} color="#f87171" />
                </div>
              )}

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
                <label style={{ ...label, display: 'block', marginBottom: 6 }}>Должность или статус авторизации:</label>
                <CustomSelect
                  options={[
                    { value: 'prosecutor', label: '⚖️ Генеральный прокурор' },
                    { value: 'judge', label: '🏛️ Председатель Верховного суда' },
                    { value: 'governor', label: '📜 Губернатор Штата' },
                    { value: 'admin', label: '👑 Федеральное Правительство (Администратор)' }
                  ]}
                  value={targetRole}
                  onChange={(val) => setTargetRole(val as OfficialRole)}
                />
              </div>

              <div>
                <label style={{ ...label, display: 'block', marginBottom: 6 }}>
                  {targetRole === 'admin' ? 'Секретный Код Администратора:' : 'Персональный PIN-код служащего:'}
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder={targetRole === 'admin' ? 'Введите код доступа...' : 'Введите PIN-код...'}
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
                  {isCurrentRolePinDefault(user.officialRole) && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: 2, padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={16} color="#f87171" /> Внимание: Для вашей должности активен дефолтный пароль!
                      </div>
                      <div style={{ fontSize: 12, color: R.textSecondary, marginTop: 4 }}>
                        Использование общеизвестного заводского кода создаёт критическую угрозу безопасности. Обязательно установите новый персональный защищённый пароль ниже.
                      </div>
                    </div>
                  )}

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
          {activeTab === 'admin' && isAdmin && (
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
                        <label style={{ ...label, display: 'block', marginBottom: 4 }}>
                          PIN Прокурора:
                          {isDefaultRolePin('prosecutor', pinRegistry.prosecutor) && (
                            <span style={{ color: '#f87171', fontSize: 10, marginLeft: 6, fontWeight: 700 }}>⚠️ дефолтный</span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={pinRegistry.prosecutor}
                          onChange={(e) => setPinRegistryState({ ...pinRegistry, prosecutor: e.target.value })}
                          style={{ width: '100%', height: 34, padding: '0 10px', fontSize: 12, fontFamily: mono, background: R.bgInput, border: isDefaultRolePin('prosecutor', pinRegistry.prosecutor) ? '1px solid #f87171' : ft.edge, color: R.text, borderRadius: 2 }}
                        />
                      </div>

                      <div>
                        <label style={{ ...label, display: 'block', marginBottom: 4 }}>
                          PIN Судьи:
                          {isDefaultRolePin('judge', pinRegistry.judge) && (
                            <span style={{ color: '#f87171', fontSize: 10, marginLeft: 6, fontWeight: 700 }}>⚠️ дефолтный</span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={pinRegistry.judge}
                          onChange={(e) => setPinRegistryState({ ...pinRegistry, judge: e.target.value })}
                          style={{ width: '100%', height: 34, padding: '0 10px', fontSize: 12, fontFamily: mono, background: R.bgInput, border: isDefaultRolePin('judge', pinRegistry.judge) ? '1px solid #f87171' : ft.edge, color: R.text, borderRadius: 2 }}
                        />
                      </div>

                      <div>
                        <label style={{ ...label, display: 'block', marginBottom: 4 }}>
                          PIN Губернатора:
                          {isDefaultRolePin('governor', pinRegistry.governor) && (
                            <span style={{ color: '#f87171', fontSize: 10, marginLeft: 6, fontWeight: 700 }}>⚠️ дефолтный</span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={pinRegistry.governor}
                          onChange={(e) => setPinRegistryState({ ...pinRegistry, governor: e.target.value })}
                          style={{ width: '100%', height: 34, padding: '0 10px', fontSize: 12, fontFamily: mono, background: R.bgInput, border: isDefaultRolePin('governor', pinRegistry.governor) ? '1px solid #f87171' : ft.edge, color: R.text, borderRadius: 2 }}
                        />
                      </div>

                      <div>
                        <label style={{ ...label, display: 'block', marginBottom: 4 }}>
                          Код Админа:
                          {isDefaultRolePin('admin', pinRegistry.adminCode) && (
                            <span style={{ color: '#f87171', fontSize: 10, marginLeft: 6, fontWeight: 700 }}>⚠️ дефолтный</span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={pinRegistry.adminCode}
                          onChange={(e) => setPinRegistryState({ ...pinRegistry, adminCode: e.target.value })}
                          style={{ width: '100%', height: 34, padding: '0 10px', fontSize: 12, fontFamily: mono, background: R.bgInput, border: isDefaultRolePin('admin', pinRegistry.adminCode) ? '1px solid #f87171' : ft.edge, color: R.text, borderRadius: 2 }}
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
          {activeTab === 'audit' && isAdmin && (
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
            </>
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
            onClick={forcedPasswordChange ? handleCancelForcedPasswordChange : onClose} 
            style={btnOutline}
          >
            {forcedPasswordChange ? 'Отмена' : 'Закрыть'}
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
