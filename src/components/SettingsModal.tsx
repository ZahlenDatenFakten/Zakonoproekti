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

  const handleSavePinRegistry = () => {
    savePinRegistry(pinRegistry);
    onToast('success', 'Реестр служебных PIN-кодов ролей обновлен');
  };

  const handleResetRole = () => {
    onUpdateProfile(firstName.trim(), lastName.trim(), 'civilian', false);
    onToast('info', 'Служебный статус сброшен до Гражданина');
  };

  const backdropMouseDownRef = React.useRef(false);

  return (
    <div 
      className="modal-overlay" 
      onMouseDown={(e) => { backdropMouseDownRef.current = (e.target === e.currentTarget); }}
      onClick={(e) => {
        if (e.target === e.currentTarget && backdropMouseDownRef.current) {
          onClose();
        }
      }} 
      style={{ zIndex: 5000 }}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px', width: '100%' }}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Личный кабинет и Безопасность
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
                {user.firstName} {user.lastName} &bull; {OFFICIAL_ROLE_LABELS[user.officialRole]}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-pill)', marginBottom: '20px', border: '1px solid var(--border-subtle)' }}>
            {[
              { id: 'profile', label: '👤 Профиль' },
              { id: 'official', label: '🔑 Авторизация' },
              { id: 'admin', label: '👑 Админ-панель' },
              { id: 'audit', label: '📝 Аудит Логи' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className="btn btn-pill"
                style={{
                  flex: 1,
                  fontSize: '0.78rem',
                  padding: '6px 8px',
                  background: activeTab === t.id ? 'var(--primary-gradient)' : 'transparent',
                  color: activeTab === t.id ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <label className="input-label">Имя гражданина / чиновника:</label>
                <input
                  type="text"
                  className="input-field"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Имя..."
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="input-label">Фамилия:</label>
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
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.76rem', cursor: 'pointer', fontFamily: 'var(--font-mono)', textDecoration: 'underline' }}
                  >
                    Сбросить служебный статус
                  </button>
                )}
                <button onClick={handleSaveProfile} className="btn btn-primary btn-pill" style={{ marginLeft: 'auto', fontSize: '0.82rem' }}>
                  Сохранить профиль
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Official Role PIN Activation */}
          {activeTab === 'official' && (
            <div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Для голосования на 1-м этапе требуется авторизация служебным PIN-кодом:
              </p>

              <div style={{ marginBottom: '14px' }}>
                <label className="input-label">Должность Законодательной Комиссии:</label>
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

              <div style={{ marginBottom: '20px' }}>
                <label className="input-label">Персональный PIN-код служащего:</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="input-field"
                  placeholder="Введите PIN-код..."
                  value={rolePin}
                  onChange={(e) => setRolePin(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleActivateRole} className="btn btn-primary btn-pill" style={{ fontSize: '0.84rem' }}>
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
                    Для доступа к вердиктам 2-го этапа введите Секретный Код Администратора:
                  </p>

                  <div style={{ marginBottom: '20px' }}>
                    <label className="input-label">Секретный Код Администратора:</label>
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
                    <button onClick={handleActivateAdmin} className="btn btn-primary btn-pill" style={{ fontSize: '0.84rem' }}>
                      <ShieldCheck size={15} /> Авторизовать Администратора
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.82rem', color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)' }}>
                    <Check size={16} /> Системный Администратор авторизован (2-й этап активен).
                  </div>

                  <h4 className="tech-label" style={{ marginBottom: '10px' }}>
                    Реестр PIN-кодов должностей
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <div>
                      <label className="input-label">PIN Прокурора:</label>
                      <input
                        type="text"
                        className="input-field"
                        value={pinRegistry.prosecutor}
                        onChange={(e) => setPinRegistryState({ ...pinRegistry, prosecutor: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="input-label">PIN Судьи:</label>
                      <input
                        type="text"
                        className="input-field"
                        value={pinRegistry.judge}
                        onChange={(e) => setPinRegistryState({ ...pinRegistry, judge: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="input-label">PIN Губернатора:</label>
                      <input
                        type="text"
                        className="input-field"
                        value={pinRegistry.governor}
                        onChange={(e) => setPinRegistryState({ ...pinRegistry, governor: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="input-label">Код Админа:</label>
                      <input
                        type="text"
                        className="input-field"
                        value={pinRegistry.adminCode}
                        onChange={(e) => setPinRegistryState({ ...pinRegistry, adminCode: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSavePinRegistry} className="btn btn-primary btn-pill" style={{ fontSize: '0.82rem' }}>
                      Сохранить PIN-коды
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Audit Logs */}
          {activeTab === 'audit' && (
            <div>
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={15} color="var(--success)" /> Защита Audit-Trail SA GOV TECH
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    Zero-Trust Access Control &bull; SHA-256 System Integrity
                  </div>
                </div>
              </div>

              <h4 className="tech-label" style={{ marginBottom: '10px' }}>
                Журнал событий реестра
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {auditLogs.map((log) => (
                  <div key={log.id} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.action}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                        <Clock size={11} /> {new Date(log.timestamp).toLocaleTimeString('ru-RU')}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{log.details}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-pill" onClick={onClose}>
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
