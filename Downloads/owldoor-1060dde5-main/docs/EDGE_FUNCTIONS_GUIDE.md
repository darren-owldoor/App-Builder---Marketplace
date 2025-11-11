# Edge Functions Guide

## Enhanced Features

This project now includes comprehensive logging, automatic retry logic, and HMAC signature verification for edge functions.

## 1. Structured Logging

All edge functions now use structured logging with multiple log levels.

### Log Levels
- **info**: General information and successful operations
- **warn**: Warning messages for non-critical issues
- **error**: Error messages with stack traces
- **debug**: Detailed debugging information

### Usage in Edge Functions

```typescript
import { Logger } from '../_shared/logger.ts';

const logger = new Logger({ endpoint: 'my-function' });

logger.info('Processing request', { userId: '123' });
logger.warn('Rate limit approaching', { remaining: 5 });
logger.error('Database query failed', error);
logger.debug('Detailed state', { data });

// Track requests and responses
logger.request(req.method, req.url);
logger.response(200, duration, { result });

// Create child loggers with additional context
const userLogger = logger.child({ userId: '123' });
userLogger.info('User action completed');
```

### Log Output Format

```json
{
  "level": "info",
  "message": "Processing request",
  "endpoint": "my-function",
  "requestId": "uuid-here",
  "timestamp": "2025-01-04T12:00:00.000Z",
  "data": { "userId": "123" }
}
```

## 2. Automatic Retry Logic

Client-side utility for automatically retrying failed edge function calls with exponential backoff.

### Features
- Exponential backoff with jitter
- Configurable retry attempts
- Retries only on transient errors (network, 5xx, 429)
- Custom retry callbacks for UI feedback

### Basic Usage

```typescript
import { invokeWithRetry } from '@/lib/edgeFunctionRetry';

const { data, error } = await invokeWithRetry(
  'my-function',
  {
    body: { foo: 'bar' },
  },
  {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}`, error);
      toast.info(`Retrying... (attempt ${attempt})`);
    },
  }
);
```

### React Hook Usage

```typescript
import { useEdgeFunctionWithRetry } from '@/lib/edgeFunctionRetry';

function MyComponent() {
  const { invoke } = useEdgeFunctionWithRetry();

  const handleAction = async () => {
    const { data, error } = await invoke('my-function', {
      body: { action: 'process' },
    });

    if (error) {
      // Error already shown via toast
      return;
    }

    // Handle success
  };
}
```

### Retry Configuration

```typescript
interface RetryOptions {
  maxRetries?: number; // Default: 3
  initialDelay?: number; // Default: 1000ms
  maxDelay?: number; // Default: 10000ms
  backoffMultiplier?: number; // Default: 2
  retryableStatuses?: number[]; // Default: [408, 429, 500, 502, 503, 504]
  onRetry?: (attempt: number, error: any) => void;
}
```

### Example: Import with Retry

```typescript
import { importLeadsWithRetry } from '@/lib/api/edgeFunctionClient';

const leads = [
  { full_name: 'John Doe', email: 'john@example.com' },
  // ... more leads
];

try {
  const result = await importLeadsWithRetry(leads);
  console.log('Import successful:', result);
} catch (error) {
  console.error('Import failed after retries:', error);
}
```

## 3. HMAC Signature Verification

Secure webhook endpoints with HMAC-SHA256 signature verification.

### Server-Side (Edge Function)

```typescript
import { Logger } from '../_shared/logger.ts';
import { verifyWebhookRequest } from '../_shared/hmac.ts';

Deno.serve(async (req) => {
  const logger = new Logger({ endpoint: 'my-webhook' });
  
  // Verify signature
  const webhookSecret = Deno.env.get('MY_WEBHOOK_SECRET');
  const verification = await verifyWebhookRequest(req.clone(), webhookSecret, logger);
  
  if (!verification.valid) {
    logger.warn('Invalid signature');
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 401 }
    );
  }

  // Parse verified payload
  const payload = JSON.parse(verification.payload);
  
  // Process webhook...
});
```

### Client-Side (Calling Webhook)

```typescript
import { callExternalWebhookWithSignature } from '@/utils/webhookSignature';

const payload = {
  event: 'user.created',
  data: { userId: '123' },
};

const secret = 'your-webhook-secret';

const response = await callExternalWebhookWithSignature(
  'https://your-webhook-url.com',
  payload,
  secret
);
```

### Manual Signature Generation

```typescript
import { generateWebhookSignature } from '@/utils/webhookSignature';

const payload = { foo: 'bar' };
const secret = 'your-secret';

const signature = await generateWebhookSignature(payload, secret);

// Add to request header
fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-signature': signature,
  },
  body: JSON.stringify(payload),
});
```

### Header Formats

The HMAC verification supports two authentication methods:

1. **HMAC Signature** (Recommended):
   - Header: `x-signature: <hex-encoded-hmac-sha256>`
   - More secure, prevents tampering

2. **Simple Secret** (Fallback):
   - Header: `x-webhook-secret: <your-secret>`
   - Simpler but less secure

## Best Practices

### Logging
- Always use structured logging instead of console.log
- Include correlation IDs (requestId) for tracking
- Sanitize sensitive data (passwords, tokens) before logging
- Use appropriate log levels (don't log everything as 'info')

### Retry Logic
- Only retry transient errors (network, 5xx, rate limits)
- Don't retry on validation errors (4xx except 408, 429)
- Set reasonable max retries (2-3 usually sufficient)
- Implement exponential backoff to prevent overwhelming services
- Show user feedback during retries

### HMAC Verification
- Always verify signatures on production webhooks
- Store secrets securely in environment variables
- Use unique secrets per webhook endpoint
- Log signature failures for security monitoring
- Consider implementing replay attack prevention (timestamp checks)

## Security Notes

1. **Never log secrets or API keys**
2. **Always validate input before processing**
3. **Use HMAC signatures for all external webhooks**
4. **Implement rate limiting on all endpoints**
5. **Monitor logs for suspicious patterns**

## Monitoring

All logs are structured JSON and can be:
- Viewed in Supabase Edge Function logs
- Exported to monitoring services (Datadog, New Relic, etc.)
- Searched and filtered by level, endpoint, or requestId
- Aggregated for analytics and alerting

## Troubleshooting

### Logs not appearing
- Check that Logger is imported and instantiated
- Verify log level is appropriate
- Check Supabase Edge Function logs in dashboard

### Retries not working
- Check retryableStatuses configuration
- Verify error includes proper status code
- Check network connectivity

### HMAC verification failing
- Verify secret matches on both sides
- Ensure payload hasn't been modified
- Check signature header name (x-signature)
- Verify payload encoding matches (JSON.stringify)
