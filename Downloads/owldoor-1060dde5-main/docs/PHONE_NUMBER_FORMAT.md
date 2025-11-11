# Phone Number Formatting for Twilio

This document explains the phone number formatting requirements for Twilio integration.

## E.164 Format Requirement

Twilio requires all phone numbers to be in **E.164 format**:
- Format: `+[country code][subscriber number including area code]`
- Example: `+18888888253`

### E.164 Format Rules:
- Always starts with `+`
- Followed by country code (1 for US/Canada)
- Then the 10-digit phone number (no spaces, dashes, or parentheses)
- Total length: 12 characters for US numbers (+1XXXXXXXXXX)

## Configuration

### Setting the TWILIO_NUMBER Secret

When configuring the `TWILIO_NUMBER` secret in Lovable Cloud:
1. Go to Cloud → Secrets
2. Update or add `TWILIO_NUMBER`
3. Enter your Twilio phone number in E.164 format: `+18888888253`
4. **Important**: Must include the `+1` prefix for US numbers

### Backup Twilio Configuration (Optional)

If using backup Twilio credentials:
- `TWILIO_BACKUP_PHONE_NUMBER` must also be in E.164 format

## Automatic Formatting

The application automatically formats phone numbers to E.164 in the following locations:

### Backend (Edge Functions)
- `supabase/functions/_shared/phoneFormatter.ts` - Shared utility
- All Twilio-related edge functions use `formatPhoneForTwilio()` function

### Frontend (React Components)
- `src/utils/phoneFormatter.ts` - Client-side utility
- `src/lib/smsConsent.ts` - SMS consent logging with automatic formatting

## Usage Examples

### Backend (Edge Functions)
```typescript
import { formatPhoneForTwilio } from '../_shared/phoneFormatter.ts';

const userPhone = '8888888253';
const formatted = formatPhoneForTwilio(userPhone); // Returns: +18888888253
```

### Frontend (React)
```typescript
import { formatPhoneForTwilio } from '@/utils/phoneFormatter';

const userPhone = '(888) 888-8253';
const formatted = formatPhoneForTwilio(userPhone); // Returns: +18888888253
```

## Validation

### Check if a phone number is valid E.164:
```typescript
import { isValidE164Phone } from '@/utils/phoneFormatter';

isValidE164Phone('+18888888253'); // true
isValidE164Phone('8888888253'); // false
isValidE164Phone('+1 (888) 888-8253'); // false
```

## Common Issues

### Issue: SMS not sending
**Cause**: Phone number not in E.164 format  
**Solution**: Ensure TWILIO_NUMBER secret starts with `+1`

### Issue: "Invalid 'From' Phone Number"
**Cause**: TWILIO_NUMBER missing `+1` prefix  
**Solution**: Update secret to include `+1` prefix (e.g., `+18888888253`)

### Issue: "Invalid 'To' Phone Number"
**Cause**: User phone number not properly formatted  
**Solution**: The app automatically formats, but ensure user input is being passed through `formatPhoneForTwilio()`

## Testing

To test phone number formatting:
1. Use the send-test-sms edge function
2. Check logs for formatted phone numbers in format: `+1XXXXXXXXXX`
3. Verify SMS delivery success

## References

- [Twilio E.164 Documentation](https://www.twilio.com/docs/glossary/what-e164)
- [E.164 International Standard](https://en.wikipedia.org/wiki/E.164)
