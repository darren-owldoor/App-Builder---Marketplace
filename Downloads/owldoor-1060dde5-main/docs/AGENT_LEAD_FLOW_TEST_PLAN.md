# Agent Lead Flow & Matching Test Plan

## Overview
This document outlines how agent leads enter the system, get matched to teams, and what teams see when they sign up.

---

## 1. Agent Signup Flow (Website)

### Entry Point: `/agent-signup`

### Steps:
1. **Service Area** (Step 1)
   - Agent enters ZIP codes with radius (e.g., "90210, 10 miles")
   - Multiple areas can be added
   - Stored in `coverage_areas` field as JSON

2. **Welcome Screen** (Step 2)
   - Shows animated owl, sets expectations (~1-2 minutes)

3. **Team Provides** (Step 3)
   - Multi-select: Free Leads, Referrals, Coaching, Tech & Tools, CRM & Website, Marketing, High Split, Top 1% Team, Benefits, Other
   - Stores in `wants` array

4. **Motivation & Goals** (Step 4)
   - Motivation rating (1-10 stars)
   - Homes to sell in next 12 months
   - Homes sold in past 12 months

5. **Work Preference** (Step 5)
   - Office, Remote, or Either One
   - Stored in `tags` array

6. **Current Brokerage** (Step 6)
   - Current brokerage name
   - Optional blacklist of brokerages not interested in

7. **Personal Info** (Step 7)
   - First name, Last name, Years of experience

8. **Phone & Consent** (Step 8)
   - Phone number
   - SMS consent checkbox (required)
   - Optional SMS opt-in for marketing

9. **Authentication** (Step 9)
   - Email and password
   - Creates auth user
   - Creates `pros` record with:
     - `pipeline_type: "agent"`
     - `pipeline_stage: "new"`
     - `status: "new"`
     - `pro_type: "real_estate_agent"` or `"mortgage_officer"`
   - Assigns `"lead"` role in `user_roles`
   - Redirects to `/onboarding`

### Database Records Created:
- `auth.users` - Authentication record
- `pros` - Agent profile with all qualification data
- `user_roles` - Assigns "lead" role
- Geographic data: cities, states, zip_codes, coverage_areas

---

## 2. Agent Signup Flow (API/Zapier)

### Entry Points:
- **Edge Function**: `agent-directory-signup`
- **Rate Limit**: 1000/hour per IP
- **Zapier Import**: `zapier-import` (100/minute per IP)

### API Flow:
1. **Validation** (Zod schema)
   - first_name, last_name, email, phone (required)
   - license, specialization, account_type, city, state (optional)

2. **Duplicate Check**
   - Searches by email, phone, or license
   - If found: updates pending data, creates/links auth user
   - If new: creates everything from scratch

3. **User Creation**
   - Creates auth user with temp password
   - Assigns "lead" role for real estate, "client" for mortgage
   - Creates `pros` record with:
     - `pipeline_stage: "new"`
     - `pipeline_type: "staff"`
     - `source: "directory"`
     - `matching_completed: false`

4. **Verification**
   - Generates 5-digit code
   - Stores in `magic_links` table
   - Sends email via SendGrid
   - Sends SMS via Twilio

5. **Response**
   ```json
   {
     "success": true,
     "message": "Account created! Check email/phone for code",
     "isExisting": false,
     "agentId": "uuid",
     "email": "agent@example.com",
     "specialization": "real_estate"
   }
   ```

### Zapier Import Flow:
- Same as API but can import in bulk
- Supports updating pipeline_stage
- Can trigger auto-match if stage = "match_ready"

---

## 3. Auto-Matching Logic

### Trigger Points:
1. Manual trigger by admin via `/admin` dashboard
2. API call to `auto-match-leads` function
3. Zapier stage update to `"match_ready"` with `trigger_matching: true`

### Matching Algorithm (`auto-match-leads`):

#### Step 1: Get Match-Ready Pros
```sql
SELECT * FROM pros 
WHERE pipeline_stage = 'match_ready' 
AND status IN ('active', 'verified', 'qualified')
```

