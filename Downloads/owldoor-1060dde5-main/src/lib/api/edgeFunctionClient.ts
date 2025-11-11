// Example usage of edge function retry logic
import { invokeWithRetry } from '../edgeFunctionRetry';
import { toast } from 'sonner';

// Example: Import leads with retry logic
export async function importLeadsWithRetry(data: any[]) {
  const result = await invokeWithRetry(
    'zapier-import',
    {
      body: {
        entity_type: 'leads',
        data,
      },
    },
    {
      maxRetries: 3,
      initialDelay: 1000,
      onRetry: (attempt, error) => {
        toast.info(`Retrying import... (attempt ${attempt})`);
        console.log(`Retry attempt ${attempt}:`, error);
      },
    }
  );

  if (result.error) {
    toast.error(`Import failed: ${result.error.message}`);
    throw result.error;
  }

  toast.success(`Successfully imported ${data.length} leads`);
  return result.data;
}

// Example: Create client with retry logic
export async function createClientWithRetry(clientData: any) {
  const result = await invokeWithRetry(
    'create-client-admin',
    {
      body: clientData,
    },
    {
      maxRetries: 2,
      initialDelay: 500,
    }
  );

  if (result.error) {
    toast.error(`Failed to create client: ${result.error.message}`);
    throw result.error;
  }

  toast.success('Client created successfully');
  return result.data;
}

// Example: Verify phone with retry logic for transient errors only
export async function verifyPhoneWithRetry(sessionId: string, phone: string, code?: string) {
  const action = code ? 'verify' : 'send';
  
  const result = await invokeWithRetry(
    'agent-verify-phone',
    {
      body: {
        action,
        sessionId,
        phone,
        ...(code && { code }),
      },
    },
    {
      maxRetries: 2,
      retryableStatuses: [500, 502, 503, 504], // Only retry on server errors, not validation errors
    }
  );

  if (result.error) {
    toast.error(`Phone verification failed: ${result.error.message}`);
    throw result.error;
  }

  return result.data;
}
