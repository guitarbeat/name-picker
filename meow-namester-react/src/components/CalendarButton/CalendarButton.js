import React from 'react';
import styles from './CalendarButton.module.css';

function CalendarButton({ rankings, userName, hiddenNames }) {
  const handleClick = () => {
    // Filter out hidden names and sort by rating
    const activeNames = rankings
      .filter(name => !hiddenNames.has(name.id))
      .sort((a, b) => (b.rating || 1500) - (a.rating || 1500));

    // Get winner name or default text
    const winnerName = activeNames[0]?.name || 'No winner yet';
    
    // Format dates for all-day event (YYYYMMDD)
    const today = new Date();
    const startDate = today.toISOString().split('T')[0].replace(/-/g, '');
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1);
    const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '');

    // Updated title with just emoji + winner name
    const text = `🐈‍⬛ ${winnerName}`;
    const details = `Daily rankings for ${userName}:\n\n${
      activeNames
        .map((name, index) => `${index + 1}. ${name.name} (Rating: ${Math.round(name.rating || 1500)})`)
        .join('\n')
    }`;

    // Build Google Calendar URL
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: text,
      details: details,
      dates: `${startDate}/${endDateStr}`,
      ctz: Intl.DateTimeFormat().resolvedOptions().timeZone // Add user's timezone
    });

    window.open(`${baseUrl}?${params.toString()}`, '_blank');
  };

  return (
    <button
      className={styles.button}
      onClick={handleClick}
      title="Add to Google Calendar"
      aria-label="Add to Google Calendar"
    >
      <span className={styles.icon}>📅</span>
      Add to Calendar
    </button>
  );
}

export default CalendarButton; 