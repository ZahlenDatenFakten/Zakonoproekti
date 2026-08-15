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
    <div style={{ padding: '0' }}>
      
      {/* COMMENT FORM */}
      {canComment ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: '14px' }}>
          <textarea
            className="input-field"
            rows={2}
            placeholder="Оставить правовой комментарий..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            style={{ width: '100%', marginBottom: '8px', minHeight: '64px', resize: 'vertical', fontSize: '0.8rem' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-pill" style={{ fontSize: '0.74rem', padding: '5px 14px' }}>
              <Send size={12} /> Отправить
            </button>
          </div>
        </form>
      ) : (
        <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.74rem', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)' }}>
          🔒 Обсуждение закрыто
        </div>
      )}

      {/* COMMENTS LIST */}
      {comments.length === 0 ? (
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0', fontFamily: 'var(--font-mono)' }}>
          Комментариев пока нет.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {comments.map((cm) => (
            <div key={cm.id} style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={11} color="var(--text-accent)" />
                  </div>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 600 }}>{cm.authorName}</span>
                </div>

                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                  <Calendar size={10} /> {new Date(cm.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, paddingLeft: '28px' }}>
                {cm.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
