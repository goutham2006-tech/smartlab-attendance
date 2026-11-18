const SmartLabUtils = (() => {
  function parseTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    let raw = String(timeStr).trim().toUpperCase();
    const isPm = raw.includes('PM');
    const isAm = raw.includes('AM');
    raw = raw.replace('AM', '').replace('PM', '').trim();
    const parts = raw.split(':').map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
    let hours = parts[0];
    const minutes = parts[1];
    if (isPm && hours < 12) hours += 12;
    else if (isAm && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  function timeDifferenceInHours(start, end) {
    const diffMinutes = parseTimeToMinutes(end) - parseTimeToMinutes(start);
    return diffMinutes > 0 ? diffMinutes / 60 : 0;
  }

  function formatDuration(start, end) {
    const diffMinutes = parseTimeToMinutes(end) - parseTimeToMinutes(start);
    if (diffMinutes <= 0) return '0h 0m';

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  function toTitleCase(value) {
    return String(value || '').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function showToast(message, type = 'info') {
    let toast = document.getElementById('smartlab-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'smartlab-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(window.smartLabToastTimer);
    window.smartLabToastTimer = setTimeout(() => {
      toast.className = 'toast';
    }, 2600);
  }

  function uniqueValues(list, key) {
    return [...new Set(list.map((item) => item[key]).filter(Boolean))];
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  return {
    parseTimeToMinutes,
    timeDifferenceInHours,
    formatDuration,
    formatDate,
    toTitleCase,
    showToast,
    uniqueValues,
    escapeHtml
  };
})();
