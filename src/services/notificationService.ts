import type { Bill, VoteDecision } from '../types/bill';

export interface NotifyVerdictParams {
  bill: Bill;
  decision: VoteDecision;
  reason: string;
  adminName: string;
  authorDiscordId?: string;
}

export interface NotifyVerdictResult {
  success: boolean;
  messageId?: string;
  recipientId?: string;
  error?: string;
  warning?: string;
}

/**
 * Sends a Discord DM Embed notification to the author via Report Assistant bot
 * whenever an administrator rejects or requests revision on their bill.
 */
export async function notifyAuthorOnVerdict(params: NotifyVerdictParams): Promise<NotifyVerdictResult> {
  const { bill, decision, reason, adminName, authorDiscordId } = params;

  // We notify on needs_revision and rejected
  if (decision !== 'needs_revision' && decision !== 'rejected') {
    return { success: false, warning: 'Discord notification skipped for non-revision/non-rejection decision' };
  }

  const payload = {
    billId: bill.id,
    title: bill.title || 'Без названия',
    targetLaw: bill.targetLaw || (bill.targetLaws && bill.targetLaws.length > 0 ? bill.targetLaws.join(', ') : 'Законодательство Штата'),
    author: bill.author || 'Гражданин',
    authorDiscordId: authorDiscordId || bill.authorDiscordId,
    decision,
    reason: reason || bill.statusReason || 'Замечания не указаны.',
    adminName: adminName || 'Федеральное Правительство',
    portalUrl: window.location.origin
  };

  try {
    const res = await fetch('/api/notify-verdict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[notificationService] Failed /api/notify-verdict:', res.status, errText);
      return { success: false, error: `HTTP ${res.status}: ${errText}` };
    }

    const data: NotifyVerdictResult = await res.json();
    console.log('[notificationService] Discord notification result:', data);
    return data;
  } catch (err: any) {
    console.error('[notificationService] Error calling /api/notify-verdict:', err);
    return { success: false, error: err.message || 'Network error' };
  }
}
