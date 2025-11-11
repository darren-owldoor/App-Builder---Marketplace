import { Helmet } from "react-helmet";

const SMSConsentDocumentation = () => {
  return (
    <>
      <Helmet>
        <title>OwlDoor SMS Consent Documentation - Twilio Verification</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <style>{`
          .consent-doc-container {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
          }
          .consent-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
          }
          .consent-section {
            background: white;
            padding: 30px;
            margin-bottom: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .consent-section h2 {
            color: #667eea;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .consent-box {
            background: #f8f9fa;
            border: 2px solid #667eea;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .checkbox-demo {
            display: flex;
            align-items: flex-start;
            padding: 15px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .checkbox-demo input {
            margin-right: 10px;
            width: 20px;
            height: 20px;
            flex-shrink: 0;
          }
          .step-flow {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
            flex-wrap: wrap;
          }
          .step {
            flex: 1;
            min-width: 200px;
            margin: 10px;
            text-align: center;
          }
          .step-number {
            background: #667eea;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 10px;
            font-weight: bold;
          }
          .code-block {
            background: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #667eea;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
            white-space: pre-wrap;
          }
          .compliance-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .compliance-table th,
          .compliance-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          .compliance-table th {
            background: #667eea;
            color: white;
          }
          .compliance-table tr:nth-child(even) {
            background: #f9f9f9;
          }
          .message-sample {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            border-left: 4px solid #2196f3;
          }
        `}</style>

        <div className="consent-doc-container">
          <div className="consent-header">
            <h1 className="text-3xl font-bold m-0">🦉 OwlDoor SMS Consent Documentation</h1>
            <div className="mt-2 opacity-95">Toll-Free Verification Proof of Consent - Phone: +1-888-888-8253</div>
          </div>

          <div className="consent-section">
            <h2>1. SMS Opt-In Consent Collection Method</h2>
            
            <p><strong>Website URL:</strong> <a href="https://owldoor.com" className="text-blue-600 hover:underline">https://owldoor.com</a></p>
            <p><strong>Form Location:</strong> Homepage and /get-started page</p>
            <p><strong>Collection Method:</strong> Required checkbox with explicit consent language</p>
            
            <div className="consent-box">
              <h3 className="text-lg font-semibold mb-3">Live Consent Checkbox Implementation:</h3>
              <div className="checkbox-demo">
                <input type="checkbox" id="demo_consent" required />
                <label htmlFor="demo_consent">
                  By providing your phone number and checking this box, you agree to receive SMS messages 
                  from OwlDoor regarding real estate agent matching services. Message frequency varies 
                  (2-5 messages per week). Message and data rates may apply. Reply STOP to unsubscribe 
                  or HELP for help. View our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> and{' '}
                  <a href="/sms-terms" className="text-blue-600 hover:underline">SMS Terms of Service</a>.
                </label>
              </div>
              <p className="text-red-600 mt-2">
                <span className="font-bold">*</span> This checkbox is REQUIRED - form cannot be submitted without checking it
              </p>
            </div>
          </div>

          <div className="consent-section">
            <h2>2. Complete Opt-In Flow</h2>
            
            <div className="step-flow">
              <div className="step">
                <div className="step-number">1</div>
                <strong>User Visits Site</strong>
                <p>User enters phone number on signup form</p>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <strong>Explicit Consent</strong>
                <p>Must check required SMS consent checkbox</p>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <strong>Double Opt-In SMS</strong>
                <p>Receives confirmation SMS, must reply YES</p>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <strong>Active Subscription</strong>
                <p>Begins receiving agent match alerts</p>
              </div>
            </div>
          </div>

          <div className="consent-section">
            <h2>3. Consent Logging & Storage</h2>
            
            <p>All consent is logged in our database with the following information:</p>
            
            <div className="code-block">{`{
  "phone_number": "+1-XXX-XXX-XXXX",
  "consent_given": true,
  "consent_timestamp": "2024-11-04T10:30:00Z",
  "consent_method": "website_form",
  "consent_text": "Full consent language shown to user",
  "ip_address": "XXX.XXX.XXX.XXX",
  "user_agent": "Mozilla/5.0...",
  "form_url": "https://owldoor.com/get-started",
  "double_opt_in_confirmed": true,
  "confirmed_at": "2024-11-04T10:31:00Z"
}`}</div>
            
            <table className="compliance-table">
              <thead>
                <tr>
                  <th>Data Point</th>
                  <th>Purpose</th>
                  <th>Retention</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Phone Number</td>
                  <td>SMS delivery</td>
                  <td>Until opt-out + 4 years</td>
                </tr>
                <tr>
                  <td>Consent Timestamp</td>
                  <td>Compliance proof</td>
                  <td>4 years minimum</td>
                </tr>
                <tr>
                  <td>IP Address</td>
                  <td>Fraud prevention</td>
                  <td>4 years</td>
                </tr>
                <tr>
                  <td>Consent Text</td>
                  <td>Proof of disclosure</td>
                  <td>4 years</td>
                </tr>
                <tr>
                  <td>Opt-out Status</td>
                  <td>Compliance</td>
                  <td>Indefinitely</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="consent-section">
            <h2>4. Sample Messages</h2>
            
            <div className="message-sample">
              <strong>Welcome Message (Sent Immediately):</strong><br />
              "Welcome to OwlDoor! Reply YES to confirm agent match alerts. Msg&data rates may apply. Reply STOP to unsubscribe, HELP for support."
            </div>
            
            <div className="message-sample">
              <strong>Confirmation Message (After User Replies YES):</strong><br />
              "OwlDoor: You're confirmed! You'll receive agent matches and updates. Save our number: 888-888-8253. Reply STOP to unsubscribe anytime."
            </div>
            
            <div className="message-sample">
              <strong>Agent Match Alert:</strong><br />
              "OwlDoor Alert: Sarah Chen (DRE#01234567) matches your criteria. 5-star rated, specializes in first-time buyers. View: owldoor.com/a/35214 Reply STOP to end"
            </div>
            
            <div className="message-sample">
              <strong>Opt-Out Confirmation:</strong><br />
              "OwlDoor: You've been unsubscribed from SMS alerts. You won't receive further messages. Questions? Call 888-888-8253"
            </div>
          </div>

          <div className="consent-section">
            <h2>5. Opt-Out Methods</h2>
            
            <p>Users can opt-out through multiple methods:</p>
            <ul>
              <li><strong>SMS:</strong> Reply STOP to any message</li>
              <li><strong>Phone:</strong> Call 888-888-8253</li>
              <li><strong>Website:</strong> Account settings at owldoor.com/settings</li>
              <li><strong>Email:</strong> Send request to support@owldoor.com</li>
            </ul>
            
            <p><mark className="bg-yellow-200 px-1">All opt-outs are processed immediately and automatically.</mark></p>
          </div>

          <div className="consent-section">
            <h2>6. Validation & Error Handling</h2>
            
            <p>The consent checkbox includes validation to ensure compliance:</p>
            
            <div className="code-block">{`// Form cannot be submitted without consent
if (!document.getElementById('sms_consent').checked) {
    alert('Please agree to receive SMS messages to continue');
    return false;
}

// Consent is logged before any SMS is sent
logConsent({
    phone: phoneNumber,
    timestamp: new Date().toISOString(),
    consentGiven: true
});`}</div>
          </div>

          <div className="consent-section">
            <h2>7. Compliance Documentation</h2>
            
            <p><strong>Business Information:</strong></p>
            <ul>
              <li>Business Name: OwlDoor LLC</li>
              <li>Website: https://owldoor.com</li>
              <li>Support Email: support@owldoor.com</li>
              <li>Toll-Free Number: +1-888-888-8253</li>
              <li>Privacy Policy: <a href="https://owldoor.com/privacy" className="text-blue-600 hover:underline">https://owldoor.com/privacy</a></li>
              <li>SMS Terms: <a href="https://owldoor.com/sms-terms" className="text-blue-600 hover:underline">https://owldoor.com/sms-terms</a></li>
            </ul>
            
            <p><strong>Message Frequency:</strong> 2-5 messages per week</p>
            <p><strong>Message Types:</strong> Agent matches, appointment reminders, service updates</p>
            <p><strong>Carrier Charges:</strong> Message and data rates may apply</p>
          </div>

          <div className="consent-section" style={{ background: '#e8f5e9' }}>
            <h2>✅ Verification Checklist</h2>
            
            <ul className="list-none pl-0">
              <li>✅ Required consent checkbox implemented</li>
              <li>✅ Clear disclosure of message frequency</li>
              <li>✅ "Message and data rates may apply" included</li>
              <li>✅ STOP keyword instructions provided</li>
              <li>✅ HELP keyword support available</li>
              <li>✅ Double opt-in confirmation required</li>
              <li>✅ All consent logged with timestamp</li>
              <li>✅ Privacy Policy link provided</li>
              <li>✅ SMS Terms link provided</li>
              <li>✅ Multiple opt-out methods available</li>
              <li>✅ Immediate opt-out processing</li>
              <li>✅ Consent records retained for compliance</li>
            </ul>
          </div>

          <div className="consent-section text-center" style={{ background: '#f5f5f5' }}>
            <p><strong>Last Updated:</strong> November 4, 2024</p>
            <p><strong>Contact:</strong> Darren@OwlDoor.com | 888-888-8253</p>
            <p>This documentation is maintained for Twilio toll-free verification compliance.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SMSConsentDocumentation;
