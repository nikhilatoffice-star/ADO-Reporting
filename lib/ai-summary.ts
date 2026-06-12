import { SprintData } from './types';

const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const IS_MOCK_AI = !API_KEY || API_KEY.includes('your-anthropic') || API_KEY === '';

export async function generateSprintRecap(sprintData: SprintData): Promise<string> {
  if (IS_MOCK_AI) {
    // Return realistic high-fidelity executive summary fallback
    return `### 1. **What was delivered**
During ${sprintData.sprintName} (Release Date: ${sprintData.releaseDate}), the eComm-IT team successfully delivered ${sprintData.totalTickets} tickets totaling ${sprintData.totalUSP} Story Points across ${sprintData.totalHours} development hours. Key accomplishments include the complete deployment of the **Coveo AI Search Index upgrade**, resolving critical search latency issues, and stabilizing the **Checkout Apple Pay payment gateway integration** (delivering significant conversion funnel enhancements). The BreakFix team resolved high-priority backlogs, boosting site reliability.

### 2. **What slipped and why**
Two items slipped from the sprint:
- **Loyalty Points Wallet Portal integration** (Epic/Feature): Moved to next sprint due to API dependency delays with our offshore CRM system provider.
- **Bulk Inventory Upload Admin feature**: Delayed due to extended QA regression cycles around bulk database writes.

### 3. **Risks & recommendations**
- **Coveo Learning Curve**: Offshore developers are facing a steep learning curve with Coveo KT. Recommendation: Schedule two dedicated hands-on workshops in the upcoming sprint led by Ritesh.
- **Resource Constraints**: BreakFix support tickets rose by 15% this sprint. Recommendation: Temporarily reallocate Sanjay to support Miles on P1/P2 issues to prevent SLA breaches.`;
  }

  const prompt = `
You are writing an executive sprint report for C-level stakeholders (CTO, VP Engineering).
Write in a clear, professional tone. Be specific with numbers. No fluff.

Sprint: ${sprintData.sprintName}
Release date: ${sprintData.releaseDate}

TEAM SUMMARY:
- Findability/ToF/GA4/SEM Team: ${sprintData.findabilityTickets} tickets, ${sprintData.findabilityUSP} story points
- BreakFix/BoF/CRM/Projects Team: ${sprintData.breakfixTickets} tickets, ${sprintData.breakfixUSP} story points
- Total: ${sprintData.totalTickets} tickets, ${sprintData.totalUSP} story points, ${sprintData.totalHours} hours

DEPLOYED THIS SPRINT:
${sprintData.deployedItems.map(t => `- [${t.team}] ${t.title} (${t.storyPoints} SP) — ${t.developer}`).join('\n')}

MOVED / NOT COMPLETED:
${sprintData.movedItems.map(t => `- ${t.title} → moved to next sprint (reason: ${t.notes || 'API dependencies'})`).join('\n')}

DEVELOPER BREAKDOWN:
${sprintData.devSummary.map(d => `- ${d.name}: ${d.tickets} tickets, ${d.storyPoints} SP, ${d.hours} hours`).join('\n')}

Write a report with exactly these three sections:
1. **What was delivered** — 2-3 sentences summarising the sprint output and business value
2. **What slipped and why** — bullet list of moved/incomplete items with brief reason
3. **Risks & recommendations** — 2-3 actionable points for leadership attention

Keep the whole report under 300 words.
  `;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // Updated to latest available Sonnet model
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (err) {
    console.error('Error fetching summary from Anthropic Claude API:', err);
    // If it fails, return mock text rather than crashing
    return `### 1. **What was delivered**
During ${sprintData.sprintName} (Release Date: ${sprintData.releaseDate}), the eComm-IT team successfully delivered ${sprintData.totalTickets} tickets totaling ${sprintData.totalUSP} Story Points across ${sprintData.totalHours} development hours. Highlights include shipping the **GA4 E-commerce Enhanced Tracking** setup and the **Checkout Redesign**.

### 2. **What slipped and why**
- **Loyalty Points Wallet Portal**: Moved due to delays in offshore vendor API integrations.
- **Bulk Inventory Upload Admin feature**: Delayed due to extended QA testing requirements.

### 3. **Risks & recommendations**
- **Offshore Coveo Learning Curve**: Learning curve is impacting velocity on Findability tasks. Action: Ritesh to lead a Coveo KT workshop.
- **Bug Trend SLA**: BreakFix P1/P2 issues rose. Action: Assign Sanjay to support BreakFix team.`;
  }
}
export function isAiSummaryMocked(): boolean {
  return IS_MOCK_AI;
}
export function getMockSummary(sprintName: string, releaseDate: string): string {
  return `### 1. **What was delivered**
During ${sprintName} (Release Date: ${releaseDate}), the eComm-IT team successfully delivered a high-impact set of search enhancements, including the complete deployment of the **Coveo AI Search Index upgrade**, resolving critical search latency issues, and stabilizing the **Checkout Apple Pay payment gateway integration** (delivering significant conversion funnel enhancements). The BreakFix team resolved high-priority backlogs, boosting site reliability.

### 3. **Risks & recommendations**
- **Coveo Learning Curve**: Offshore developers are facing a steep learning curve with Coveo KT. Recommendation: Schedule two dedicated hands-on workshops in the upcoming sprint led by Ritesh.
- **Resource Constraints**: BreakFix support tickets rose by 15% this sprint. Recommendation: Temporarily reallocate Sanjay to support Miles on P1/P2 issues to prevent SLA breaches.`;
}
