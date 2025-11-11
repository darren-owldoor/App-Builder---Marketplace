# Smart Agent Qualification Form - Question Type Breakdown

## 📍 **Current URL**
**Live Demo:** `/smart-qualification`

## Question Categories

### ✅ **BUTTON QUESTIONS** (Single-Click Answers)

#### Q1: Experience Level
**Type:** Single Select Buttons (4 options)
```
☐ Less than 1 year → Short Path
☐ 1–3 years → Mid Path
☐ 3–5 years → Mid/Pro Path
☐ 5+ years → Pro Path
```
**Logic:** Routes to appropriate path based on experience

---

#### Q2: Production Level  
**Type:** Single Select Buttons (4 options)
```
☐ 0–5 homes → Short Path
☐ 6–15 homes → Mid Path
☐ 16–30 homes → Pro Path
☐ 31+ homes → Pro Path
```
**Logic:** Can override experience-based path (e.g., 0-5 sales forces Short Path even if 5+ years)

---

#### Q3: Biggest Challenge
**Type:** Multi-Select Buttons (select 1-2)
```
☐ Not enough leads
☐ Lack of systems or tech
☐ Limited mentorship or support
☐ Inconsistent income
☐ Weak team culture or leadership
☐ Balancing time / freedom
☐ Other
```
**Conditional Follow-ups:**
- If "Leads" selected → Ask: "Would you like to see lead-provided team options?" (Yes/No/Maybe buttons)
- If "Mentorship" selected → Ask: "Interested in mentorship-focused teams?" (Yes/No/Maybe buttons)

---

#### Q4: Main Goal for Next Year
**Type:** Multi-Select Buttons (select up to 2)
```
☐ Higher income
☐ More consistency
☐ Better mentorship or support
☐ More freedom & flexibility
☐ Building or leading a team
☐ Growing my personal brand
```
**Conditional Follow-up:**
- If "Building or leading a team" selected → Show **NUMBER INPUT**: "How many agents do you lead or plan to?"

---

#### Q5: Timeline
**Type:** Single Select Buttons (5 options)
```
☐ Just exploring → END EARLY (store data, no advanced questions)
☐ Within 30 days → HIGH PRIORITY, show advanced questions
☐ 1–3 months → MEDIUM PRIORITY
☐ 3–6 months → MEDIUM-LOW PRIORITY
☐ 6+ months → LOW PRIORITY
```
**Logic:** 
- "Just exploring" = Store data, send thank you, END
- "Within 30 days" = Continue to advanced questions (Q6-Q7)

---

#### Q6: Current Split (Pro/Advanced Only)
**Type:** Single Select Buttons (6 options)
```
☐ 50/50 or team-based
☐ 70/30
☐ 80/20
☐ 90/10
☐ 100% / transaction fee
☐ Unsure
```
**Shown to:** Mid/Pro Path agents who selected timeline other than "Just exploring"

---

#### Q7: Brokerage Values (Pro/Advanced Only)
**Type:** Multi-Select Buttons (select top 2-3)
```
☐ Leads provided
☐ Coaching / Mentorship
☐ Brand / Reputation
☐ Systems & Tech
☐ Culture & Support
☐ Revenue Share / Passive Income
☐ Freedom & Autonomy
```
**Shown to:** Mid/Pro Path agents who selected timeline other than "Just exploring"

---

#### Q8: Communication Preference
**Type:** Single Select Buttons (4 options)
```
☐ Text
☐ Call
☐ Email
☐ Any of the above
```
**Required for all paths**

---

#### Q9: Permission / Next Step
**Type:** Single Select Buttons (2 options)
```
☐ Yes, show me matches
☐ Not right now
```
**Required for all paths**

---

### ✏️ **TEXT/NUMBER INPUTS**

#### Contact Information (End of Form)
- **Name** (text input, required)
- **Email** (text input, email validation, required)
- **Phone** (text input, phone validation, required)

#### Conditional Number Input
- **"How many agents do you lead or plan to?"**
  - Type: Number input
  - Min: 0
  - Shown when: Q4 includes "Building or leading a team"
  - Used for: Mid/Pro path scoring

