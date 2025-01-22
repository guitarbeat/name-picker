import React from 'react';
import './CalendarButton.css';

function CalendarButton({ rankings, userName, hiddenNames }) {
  const handleClick = () => {
    // Filter out hidden names and get active rankings
    const activeRankings = rankings.filter(r => !hiddenNames.has(r.id));
    const topName = activeRankings[0]?.name || 'No names rated';
    const topNames = activeRankings.slice(0, 10).map((r, i) => `${i + 1}. ${r.name}`).join('\n');

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    // Format dates for all-day event
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0].replace(/-/g, '');

    const event = {
      text: `🐈‍⬛ ${topName}`,
      details: `${formattedDate} Cat Name Rankings:\n\n${topNames}`,
      dates: `${dateStr}/${tomorrowStr}`
    };

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.text)}&details=${encodeURIComponent(event.details)}&dates=${event.dates}`;
    
    window.open(calendarUrl, '_blank');
  };

  return (
    <button
      className="calendar-button"
      onClick={handleClick}
      aria-label="Add to Google Calendar"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="calendar-icon"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      Add to Calendar
    </button>
  );
}

export default CalendarButton; 