#### Step 2: Get Eligible Clients
```sql
SELECT * FROM clients 
WHERE active = true 
AND credits_balance > 0 
AND current_package_id IS NOT NULL
```

#### Step 3: Get Active Bids
- Fetches all active bids from eligible clients
- Filters by `pro_type` (real_estate_agent or mortgage_officer)

#### Step 4: Calculate Match Scores

**Geographic Matching (40% weight)**
- Exact city match: 100 points
- State match only: 50 points
- ZIP code overlap: 80 points
- Uses coverage_data, radius_data, and coverage_areas

**Performance Matching (30% weight)**
For Real Estate Agents:
- Experience vs min_experience
- Transactions vs min_transactions
- Volume vs min_volume
- Qualification score

For Mortgage Officers:
- NMLS verification
- State licenses
- Loan types specialization
- Annual volume

**Specialization Matching (20% weight)**
- Wants/needs alignment
- Preferences match
- Work style compatibility

**Type-Specific Matching (10% weight)**
Real Estate:
- Buyer/seller percentage alignment
- Specializations (luxury, commercial, etc.)

Mortgage:
- Purchase vs refinance focus
- Loan types
- Co-marketing availability

**Bonus Points**
- High motivation score (+5 points)
- Multiple geographic overlaps (+10 points)

#### Step 5: Ranking & Selection
- Scores ranked per pro
- **Top 1 match per pro** is selected (for now, since only 1 team per area)
- Checks client hasn't exceeded `max_leads_per_month`

#### Step 6: Create Matches
Creates records in `matches` table:
```json
{
  "pro_id": "uuid",
  "client_id": "uuid",
  "bid_id": "uuid",
  "match_score": 85.5,
  "match_quality": "excellent",
  "match_breakdown": {
    "geographic": 40,
    "performance": 28,
    "specialization": 15,
    "type_specific": 8,
    "bonus": 5
  },
  "status": "pending"
}
```

#### Step 7: Deduct Credits & Update
- Deducts 1 credit from client's balance
- Creates `credit_transactions` record
- Updates pro `pipeline_stage` to "matched"

### Match Quality Ratings:
- **95+**: Excellent 🌟
- **85-94**: Very Good 💚
- **75-84**: Good 💛
- **65-74**: Fair 🟠
- **<65**: Needs Review 🔴

---

## 4. Team/Client Signup Flow

### Entry Point: `/client-signup`

### Steps (8 Total):

1. **User Type Selection**
   - Real Estate (Brokerage/Team)
   - Mortgage (Branch/Company)

2. **Team Information**
   - Company name, brokerage name, title

3. **Business Numbers**
   - Yearly sales volume
   - Yearly transactions
   - Team size

4. **Hiring Preferences**
   - Agent types looking for (checkboxes)
   - Number planning to hire in next 12 months

5. **Locations**
   - Cities and states (multiple allowed)
   - Dynamic input fields

6. **Personal Info**
   - First name, last name, email

7. **Phone & Consent**
   - Phone number
   - SMS consent checkbox

8. **Authentication**
   - Email and password
   - Or Google OAuth

### Database Records Created:
- `auth.users`
- `clients` record with:
  - `active: false` (pending approval)
  - `profile_completed: true`
  - `client_type: "real_estate"` or `"mortgage"`
  - All business metrics in `preferences`
  - Geographic data: cities, states
- `user_roles` - Assigns "client" role

### After Signup:
**Redirects to `/application-pending`**

---

## 5. Application Pending Page

### What Teams See:
```
┌─────────────────────────────────────────┐
│         ✓ Application Received!         │
│                                         │
│  Thank you for your interest in         │
│  joining OwlDoor                        │
│                                         │
│  📍 What's Next?                        │
│  We are currently reviewing your        │
│  application and our availability in    │
│  [Their City, State]                    │
│                                         │
│  🏠 Timeline                            │
│  Our team will get back to you within   │
│  1-3 business days                      │
│                                         │
│  💡 Pro Tip: Check your email (spam too)│
│                                         │
│  [Sign Out]  [Visit Website]           │
└─────────────────────────────────────────┘
```

