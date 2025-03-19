import { calendar_v3, google } from 'googleapis';
import type { Route } from './+types/api.calendar';
import calendarConfig from '../config/calendars.json';
import ICAL from 'ical.js';

function extractCalendarIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'calendar.google.com') {
      const srcParam = urlObj.searchParams.get('src');
      if (srcParam) {
        const decodedId = decodeURIComponent(srcParam);
        console.log('Extracted calendar ID from URL:', decodedId);
        return decodedId;
      }
    }
  } catch (error) {
    console.error('Error parsing calendar URL:', error);
  }
  return null;
}

async function fetchICalEvents(url: string, timeMin: Date, timeMax: Date, timeZone: string) {
  try {
    const response = await fetch(url);
    const icalData = await response.text();
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    return vevents.map(vevent => {
      const event = new ICAL.Event(vevent);
      const start = event.startDate.toJSDate();
      const end = event.endDate.toJSDate();

      // Filter events outside the time range
      if (start > timeMax || end < timeMin) {
        return null;
      }

      return {
        id: event.uid,
        summary: event.summary,
        start: {
          dateTime: start.toISOString(),
          timeZone: timeZone
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: timeZone
        },
        description: event.description,
        location: event.location
      };
    }).filter(event => event !== null);
  } catch (error) {
    console.error('Error fetching iCal events:', error);
    return [];
  }
}

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

    console.log('Fetching events from:', startOfWeek.toISOString(), 'to', endOfWeek.toISOString());

    // Fetch events from all enabled calendars
    const enabledCalendars = calendarConfig.calendars.filter(cal => cal.enabled);
    console.log('Enabled calendars:', enabledCalendars.map(cal => ({ name: cal.name, id: cal.id, url: cal.url })));

    const calendarPromises = enabledCalendars.map(async (cal) => {
      try {
        if (cal.type === 'ical' && cal.url) {
          console.log(`Fetching iCal events for calendar: ${cal.name}`);
          const events = await fetchICalEvents(
            cal.url,
            startOfWeek,
            endOfWeek,
            cal.timeZone || calendarConfig.timeZone
          );
          
          return events.map(event => ({
            ...event,
            calendarId: cal.id,
            calendarName: cal.name,
            calendarColor: cal.color,
            calendarTimeZone: cal.timeZone || calendarConfig.timeZone
          }));
        } else {
          // Handle Google Calendar
          const calendarId = cal.url ? extractCalendarIdFromUrl(cal.url) : cal.id;
          if (!calendarId) {
            console.error(`Invalid calendar configuration for ${cal.name}`);
            return [];
          }

          console.log(`Fetching Google Calendar events for: ${cal.name} (ID: ${calendarId})`);
          const response = await calendar.events.list({
            calendarId,
            timeMin: startOfWeek.toISOString(),
            timeMax: endOfWeek.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            timeZone: cal.timeZone || calendarConfig.timeZone,
            maxResults: 250
          });

          const events = response.data.items || [];
          console.log(`Found ${events.length} events for calendar ${cal.name}`);
          
          return events.map(event => ({
            ...event,
            calendarId: cal.id,
            calendarName: cal.name,
            calendarColor: cal.color,
            calendarTimeZone: cal.timeZone || calendarConfig.timeZone
          }));
        }
      } catch (error) {
        console.error(`Error fetching events from calendar ${cal.name}:`, error);
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            calendar: cal.name,
            id: cal.id,
            url: cal.url
          });
        }
        return [];
      }
    });

    const allEvents = (await Promise.all(calendarPromises)).flat();
    console.log('Total events found:', allEvents.length);

    // Add empty events for missing days
    const allDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dayEvents = allEvents.filter(event => {
        const eventStart = event.start as { dateTime?: string; date?: string };
        const eventDate = new Date(eventStart?.dateTime || eventStart?.date || '');
        return eventDate.toDateString() === date.toDateString();
      });
      allDays.push(...dayEvents);
    }

    return { 
      events: allDays
    };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return { error: 'Failed to fetch calendar events' };
  }
} 