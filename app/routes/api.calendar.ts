import { calendar_v3, google } from 'googleapis';
import type { Route } from './+types/api.calendar';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    // Create calendar client with API key
    const calendar = google.calendar({ 
      version: 'v3',
      auth: process.env.GOOGLE_API_KEY
    });
    
    // Calculate time range for current week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get to Monday of current week
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // If Sunday, go back 6 days to get to Monday
    startOfWeek.setDate(now.getDate() - diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    console.log('Start of week:', startOfWeek.toISOString());
    console.log('End of week:', endOfWeek.toISOString());

    // Ensure we're not getting events from previous weeks
    const response = await calendar.events.list({
      calendarId: 'alexanderlperez@gmail.com',
      timeMin: startOfWeek.toISOString(),
      timeMax: endOfWeek.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: 'America/New_York',
      maxResults: 250 // Ensure we get all events
    });

    // Add empty events for missing days
    const events = response.data.items || [];
    const allDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start?.dateTime || event.start?.date || '');
        return eventDate.toDateString() === date.toDateString();
      });
      allDays.push(...dayEvents);
    }

    console.log('Events:', allDays.map(event => {
      const startDate = event.start?.dateTime || event.start?.date;
      return {
        summary: event.summary,
        start: startDate || 'no date',
        day: startDate ? new Date(startDate).getDay() : -1
      };
    }));

    return { 
      events: allDays
    };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return { error: 'Failed to fetch calendar events' };
  }
} 