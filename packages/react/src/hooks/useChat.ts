/**
 * useChat hook for chat completions
 */

import { useCallback, useState } from 'react';
import type { ChatOptions, Usage } from '@archipelag/sdk';
import { useArchipelag } from '../context';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface UseChatOptions extends ChatOptions {
  /**
   * Initial messages
   */
  initialMessages?: ChatMessage[];
  /**
   * Called when streaming starts
   */
  onStart?: () => void;
  /**
   * Called for each token during streaming
   */
  onToken?: (token: string) => void;
  /**
   * Called when streaming completes
   */
  onFinish?: (content: string, usage: Usage) => void;
  /**
   * Called on error
   */
  onError?: (error: Error) => void;
}

export interface UseChatReturn {
  /**
   * All messages in the conversation
   */
  messages: ChatMessage[];
  /**
   * Send a message
   */
  send: (content: string) => Promise<void>;
  /**
   * Whether a response is being generated
   */
  isLoading: boolean;
  /**
   * Whether streaming is in progress
   */
  isStreaming: boolean;
  /**
   * Current streaming content
   */
  streamingContent: string;
  /**
   * Last error
   */
  error: Error | null;
  /**
   * Clear all messages
   */
  clear: () => void;
  /**
   * Set messages manually
   */
  setMessages: (messages: ChatMessage[]) => void;
}

/**
 * Hook for chat completions with streaming support
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { messages, send, isLoading, streamingContent } = useChat();
 *
 *   return (
 *     <div>
 *       {messages.map((msg, i) => (
 *         <div key={i}>
 *           <strong>{msg.role}:</strong> {msg.content}
 *         </div>
 *       ))}
 *       {isLoading && <div>Assistant: {streamingContent}</div>}
 *       <input
 *         onKeyDown={(e) => {
 *           if (e.key === 'Enter') {
 *             send(e.currentTarget.value);
 *             e.currentTarget.value = '';
 *           }
 *         }}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { client } = useArchipelag();
  const [messages, setMessages] = useState<ChatMessage[]>(
    options.initialMessages || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<Error | null>(null);

  const send = useCallback(
    async (content: string) => {
      if (isLoading) return;

      setError(null);
      setIsLoading(true);
      setIsStreaming(true);
      setStreamingContent('');
      options.onStart?.();

      // Add user message
      const userMessage: ChatMessage = { role: 'user', content };
      setMessages((prev) => [...prev, userMessage]);

      let fullContent = '';

      try {
        await client.chatStream(content, {
          onToken: (token) => {
            fullContent += token;
            setStreamingContent(fullContent);
            options.onToken?.(token);
          },
          onDone: (usage) => {
            // Add assistant message
            const assistantMessage: ChatMessage = {
              role: 'assistant',
              content: fullContent,
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setStreamingContent('');
            setIsStreaming(false);
            options.onFinish?.(fullContent, usage);
          },
          onError: (errorMsg) => {
            const err = new Error(errorMsg);
            setError(err);
            options.onError?.(err);
          },
        }, {
          systemPrompt: options.systemPrompt,
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          workload: options.workload,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    [client, isLoading, options]
  );

  const clear = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
    setError(null);
  }, []);

  return {
    messages,
    send,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    clear,
    setMessages,
  };
}
