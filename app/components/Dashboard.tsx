import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import calendarConfig from '../config/calendars.json';

type CalendarEvent = {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  calendarId: string;
  calendarName: string;
  calendarColor: string;
};

type EventsByDay = {
  [key: string]: CalendarEvent[];
};

export function Dashboard() {
  const currentDate = new Date().toLocaleDateString();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const mockData = {
    spending: {
      total: 0,
      budgetBusters: [],
      remaining: 0
    },
    savings: [
      { name: 'Placeholder Fund', amount: 0, change: 0 }
    ],
    upcomingExpenses: [
      { name: 'Placeholder Expense', amount: 0, date: '2025-01-01' }
    ],
    utilities: {
      electric: 0,
      water: 0,
      internet: 0
    },
    notes: 'No notes available.',
    questions: []
  };

  const formatEventDate = (event: CalendarEvent) => {
    const dateStr = event.start.dateTime || event.start.date;
    if (!dateStr) return 'No date';
    
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true,
      timeZone: calendarConfig.timeZone
    });
  };

  const formatDayHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: calendarConfig.timeZone
    });
  };

  const groupEventsByDay = (events: CalendarEvent[]): EventsByDay => {
    // Create an object with all days of the week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(now.getDate() - diff);

    const weekDays: EventsByDay = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dayKey = date.toLocaleDateString('en-US', { 
        timeZone: calendarConfig.timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      weekDays[dayKey] = [];
    }

    // Add events to their respective days
    events.forEach(event => {
      const dateStr = event.start.dateTime || event.start.date;
      if (!dateStr) return;
      
      const date = new Date(dateStr);
      const dayKey = date.toLocaleDateString('en-US', { 
        timeZone: calendarConfig.timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      if (weekDays[dayKey]) {
        weekDays[dayKey].push(event);
      }
    });

    return weekDays;
  };

  useEffect(() => {
    async function fetchCalendarEvents() {
      try {
        const response = await fetch('/api/calendar');
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          return;
        }

        setEvents(data.events || []);
      } catch (err) {
        setError('Failed to fetch calendar events');
        console.error('Error fetching calendar events:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCalendarEvents();
  }, []);

  const eventsByDay = groupEventsByDay(events);
  const sortedDays = Object.keys(eventsByDay).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>WEEKLY FINANCIAL CHECK-IN: {currentDate}</h1>
      </header>

      <section className="dashboard-section">
        <h2>THIS WEEK'S EVENTS</h2>
        <div className="upcoming-events">
          {isLoading ? (
            <p>Loading events...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : events.length === 0 ? (
            <p>No events this week</p>
          ) : (
            <div className="events-by-day" style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', overflowX: 'auto' }}>
              {sortedDays.map(day => (
                <div key={day} className="day-events">
                  <h3 className="day-header">{formatDayHeader(day)}</h3>
                  <ul>
                    {eventsByDay[day].map(event => (
                      <li 
                        key={event.id} 
                        className="event-item"
                        style={{ borderLeft: `4px solid ${event.calendarColor}` }}
                      >
                        <span className="event-summary">{event.summary}</span>
                        <span className="event-time">{formatEventDate(event)}</span>
                        <span className="event-calendar" style={{ color: event.calendarColor, fontSize: '0.8rem' }}>
                          {event.calendarName}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>SPENDING SUMMARY</h2>
        <div className="spending-summary">
          <p>Total spent: ${mockData.spending.total}</p>
          <div className="budget-busters">
            <h3>Budget Busters:</h3>
            <ul>
              {mockData.spending.budgetBusters.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
          <p>Remaining budget: ${mockData.spending.remaining}</p>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>SAVINGS UPDATE</h2>
        <div className="savings-update">
          {mockData.savings.map((bucket, index) => (
            <div key={index} className="savings-bucket">
              <span className="bucket-name">{bucket.name}:</span>
              <span className="bucket-amount">${bucket.amount}</span>
              <span className="bucket-change">(+${bucket.change})</span>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>UPCOMING EXPENSES</h2>
        <div className="upcoming-expenses">
          {mockData.upcomingExpenses.map((expense, index) => (
            <div key={index} className="expense-item">
              <span className="expense-name">{expense.name}:</span>
              <span className="expense-amount">${expense.amount}</span>
              <span className="expense-date">- {expense.date}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>UTILITIES TRACKER</h2>
        <div className="utilities-tracker">
          <p>Electric: ${mockData.utilities.electric}</p>
          <p>Water: ${mockData.utilities.water}</p>
          <p>Internet: ${mockData.utilities.internet}</p>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>NOTES/THOUGHTS</h2>
        <div className="notes">
          <p>{mockData.notes}</p>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>QUESTIONS FOR DISCUSSION</h2>
        <div className="questions">
          <ul>
            {mockData.questions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
} 