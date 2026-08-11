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
    <div style={{ padding: '16px' }}>
      
      {/* COMMENT FORM */}
      {canComment ? (
        <form onSubmit={handleSubmit} className="card" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '18px', marginBottom: '24px' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '0.92rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={16} color="var(--primary-hover)" /> Новое сообщение
          </h4>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Автор: <strong style={{ color: 'var(--text-primary)' }}>{user.firstName} {user.lastName}</strong>
          </div>

          <textarea
            className="input-field"
            rows={3}
            placeholder="Напишите комментарий к законопроекту..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            style={{ width: '100%', marginBottom: '14px', minHeight: '80px', resize: 'vertical' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '8px 16px' }}>
              <Send size={14} /> Отправить
            </button>
          </div>
        </form>
      ) : (
        <div style={{ background: 'var(--bg-input)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px solid var(--border-subtle)' }}>
          🔒 Комментирование доступно только во время обсуждения.
        </div>
      )}

      {/* COMMENTS LIST */}
      <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Комментарии</span>
        <span className="badge badge-status-review">{comments.length}</span>
      </h4>

      {comments.length === 0 ? (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
          Комментариев пока нет. Будьте первым!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {comments.map((cm) => (
            <div key={cm.id} className="card" style={{ background: 'var(--bg-input)', padding: '16px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--bg-hover)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={14} color="#60a5fa" />
                  </div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 600 }}>{cm.authorName}</strong>
                </div>

                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> {new Date(cm.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>

              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: '40px' }}>
                {cm.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
