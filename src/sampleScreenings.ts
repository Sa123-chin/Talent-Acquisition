import { ScreeningRecord } from "./types";

export const SAMPLE_SCREENINGS: ScreeningRecord[] = [
  {
    id: "sample-liam",
    candidateName: "Liam Fletcher",
    jobTitle: "Senior Expat Mortgage Broker",
    date: new Date(Date.now() - 3600000 * 2).toLocaleDateString(), // 2 hours ago
    coreValues: `1. Client-Centric Excellence: Tailor premium solutions for Australian expats.
2. Extreme Ownership: End-to-end guidance from application to settlement.
3. Integrity & Trust: Honest expat tax residency and policy mapping.
4. Speed & Agility: Swift approvals across global time zones.`,
    cvText: "(Liam Fletcher CV - Pre-screened)",
    jdText: "(Senior Expat Mortgage Broker JD)",
    result: {
      score: 96,
      decision: "ADVANCE",
      decisionReason: "Liam meets all must-have requirements with 5+ years of Australian residential brokering experience, holding a current Cert IV and FBAA membership. His active expat brokering background in London makes him a pristine candidate for Odin.",
      mustHavesMet: [
        {
          requirement: "3+ years of active mortgage brokering or credit advisory experience",
          met: true,
          details: "Liam has over 5 years of experience: currently a Senior Mortgage Adviser at Aussie Loans Group focusing on expat residential lending, and previously a Mortgage Broker at LendSmart Australia."
        },
        {
          requirement: "Certificate IV in Finance and Mortgage Broking",
          met: true,
          details: "Obtained Certificate IV in Finance and Mortgage Broking in 2020 through AAL."
        },
        {
          requirement: "Current membership with MFAA or FBAA",
          met: true,
          details: "Liam is an accredited member of the Finance Brokers Association of Australia (FBAA), Member ID: 349921."
        },
        {
          requirement: "Extensive knowledge of major bank policies (ANZ, Westpac, NAB, CBA, Macquarie)",
          met: true,
          details: "Demonstrated through 2+ years as a credit assessor at Commonwealth Bank, plus 3+ years managing multi-lender filings in broker roles."
        },
        {
          requirement: "Exceptional communication skills and capability to operate in different timezones",
          met: true,
          details: "Lives in London (UK) as an Australian citizen, successfully managing expat clients across UAE, UK, and European zones."
        }
      ],
      mustHavesMissing: [],
      niceToHavesMet: [
        {
          requirement: "Bachelor's degree in Finance, Economics, or Business",
          met: true,
          details: "Holds a Bachelor of Business with a Finance Major from RMIT University (2018)."
        },
        {
          requirement: "Prior experience with HNW expat clients or cross-border lending structures",
          met: true,
          details: "Settled $45M AUD in expatriate loans, directly dealing with complex foreign income validation and cross-border residency criteria."
        }
      ],
      flags: [
        {
          issue: "Location/Timezone Offset",
          severity: "low",
          details: "Candidate is physically located in London, UK. While ideal for European expats, ensure this aligns with your regional shift allocations."
        }
      ],
      strengths: [
        "In-depth credit analysis background derived from his early career at Commonwealth Bank.",
        "Proven high performer with $45M in settled residential expat volume in the last year.",
        "Holds both RMIT Business degree and standard Cert IV + FBAA accreditation."
      ],
      script: {
        opening: "Hi Liam, this is Alex from the Talent Acquisition team here at Odin Mortgage. I hope your morning in London is off to a great start! I've been reviewing your resume and was incredibly impressed by your strong cross-border mortgage track record at Aussie Loans. How are things with you today?",
        context: "Fantastic. Just to set the stage, today's call is a quick 15-minute phone screen. I want to align on some basic requirements, dive briefly into your motivation for moving to Odin Mortgage, touch on your career history, and then outline our next steps. Does that agenda work for you?",
        section1Basic: "Let's kick off with the basics. First, what is your current notice period at Aussie Loans Group? Second, we are interviewing for our expat-facing hubs—can you confirm your salary expectations for this role? And third, since we cover global timezones, how do you manage working hours relative to Australian or Asian standard operations?",
        section2Motivation: "I see you've been working with expat clients in London and the UAE. What specifically attracted you to Odin Mortgage's global expat model, and how does this role fit into your long-term career goals as a broker?",
        section3History: "I noticed that during your time at LendSmart Australia, you developed a reputation for 'extreme ownership' from consultation through to settlement. At Odin, ownership is our primary core value. Could you walk me through a complex foreign-income deal you structured recently—perhaps a UK or UAE expat client—where you had to go above and beyond to secure the underwriter's approval?",
        section4Communication: "TA Guidelines: Evaluate Liam's ability to articulate complex financial concepts (foreign tax residency, borrowing caps) clearly and confidently. Look for structured, objective responses and active listening when you describe Odin's setup.",
        close: "Thank you for sharing that, Liam. Those insights align perfectly with our client base. In terms of next steps, I'll compile my notes from today to present to our Expat Lending Director. If all aligns, the next stage is a 45-minute technical review covering credit policy mapping. We hope to make decisions by Friday. Do you have any questions for me about Odin Mortgage or the team?",
        probes: [
          "I notice you transitioned from local lending at LendSmart to remote expat lending at Aussie Loans Group. What was the biggest adjustment you had to make in credit policies?",
          "Can you clarify your current residency/visa status in the UK and if you have plans to return to Australia in the near future?"
        ]
      }
    }
  },
  {
    id: "sample-amara",
    candidateName: "Amara Chen",
    jobTitle: "Senior Expat Mortgage Broker",
    date: new Date(Date.now() - 3600000 * 5).toLocaleDateString(), // 5 hours ago
    coreValues: `1. Client-Centric Excellence: Tailor premium solutions for Australian expats.
2. Extreme Ownership: End-to-end guidance from application to settlement.
3. Integrity & Trust: Honest expat tax residency and policy mapping.
4. Speed & Agility: Swift approvals across global time zones.`,
    cvText: "(Amara Chen CV - Pre-screened)",
    jdText: "(Senior Expat Mortgage Broker JD)",
    result: {
      score: 18,
      decision: "REJECT",
      decisionReason: "Amara's background is exclusively in Digital Marketing and FinTech customer acquisition. She does not possess any mortgage brokering experience, lacks the Cert IV qualification, and does not hold an MFAA or FBAA membership. This is a severe mismatch for a Senior Expat Broker role.",
      mustHavesMet: [],
      mustHavesMissing: [
        {
          requirement: "3+ years of active mortgage brokering or credit advisory experience",
          details: "Amara has zero experience in mortgage brokering or credit advisory. Her career is entirely focused on marketing campaigns, customer acquisition, and branding."
        },
        {
          requirement: "Certificate IV in Finance and Mortgage Broking",
          details: "Amara does not have a Cert IV in Finance and Mortgage Broking listed in her education or certifications."
        },
        {
          requirement: "Current membership with MFAA or FBAA",
          details: "No membership is indicated on her profile."
        },
        {
          requirement: "Extensive knowledge of Australian major bank credit policies",
          details: "No background in bank credit policies or loan packaging platforms."
        }
      ],
      niceToHavesMet: [],
      flags: [
        {
          issue: "Complete Experience Mismatch",
          severity: "high",
          details: "Candidate has applied for a high-level credit advisory role with a purely marketing and media relations background."
        }
      ],
      strengths: [
        "Strong marketing automation and digital customer acquisition skills that could be highly relevant for non-sales marketing roles at Odin."
      ],
      rejectionNote: `Subject: Job Application: Senior Expat Mortgage Broker at Odin Mortgage

Dear Amara,

Thank you for your interest in joining the Odin Mortgage team and taking the time to submit your application for the Senior Expat Mortgage Broker position.

We have carefully reviewed your experience and qualifications. While we are highly impressed by your standout track record in digital marketing, fintech customer acquisition, and campaign analytics, our Senior Expat Broker role requires extensive hands-on experience with Australian mortgage credit policies, Certificate IV credentials, and FBAA/MFAA memberships. Therefore, we will not be moving forward with your application for this specific position.

We will keep your details on file, as your excellent fintech marketing credentials could be a strong match for future growth and acquisition team vacancies at Odin.

We wish you the very best in your job search and your future endeavors.

Warm regards,

Talent Acquisition Team
Odin Mortgage`
    }
  }
];
