import React, { useState } from 'react';
import type { BillComment, UserProfile } from '../types/bill';
import { addCommentToBill } from '../services/storageService';
import { MessageSquare, Send, User, Calendar } from 'lucide-react';

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
    <div style={{ padding: '10px 0' }}>
      
      {/* Form */}
      {canComment ? (
        <form onSubmit={handleSubmit} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px', marginBottom: '24px' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={16} /> Оставить комментарий
          </h4>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Автор: <strong style={{ color: 'var(--text-primary)' }}>{user.firstName} {user.lastName}</strong>
          </div>

          <textarea
            className="input-field"
            rows={3}
            placeholder="Текст комментария к законопроекту..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            style={{ width: '100%', marginBottom: '12px', minHeight: '80px', resize: 'vertical' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
              <Send size={14} /> Отправить комментарий
            </button>
          </div>
        </form>
      ) : (
        <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
          🔒 Отправка комментариев временно ограничена.
        </div>
      )}

      {/* Existing Comments */}
      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>
        Комментарии ({comments.length})
      </h4>

      {comments.length === 0 ? (
        <p style={{ fontSize: '0.86rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0' }}>
          Комментариев пока нет. Вы можете оставить первый комментарий!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {comments.map((cm) => (
            <div key={cm.id} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-hover)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={14} color="var(--text-secondary)" />
                  </div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{cm.authorName}</strong>
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={11} /> {new Date(cm.createdAt).toLocaleString('ru-RU')}
                </span>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5, paddingLeft: '36px' }}>
                {cm.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
