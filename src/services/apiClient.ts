/**
 * Central API Client with logging capabilities.
 * Uses a simple event emitter pattern to notify DevPanel of API calls.
 */

export type ApiLogEntry = {
  id: string;
  timestamp: Date;
  endpoint: string;
  request: any;
  response: any;
  duration: number;
  type: 'GET' | 'POST' | 'SCENARIO' | 'IDENTIFY' | 'ADDRESS_SEARCH' | 'ADDRESS_DETAILS' | 'SIGNING';
};

type ApiLogListener = (entry: ApiLogEntry) => void;

// Simple global event emitter for API logs
class ApiLogEmitter {
  private listeners: Set<ApiLogListener> = new Set();

  subscribe(listener: ApiLogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(entry: ApiLogEntry) {
    this.listeners.forEach(listener => listener(entry));
  }
}

export const apiLogEmitter = new ApiLogEmitter();

/**
 * Wrapper function to execute an API call and log it.
 * Use this for all service calls that should appear in DevPanel.
 */
export async function loggedApiCall<T>(
  endpoint: string,
  type: ApiLogEntry['type'],
  request: any,
  serviceCall: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const response = await serviceCall();
    
    const entry: ApiLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      endpoint,
      type,
      request,
      response,
      duration: Date.now() - startTime,
    };
    
    apiLogEmitter.emit(entry);
    
    return response;
  } catch (error) {
    const entry: ApiLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      endpoint,
      type,
      request,
      response: { error: String(error) },
      duration: Date.now() - startTime,
    };
    
    apiLogEmitter.emit(entry);
    throw error;
  }
}
