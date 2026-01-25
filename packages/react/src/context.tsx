/**
 * Archipelag React Context
 */

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { Archipelag } from '@archipelag/sdk';

export interface ArchipelagContextValue {
  client: Archipelag;
}

const ArchipelagContext = createContext<ArchipelagContextValue | null>(null);

export interface ArchipelagProviderProps {
  /**
   * Your Archipelag API key
   */
  apiKey: string;
  /**
   * Optional custom base URL
   */
  baseUrl?: string;
  /**
   * Children components
   */
  children: ReactNode;
}

/**
 * Provider component that makes the Archipelag client available to all children
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ArchipelagProvider apiKey="ak_xxx">
 *       <MyComponent />
 *     </ArchipelagProvider>
 *   );
 * }
 * ```
 */
export function ArchipelagProvider({
  apiKey,
  baseUrl,
  children,
}: ArchipelagProviderProps) {
  const client = useMemo(
    () => new Archipelag({ apiKey, baseUrl }),
    [apiKey, baseUrl]
  );

  const value = useMemo(() => ({ client }), [client]);

  return (
    <ArchipelagContext.Provider value={value}>
      {children}
    </ArchipelagContext.Provider>
  );
}

/**
 * Hook to access the Archipelag client
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { client } = useArchipelag();
 *
 *   const handleClick = async () => {
 *     const result = await client.chat('Hello!');
 *     console.log(result.content);
 *   };
 *
 *   return <button onClick={handleClick}>Chat</button>;
 * }
 * ```
 */
export function useArchipelag(): ArchipelagContextValue {
  const context = useContext(ArchipelagContext);
  if (!context) {
    throw new Error('useArchipelag must be used within an ArchipelagProvider');
  }
  return context;
}
