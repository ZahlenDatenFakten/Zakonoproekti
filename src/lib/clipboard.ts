/**
 * Reliable cross-browser clipboard copy with fallback to execCommand.
 * Works even in restricted iframe contexts, headless environments, and insecure HTTP.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try modern Async Clipboard API
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback if permission denied or iframe blocked
  }

  // 2. Fallback to hidden textarea with execCommand
  try {
    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    }
  } catch {
    return false;
  }

  return false;
}
