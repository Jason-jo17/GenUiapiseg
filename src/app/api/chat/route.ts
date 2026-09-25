import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { ALL_TOOLS } from '@/lib/ai-tools';
import { db } from '@/db';
import { chatThreads, chatMessages, appSettings } from '@/db/schema';
import { auth } from '@/auth';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are the GenUI API Explorer assistant — an expert guide for the public-apis catalog containing 1,500+ free public APIs.

Your job is to help users discover, understand, and interact with public APIs by rendering rich interactive UI components (not just text).

## CRITICAL RULES
1. ALWAYS use a tool to respond — never reply with plain text only when a component is more useful
2. When searching or browsing APIs → use search_apis
3. When explaining how to set up or use an API → use get_api_details  
4. When user wants to make an API call → use try_api first (shows a form), then fetch_data when they confirm
5. When user asks about their keys → use show_keys
6. When user just wants to browse → use list_categories
7. For explanations, guides, or tips → use explain
8. Be concise in any text messages you send alongside tool calls
9. If a user corrects you or says something was wrong, acknowledge it and retry with the corrected approach

## AVAILABLE API CATEGORIES
Animals, Anime, Anti-Malware, Art & Design, Authentication & Authorization, Blockchain, Books, Business, Calendar, Cryptocurrency, Currency Exchange, Data Validation, Development, Dictionaries, Documents & Productivity, Email, Entertainment, Environment, Events, Finance, Food & Drink, Games & Comics, Geocoding, Government, Health, Jobs, Machine Learning, Music, News, Open Data, Photography, Programming, Science & Math, Security, Shopping, Social, Sports & Fitness, Test Data, Text Analysis, Tracking, Transportation, URL Shorteners, Vehicle, Video, Weather

## RESPONSE STYLE  
- Always call a tool — the UI is your primary output
- Keep text responses short (1-2 sentences max)
- Be direct and helpful
- Suggest follow-up actions the user can take`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  const userId = session.user.id;

  const { messages, threadId } = await req.json();

  // Ensure thread exists
  if (threadId) {
    await db.insert(chatThreads)
      .values({ id: threadId, userId, title: 'New Chat' })
      .onConflictDoNothing();
  }

  // Save the user's latest message to DB
  const latestMessage = messages[messages.length - 1];
  if (latestMessage && latestMessage.role === 'user' && threadId) {
    await db.insert(chatMessages).values({
      threadId,
      userId,
      role: 'user',
      content: latestMessage.content || '',
      toolCalls: null
    });
  }

  // Per-user LLM provider setting (Settings page) overrides the env default
  const [providerSetting] = await db
    .select()
    .from(appSettings)
    .where(and(eq(appSettings.userId, userId), eq(appSettings.key, 'llm_provider')));

  let provider = process.env.GENUI_LLM_PROVIDER ?? 'google';
  if (providerSetting) {
    try {
      provider = JSON.parse(providerSetting.value);
    } catch {
      // ignore malformed stored value, keep env default
    }
  }
  
  let model;
  if (provider === 'anthropic') {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    });
    model = anthropic('claude-3-5-sonnet-latest');
  } else if (provider === 'openai') {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? '',
    });
    model = openai('gpt-4o');
  } else {
    // Default to Google
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '',
    });
    model = google('gemini-2.5-flash');
  }

  const result = streamText({
    model: model as any,
    system: SYSTEM_PROMPT,
    messages,
    tools: ALL_TOOLS,
    maxSteps: 3, // Allow multi-step tool chains
    onError: ({ error }) => {
      console.error('[GenUI Chat streamText Error]:', error);
    },
    onFinish: async ({ usage, finishReason, text, toolCalls, toolResults }) => {
      // Save assistant message to DB
      if (threadId) {
        // Construct tool invocations
        const invocations = toolCalls?.map((call) => {
          const result = toolResults?.find(r => r.toolCallId === call.toolCallId);
          return {
            toolCallId: call.toolCallId,
            toolName: call.toolName,
            args: call.args,
            state: result ? 'result' : 'call',
            result: result ? result.result : undefined
          };
        });

        const toolCallsStr = invocations && invocations.length > 0 ? JSON.stringify(invocations) : null;

        await db.insert(chatMessages).values({
          threadId,
          userId,
          role: 'assistant',
          content: text || '',
          toolCalls: toolCallsStr
        });
        
        await db.update(chatThreads)
          .set({ updatedAt: Math.floor(Date.now() / 1000) })
          .where(eq(chatThreads.id, threadId));
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[GenUI Chat]', { threadId, usage, finishReason });
      }
    },
  });

  return result.toDataStreamResponse();
}