---

## 🎯 Path Logic Summary

### Short Path (5-6 questions, ~30-40 seconds)
**Triggers:**
- Experience < 1 year OR
- Sales ≤ 5 per year

**Questions:**
1. Experience Level
2. Production Level
3. Biggest Challenge (+ optional follow-up)
4. Main Goal
5. Timeline
6. Contact + Permission

**Skips:** Current Split, Brokerage Values

---

### Mid Path (7-8 questions, ~50-60 seconds)
**Triggers:**
- Experience 1-3 years AND
- Sales 6-15 per year

**Questions:**
1. Experience Level
2. Production Level
3. Biggest Challenge (+ optional follow-up)
4. Main Goal (+ optional team size)
5. Timeline
6. Current Split (if not "just exploring")
7. Brokerage Values (if not "just exploring", top 2)
8. Contact + Permission

---

### Pro Path (9-10 questions, ~70-80 seconds)
**Triggers:**
- Experience 3+ years OR
- Sales 16+ per year

**Questions:**
1. Experience Level
2. Production Level
3. Biggest Challenge (+ optional follow-ups)
4. Main Goal (+ team size if applicable)
5. Timeline
6. Current Split (if not "just exploring")
7. Brokerage Values (if not "just exploring", top 2-3)
8. Contact + Permission

**Additional Data Points:**
- If 31+ sales → Store "top_producer: true"
- If building team → Ask team size

---

## 🤖 Hybrid AI Chatbot Integration

### Phase 1: Button-Based Form (On-Page)
✅ **Fast, visual, mobile-friendly**
- All questions above rendered as buttons
- Progress indicator shows current step
- Conditional branching based on answers
- ~30-80 seconds to complete

### Phase 2: AI Chatbot Follow-Up (SMS)
**Triggers When:**
- User completes form
- User is NOT logged in
- User provided phone number
- User selected communication preference = "Text" or "Any"

**AI Chatbot Texts Them:**
1. **Thank you message** with personalized greeting
2. **Follow-up questions** based on their button answers:
   - If they selected "Other" for challenge → Ask what specifically
   - If timeline is "Within 30 days" → Ask if they have specific date in mind
   - If they selected multiple challenges → Ask which is #1 priority
   - If Pro path → Ask about current brokerage pain points

3. **Match preview** (if "Yes, show me matches")
   - "Based on your answers, I found 3 teams that might be perfect fits..."
   - Send preview links

4. **Appointment booking** (if interested)
   - "Would you like to schedule a call with [Team Name]?"
   - Integration with Calendly/Cronofy

**Example SMS Flow:**
```
Agent: Q1-Q9 via button form
AI: "Hi [Name]! Thanks for completing the form. I noticed you mentioned 
     'inconsistent income' as a challenge. Can you tell me more about 
     what's causing that?"
     
Agent: [Text response]
AI: "Got it. Based on what you shared, I think [Team A] and [Team B] 
     would be great fits. They both provide consistent leads and have 
     strong training programs. Want to learn more about either one?"
     
Agent: "Tell me about Team A"
AI: [Sends details + booking link]
```

---

## 📊 Data Capture & Scoring

### Button Data → Field Definitions Mapping

| Question | Button Answer | Field Definition | Value Stored |
|----------|--------------|------------------|--------------|
| Q1 | "Less than 1 year" | `experience_years` | "<1" |
| Q1 | "1-3 years" | `experience_years` | "1-3" |
| Q1 | "3-5 years" | `experience_years` | "3-5" |
| Q1 | "5+ years" | `experience_years` | "5+" |
| Q2 | "0-5" | `homes_sold_per_year` | "0-5" |
| Q2 | "6-15" | `homes_sold_per_year` | "6-15" |
| Q2 | "16-30" | `homes_sold_per_year` | "16-30" |
| Q2 | "31+" | `homes_sold_per_year` | "31+" |
| Q3 | ["Leads", "Mentorship"] | `biggest_challenges` | ["leads", "mentorship"] |
| Q4 | ["Income", "Team"] | `main_goals` | ["income", "team"] |
| Q5 | "Within 30 days" | `timeline` | "30days" |
| Q6 | "80/20" | `current_split` | "80/20" |
| Q7 | ["Leads", "Coaching", "Tech"] | `brokerage_values` | ["leads", "coaching", "tech"] |
| Q8 | "Text" | `contact_preference` | "text" |
| Q9 | "Yes" | `wants_matches` | "yes" |

