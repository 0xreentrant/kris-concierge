import type { Route } from './+types/api.chat';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function loader({ request }: Route.LoaderArgs) {
  return { status: 'ok' };
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return { error: 'Method not allowed' };
  }

  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return { error: 'No message provided' };
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a helpful financial assistant with access to the following data categories:

1. Calendar Events:
- Shows events for the current week (Monday to Sunday)
- Each event has a summary, start time, end time, and calendar source
- Events are color-coded by calendar
- Time zone is set to America/New_York

2. Spending Summary:
- Total amount spent
- List of budget busters (items that exceeded budget)
- Remaining budget amount

3. Savings:
- Multiple savings buckets/funds
- Each bucket has:
  * Name
  * Current amount
  * Change amount (positive/negative)

4. Upcoming Expenses:
- List of future expenses
- Each expense has:
  * Name
  * Amount
  * Due date

5. Utilities:
- Electric bill amount
- Water bill amount
- Internet bill amount

6. Notes/Thoughts:
- General financial notes and thoughts
- Can include important reminders or considerations

7. Questions for Discussion:
- List of financial questions that need attention
- Can include topics for review or decision-making

You help users understand their finances, provide insights about their spending patterns, and offer advice on budgeting and saving. Keep your responses concise, practical, and focused on actionable advice. When relevant, reference specific data from these categories to provide personalized insights.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
    return { response };
  } catch (error) {
    console.error('Error in chat API:', error);
    return { error: error instanceof Error ? error.message : 'Failed to process chat message' };
  }
}

export function meta() {
  return [
    { title: "Chat API" },
    { name: "description", content: "API endpoint for chat functionality" },
  ];
} 