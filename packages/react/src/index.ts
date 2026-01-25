/**
 * @archipelag/react - React hooks and components for Archipelag.io
 *
 * @example
 * ```tsx
 * import { ArchipelagProvider, useChat } from '@archipelag/react';
 *
 * function App() {
 *   return (
 *     <ArchipelagProvider apiKey="ak_xxx">
 *       <ChatComponent />
 *     </ArchipelagProvider>
 *   );
 * }
 *
 * function ChatComponent() {
 *   const { messages, send, isLoading } = useChat();
 *
 *   return (
 *     <div>
 *       {messages.map((msg, i) => (
 *         <div key={i}>{msg.role}: {msg.content}</div>
 *       ))}
 *       <button onClick={() => send('Hello!')} disabled={isLoading}>
 *         Send
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */

export { ArchipelagProvider, useArchipelag } from './context';
export { useChat } from './hooks/useChat';
export { useImage } from './hooks/useImage';
export type {
  ArchipelagProviderProps,
  ArchipelagContextValue,
} from './context';
export type {
  UseChatOptions,
  UseChatReturn,
  ChatMessage,
} from './hooks/useChat';
export type {
  UseImageOptions,
  UseImageReturn,
  GeneratedImage,
} from './hooks/useImage';
