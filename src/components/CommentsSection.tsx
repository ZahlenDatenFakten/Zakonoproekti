import React, { useState } from 'react';
import type { BillComment, UserProfile } from '../types/bill';
import { addCommentToBill } from '../services/storageService';
import { Send, User, Calendar } from 'lucide-react';

interface CommentsSectionProps {
  billId: string;
  user: UserProfile;
  comments: BillComment[];
  canComment: boolean;
  onAddComment: (updatedComments: BillComment[]) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  billId,
  user,
  comments,
  canComment,
  onAddComment
}) => {
  const [newCommentText, setNewCommentText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const fullName = `${user.firstName} ${user.lastName}`.trim() || 'Гражданин';

    const added = await addCommentToBill(billId, {
      billId,
      authorName: fullName,
      authorRole: user.officialRole,
      content: newCommentText.trim()
    });

    onAddComment([...comments, added]);
    setNewCommentText('');
  };

  return (
    <div style={{ padding: '4px' }}>
      
      {/* COMMENT FORM */}
      {canComment ? (
        <form onSubmit={handleSubmit} className="card" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px', fontFamily: 'var(--font-mono)' }}>
            Автор сообщения: <strong style={{ color: 'var(--text-primary)' }}>{user.firstName} {user.lastName}</strong>
          </div>

          <textarea
            className="input-field"
            rows={3}
            placeholder="Введите ваше экспертное мнение или предложение к законопроекту..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            style={{ width: '100%', marginBottom: '12px', minHeight: '75px', resize: 'vertical', fontSize: '0.85rem' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-pill" style={{ fontSize: '0.78rem', padding: '7px 16px' }}>
              <Send size={13} /> Опубликовать
            </button>
          </div>
        </form>
      ) : (
        <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '18px', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)' }}>
          🔒 Офлайн: Комментирование закрыто после вынесения решения.
        </div>
      )}

      {/* COMMENTS LIST */}
      {comments.length === 0 ? (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontFamily: 'var(--font-mono)' }}>
          Обсуждения отсутствуют. Напишите первый комментарий.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {comments.map((cm) => (
            <div key={cm.id} className="card" style={{ background: 'var(--bg-input)', padding: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={13} color="var(--text-accent)" />
                  </div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.84rem', fontWeight: 600 }}>{cm.authorName}</strong>
                </div>

                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                  <Calendar size={11} /> {new Date(cm.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>

              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: '34px' }}>
                {cm.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
