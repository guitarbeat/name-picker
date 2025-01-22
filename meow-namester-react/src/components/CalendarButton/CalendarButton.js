import React from 'react';
import './CalendarButton.css';

function CalendarButton({ rankings, userName, hiddenNames }) {
  const handleClick = () => {
    // Filter out hidden names and sort by rating
    const activeNames = rankings
      .filter(name => !hiddenNames.has(name.id))
      .sort((a, b) => (b.rating || 1500) - (a.rating || 1500));

    const sortedNames = activeNames
      .map((name, index) => `${index + 1}. ${name.name}`)
      .join('\n');

    const topName = activeNames[0]?.name || 'No names rated';

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });

    const text = `🐈‍⬛ ${topName}`;
    const details = `${formattedDate} Cat Name Rankings:\n\n${sortedNames}`;
    // Format dates for all-day event
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0].replace(/-/g, '');
    const dates = `${dateStr}/${tomorrowStr}`;
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&details=${encodeURIComponent(details)}&dates=${dates}`;
    
    window.open(calendarUrl, '_blank');
  };

  return (
    <button
      className="action-button secondary-button"
      onClick={handleClick}
      title="Add to Google Calendar"
      aria-label="Add to Google Calendar"
    >
      📅 Add to Calendar
    </button>
  );
}

export default CalendarButton; 