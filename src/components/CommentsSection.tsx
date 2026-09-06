import React, { useState } from 'react';
import type { BillComment, UserProfile } from '../types/bill';
import { addCommentToBill } from '../services/storageService';
import { Send, Calendar, MessageSquare, Lock } from 'lucide-react';
import { R, ft, btnAccent, mono } from '../lib/ui';
import { Avatar } from './Primitives';

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
  onAddComment,
}) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const fullName = `${user.firstName} ${user.lastName}`.trim() || 'Гражданин';

      const added = await addCommentToBill(billId, {
        billId,
        authorName: fullName,
        authorRole: user.officialRole,
        content: newCommentText.trim(),
      });

      onAddComment([...comments, added]);
      setNewCommentText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* COMMENT FORM */}
      {canComment ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea
            rows={3}
            placeholder="Оставить правовой комментарий к законопроекту..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: '100%',
              background: R.bgInput,
              border: ft.edge,
              padding: '10px 14px',
              fontSize: 13,
              color: R.text,
              outline: 'none',
              resize: 'vertical',
              minHeight: 80,
              fontFamily: 'inherit',
              transition: 'border-color .15s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = R.accent)}
            onBlur={(e) => (e.currentTarget.style.borderColor = R.border)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={isSubmitting || !newCommentText.trim()}
              style={{
                ...btnAccent,
                opacity: isSubmitting || !newCommentText.trim() ? 0.5 : 1,
                cursor: isSubmitting || !newCommentText.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              <Send size={13} />
              <span>{isSubmitting ? 'Отправка...' : 'Отправить'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '14px 16px',
            background: R.bgSubtle,
            border: ft.edge,
            color: R.textMuted,
            fontSize: 12,
            fontFamily: mono,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          <Lock size={14} /> Обсуждение закрыто
        </div>
      )}

      {/* COMMENTS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {comments.length === 0 ? (
          <div
            style={{
              padding: '36px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: ft.edge,
              background: R.bgSubtle,
            }}
          >
            <MessageSquare size={24} style={{ color: R.textMuted, opacity: 0.6 }} />
            <span style={{ fontSize: 12, fontFamily: mono, color: R.textMuted, letterSpacing: '0.04em' }}>
              Комментариев пока нет
            </span>
          </div>
        ) : (
          comments.map((cm) => (
            <div
              key={cm.id}
              style={{
                background: R.bgPanel,
                border: ft.strong,
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={cm.authorName} size={26} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: R.text }}>
                      {cm.authorName}
                    </div>
                    {cm.authorRole && (
                      <div style={{ fontSize: 11, color: R.textMuted, fontFamily: mono }}>
                        {cm.authorRole}
                      </div>
                    )}
                  </div>
                </div>

                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontFamily: mono,
                    color: R.textMuted,
                    background: R.bgSubtle,
                    padding: '3px 8px',
                    border: ft.edge,
                  }}
                >
                  <Calendar size={11} /> {new Date(cm.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>

              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: R.text,
                  whiteSpace: 'pre-wrap',
                  paddingLeft: 36,
                }}
              >
                {cm.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
