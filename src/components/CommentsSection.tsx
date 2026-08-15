import React, { useState } from 'react';
import type { BillComment, UserProfile } from '../types/bill';
import { addCommentToBill } from '../services/storageService';
import { Send, User, Calendar, MessageSquare, Lock } from 'lucide-react';

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
        content: newCommentText.trim()
      });

      onAddComment([...comments, added]);
      setNewCommentText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      
      {/* COMMENT FORM */}
      {canComment ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            rows={2}
            placeholder="Оставить правовой комментарий..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600 resize-y min-h-[80px]"
            disabled={isSubmitting}
          />

          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting || !newCommentText.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-xs font-extrabold rounded-lg shadow-lg shadow-indigo-500/20 border border-indigo-400/30 active:scale-95 transition-all"
            >
              <Send size={14} /> {isSubmitting ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-center gap-2 py-4 bg-white/[0.02] border border-white/10 rounded-xl text-zinc-500 text-xs font-mono font-bold uppercase tracking-wider">
          <Lock size={14} className="text-zinc-600" /> Обсуждение закрыто
        </div>
      )}

      {/* COMMENTS LIST */}
      <div className="flex flex-col gap-3">
        {comments.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 opacity-50">
            <MessageSquare size={24} className="text-zinc-600" />
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Комментариев пока нет</span>
          </div>
        ) : (
          comments.map((cm) => (
            <div key={cm.id} className="bg-black/40 border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <User size={12} className="text-indigo-400" />
                  </div>
                  <span className="text-xs font-bold text-white">{cm.authorName}</span>
                </div>

                <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 bg-white/[0.02] px-2 py-1 rounded-md border border-white/5">
                  <Calendar size={10} /> {new Date(cm.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>

              <div className="text-sm text-zinc-400 leading-relaxed pl-9">
                {cm.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
