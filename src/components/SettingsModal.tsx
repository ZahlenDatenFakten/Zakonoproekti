import React, { useState } from 'react';
import type { UserProfile, OfficialRole, RolePinRegistry, AuditLogEntry } from '../types/bill';
import { OFFICIAL_ROLE_LABELS } from '../types/bill';
import { CustomSelect } from './CustomSelect';
import { verifyRolePin, getPinRegistry, savePinRegistry, isSystemAdmin, getAuditLogs } from '../services/securityService';
import { X, User, Key, ShieldCheck, Check, Clock } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'profile' | 'official' | 'admin' | 'audit'>('profile');

  // Profile Form
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);

  // Official PIN Form
  const [targetRole, setTargetRole] = useState<OfficialRole>('prosecutor');
  const [rolePin, setRolePin] = useState('');

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
        onToast('success', `Активирован статус: ${OFFICIAL_ROLE_LABELS[targetRole]}`);
        setRolePin('');
        onClose();
      } else {
        onToast('error', 'Неверный персональный PIN-код для выбранной должности');
      }
    } catch (err: any) {
      onToast('error', err.message || 'Ошибка верификации');
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

  const handleSavePinRegistry = () => {
    savePinRegistry(pinRegistry);
    onToast('success', 'Реестр PIN-кодов ролей обновлен');
  };

  const handleResetRole = () => {
    onUpdateProfile(firstName.trim(), lastName.trim(), 'civilian', false);
    onToast('info', 'Статус сброшен до Инициатора/Гражданина');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 5000 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px', padding: '24px' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="var(--text-primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Личный кабинет и Настройки
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                {user.firstName} {user.lastName} &bull; {OFFICIAL_ROLE_LABELS[user.officialRole]}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('profile')}
            className="btn btn-secondary"
            style={{
              fontSize: '0.82rem',
              padding: '6px 10px',
              background: activeTab === 'profile' ? 'var(--bg-input)' : 'transparent',
              borderColor: activeTab === 'profile' ? 'var(--border-medium)' : 'transparent',
              color: activeTab === 'profile' ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            👤 Профиль
          </button>

          <button
            onClick={() => setActiveTab('official')}
            className="btn btn-secondary"
            style={{
              fontSize: '0.82rem',
              padding: '6px 10px',
              background: activeTab === 'official' ? 'var(--bg-input)' : 'transparent',
              borderColor: activeTab === 'official' ? 'var(--border-medium)' : 'transparent',
              color: activeTab === 'official' ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            🔑 Ввод PIN-кода
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className="btn btn-secondary"
            style={{
              fontSize: '0.82rem',
              padding: '6px 10px',
              background: activeTab === 'admin' ? 'var(--bg-input)' : 'transparent',
              borderColor: activeTab === 'admin' ? 'var(--border-medium)' : 'transparent',
              color: activeTab === 'admin' ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            👑 Админ-панель
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className="btn btn-secondary"
            style={{
              fontSize: '0.82rem',
              padding: '6px 10px',
              background: activeTab === 'audit' ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
              borderColor: activeTab === 'audit' ? 'rgba(52, 211, 153, 0.3)' : 'transparent',
              color: activeTab === 'audit' ? '#34d399' : 'var(--text-secondary)'
            }}
          >
            📝 Аудит Логи
          </button>
        </div>

        {/* TAB 1: Profile */}
        {activeTab === 'profile' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                Ваше Имя:
              </label>
              <input
                type="text"
                className="input-field"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Имя..."
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                Ваша Фамилия:
              </label>
              <input
                type="text"
                className="input-field"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Фамилия..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {user.isOfficialVerified && (
                <button
                  onClick={handleResetRole}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Сбросить статус должности
                </button>
              )}
              <button onClick={handleSaveProfile} className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                Сохранить личные данные
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Official Role PIN Activation */}
        {activeTab === 'official' && (
          <div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Каждая официальная должность защищена своим персональным PIN-кодом. Введите PIN для подтверждения полномочий:
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                Выберите должность:
              </label>
              <CustomSelect
                options={[
                  { value: 'prosecutor', label: '⚖️ Генеральный прокурор' },
                  { value: 'judge', label: '🏛️ Председатель Верховного суда' },
                  { value: 'governor', label: '📜 Губернатор' }
                ]}
                value={targetRole}
                onChange={(val) => setTargetRole(val as OfficialRole)}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                Персональный PIN-код служащего:
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className="input-field"
                placeholder="Введите PIN-код..."
                value={rolePin}
                onChange={(e) => setRolePin(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={handleActivateRole} className="btn btn-primary">
                <Key size={14} /> Подтвердить полномочия
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Admin Panel */}
        {activeTab === 'admin' && (
          <div>
            {!isSystemAdmin(user) ? (
              <div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                  Для доступа к функциям 2-го этапа проверки (Кабинет Администрации) введите Секретный Код Администратора:
                </p>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                    Секретный Код Администратора:
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="input-field"
                    placeholder="Код доступа..."
                    value={adminCodeInput}
                    onChange={(e) => setAdminCodeInput(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={handleActivateAdmin} className="btn btn-primary">
                    <ShieldCheck size={15} /> Войти как Администратор
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: 'var(--status-approved-bg)', border: '1px solid var(--status-approved-border)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--status-approved-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} /> Вы вошли как Системный Администратор (Кабинет 2-го этапа активен).
                </div>

                <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Управление служебными PIN-кодами ролей:
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'block' }}>PIN Прокурора:</label>
                    <input
                      type="text"
                      className="input-field"
                      value={pinRegistry.prosecutor}
                      onChange={(e) => setPinRegistryState({ ...pinRegistry, prosecutor: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'block' }}>PIN Судьи:</label>
                    <input
                      type="text"
                      className="input-field"
                      value={pinRegistry.judge}
                      onChange={(e) => setPinRegistryState({ ...pinRegistry, judge: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'block' }}>PIN Губернатора:</label>
                    <input
                      type="text"
                      className="input-field"
                      value={pinRegistry.governor}
                      onChange={(e) => setPinRegistryState({ ...pinRegistry, governor: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'block' }}>Код Администратора:</label>
                    <input
                      type="text"
                      className="input-field"
                      value={pinRegistry.adminCode}
                      onChange={(e) => setPinRegistryState({ ...pinRegistry, adminCode: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={handleSavePinRegistry} className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
                    Сохранить реестр PIN-кодов
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Audit & Security Trail */}
        {activeTab === 'audit' && (
          <div>
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="#34d399" /> Подсистема защиты 2026: Активна
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  SHA-256 Digest &bull; Anti-Bruteforce Defense &bull; Zero-Trust XSS Guard
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(52, 211, 153, 0.4)' }}>
                ВЕРТИКАЛЬ 100%
              </span>
            </div>

            <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Журнал событий безопасности (Audit Trail):
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {auditLogs.map((log) => (
                <div key={log.id} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.action}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                      <Clock size={11} /> {new Date(log.timestamp).toLocaleTimeString('ru-RU')}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>{log.details}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