### Admin Approval Process:
1. Admin reviews in `/admin` dashboard
2. Admin sets `active: true` on client record
3. Admin assigns `current_package_id` (custom or standard)
4. Admin adds credits to `credits_balance`
5. Client can now create bids and receive matches

---

## 6. Testing Checklist

### Agent Website Signup
- [ ] Complete all 9 steps successfully
- [ ] Verify `pros` record created with correct data
- [ ] Verify `user_roles` has "lead" role
- [ ] Verify geographic data stored correctly
- [ ] Verify redirect to `/onboarding`

### Agent API Signup
- [ ] POST to `agent-directory-signup` with required fields
- [ ] Verify duplicate detection works
- [ ] Verify email and SMS sent
- [ ] Verify rate limiting (1000/hour)
- [ ] Test with existing vs new agents

### Zapier Import
- [ ] Import leads via `zapier-import`
- [ ] Update stage to "match_ready"
- [ ] Verify auto-match triggered
- [ ] Check rate limits (100/minute)

### Auto-Matching
- [ ] Set pro to `pipeline_stage: "match_ready"`
- [ ] Verify client has credits and package
- [ ] Create active bid with coverage area
- [ ] Run `auto-match-leads` function
- [ ] Verify match created with correct score
- [ ] Verify credit deducted
- [ ] Verify pro stage updated to "matched"

### Team Signup
- [ ] Complete all 8 steps
- [ ] Verify `clients` record created
- [ ] Verify `active: false` (pending)
- [ ] Verify redirect to `/application-pending`
- [ ] Verify pending page shows correct location

### Admin Approval
- [ ] Admin activates client account
- [ ] Admin assigns package
- [ ] Admin adds credits
- [ ] Verify client can now receive matches

---

## 7. Current Limitations & Notes

1. **One Team Per Area**: Matching currently selects top 1 match per pro since there's typically only 1 team per geographic area initially

2. **Manual Approval**: Teams require admin approval before going live

3. **Credits Required**: Clients must have:
   - `active: true`
   - `credits_balance > 0`
   - `current_package_id` set

4. **Match Quality**: First match is best match - no round-robin yet

5. **Rate Limits**:
   - Website signup: 1000/hour per IP
   - API signup: 1000/hour per IP
   - Zapier import: 100/minute per IP

---

## 8. Database Tables Reference

### Key Tables:
- **pros**: Agent/LO profiles
- **clients**: Team/company profiles
- **bids**: Client's lead purchase criteria
- **matches**: Matched leads to clients
- **user_roles**: Role assignments
- **credit_transactions**: Credit usage tracking
- **magic_links**: Verification codes
- **pricing_packages**: Package definitions

### Important Fields:
- `pros.pipeline_stage`: "new" → "match_ready" → "matched"
- `pros.pipeline_type`: "agent" or "staff" 
- `pros.status`: "new", "active", "verified", "qualified"
- `clients.active`: false (pending) → true (approved)
- `matches.status`: "pending" → "accepted" → "closed"

---

## 9. Admin Actions Required

### To Enable Matching for a New Team:
1. Approve client (set `active: true`)
2. Assign a package (or create custom package)
3. Add credits to balance
4. Ensure client has created at least one active bid
5. Verify bid has proper coverage area (cities/states/zips)

### To Test Matching:
1. Create test agent with `pipeline_stage: "match_ready"`
2. Ensure agent's location overlaps with client's bid coverage
3. Manually trigger `auto-match-leads` or wait for automatic trigger
4. Check matches table for new record
5. Verify credit deducted from client

---

## Support & Questions

For issues or questions about the lead flow and matching:
- Check `/admin` dashboard for agent and client status
- Review edge function logs for API errors
- Verify geographic data alignment between pros and bids
- Ensure clients have active status, package, and credits