### Qualification Score Calculation (0-100)

```javascript
let score = 0;

// Path scoring
if (agent_path === "pro") score += 30;
else if (agent_path === "mid") score += 20;
else score += 10;

// Timeline urgency
if (timeline === "30days") score += 25;
else if (timeline === "1-3months") score += 15;
else if (timeline === "3-6months") score += 10;
else if (timeline === "6+months") score += 5;

// Wants matches
if (wants_matches === "yes") score += 20;
else if (wants_matches === "check") score += 10;

// Experience bonus
if (experience_years === "5+") score += 15;
else if (experience_years === "3-5") score += 10;

// Sales bonus
if (homes_sold_per_year === "31+") score += 10;
else if (homes_sold_per_year === "16-30") score += 5;

// Max score: 100
return Math.min(score, 100);
```

---

## 🔄 Integration with Intelligent Matcher

### Data Stored in `pros` Table:
```json
{
  "qualification_score": 85,
  "qualification_data": {
    "agent_path": "pro",
    "experience_years": "5+",
    "homes_sold_per_year": "16-30",
    "biggest_challenges": ["leads", "systems"],
    "main_goals": ["income", "mentorship"],
    "timeline": "30days",
    "current_split": "80/20",
    "brokerage_values": ["leads", "coaching", "tech"],
    "contact_preference": "text",
    "wants_matches": "yes"
  },
  // Field definition mapped fields
  "experience_years": "5+",
  "homes_sold_per_year": "16-30",
  "specialties": ["residential", "commercial"],
  "languages": ["English", "Spanish"]
}
```

### Used by Intelligent Matcher:
- **Field-driven matching**: Experience, sales volume, specialties match client needs
- **AI semantic matching**: Challenges, goals match team culture descriptions
- **Qualification score**: Higher scores = higher priority in matching queue
- **Timeline**: Urgent agents matched first

---

## 📱 Mobile-First Design

### Button Styling Best Practices:
```tsx
// Large tap targets (min 44px height)
<Button className="h-12 w-full text-left justify-start">
  <RadioGroupIndicator className="mr-3" />
  Less than 1 year
</Button>

// Visual grouping for multi-select
<div className="grid grid-cols-2 gap-3">
  <Button variant={selected ? "default" : "outline"}>
    <CheckIcon className="mr-2" />
    Leads provided
  </Button>
</div>

// Progress indicator
<Progress value={(currentStep / totalSteps) * 100} />
```

---

## 🎨 UI/UX Recommendations

### Visual Hierarchy:
1. **Bold question text** (18-20px)
2. **Button options** with icons (16px)
3. **Helper text** below buttons (14px muted)

### Interaction Patterns:
- ✅ Single select → Radio buttons styled as cards
- ✅ Multi-select → Checkboxes styled as cards with outline when selected
- ✅ Smooth transitions between steps
- ✅ Back button always visible
- ✅ Progress bar at top

### Error Handling:
- Require selection before enabling "Next" button
- Show validation errors inline
- Disable "Next" until valid selection made

---

## 🚀 Next Steps

1. ✅ **Test button-based form** at `/smart-qualification`
2. 🔄 **Integrate AI chatbot** for SMS follow-up
3. 🔄 **Connect to Intelligent Matcher** for auto-matching
4. 🔄 **Add to agent onboarding** flow
5. 🔄 **Create landing page** variants for Zapier

---

## 📊 Success Metrics to Track

- **Completion rate** by path (Short/Mid/Pro)
- **Time to complete** average per path
- **Drop-off points** (which questions cause abandonment)
- **Match acceptance rate** (qualification_score correlation)
- **SMS response rate** (chatbot follow-up effectiveness)
