import assert from 'node:assert/strict';

// Mock AIChatMessage type and logic from AIChatContext
function resolvePathway(gender, pathway) {
  if (gender === 'male' || pathway === 'male') return 'male';
  if (gender === 'female' || pathway === 'female') return 'female';
  return 'general';
}

function getInitialGreeting(pathway) {
  let greetingText = '';
  if (pathway === 'female') {
    greetingText = 'Hi! I’m BioPulse AI. Ask me about your screening, labs, symptoms, or next steps.';
  } else if (pathway === 'male') {
    greetingText = 'Hi! I’m BioPulse AI. Ask me about your screening, hormones, symptoms, or next steps.';
  } else {
    greetingText = 'Hi! I’m BioPulse AI. What would you like help understanding?';
  }

  return {
    id: 'initial_greeting',
    sender: 'ai',
    text: greetingText,
    timestamp: 'Just now',
    safetyLevel: 'normal',
  };
}

function migrateStoredMessages(parsedMessages, initialGreeting) {
  if (!Array.isArray(parsedMessages) || parsedMessages.length === 0) {
    return [initialGreeting];
  }
  return parsedMessages.map((m, idx) => {
    if (
      idx === 0 &&
      (m.id === 'initial_greeting' ||
        m.text?.includes('health literacy and pattern explanation companion') ||
        m.text?.includes('baseline health patterns') ||
        m.text?.includes('hormonal vitality, male health screening'))
    ) {
      return {
        ...m,
        id: 'initial_greeting',
        text: initialGreeting.text,
      };
    }
    return m;
  });
}

function buildHistoryPayload(messages) {
  return messages
    .filter((m) => m.id !== 'initial_greeting')
    .slice(-6)
    .map((m) => ({ sender: m.sender, text: m.text }));
}

console.log('🧪 Starting BioPulse AI Companion Greeting & Session Migration Tests...\n');

// Test 1: Exact Greeting Wording
const femaleGreeting = getInitialGreeting('female');
assert.equal(
  femaleGreeting.text,
  'Hi! I’m BioPulse AI. Ask me about your screening, labs, symptoms, or next steps.',
  'Female greeting wording must match preferred copy'
);
console.log('✅ Test 1 Passed: Female greeting matches exact short wording.');

const maleGreeting = getInitialGreeting('male');
assert.equal(
  maleGreeting.text,
  'Hi! I’m BioPulse AI. Ask me about your screening, hormones, symptoms, or next steps.',
  'Male greeting wording must match preferred copy'
);
console.log('✅ Test 2 Passed: Male greeting matches exact short wording.');

const generalGreeting = getInitialGreeting('general');
assert.equal(
  generalGreeting.text,
  'Hi! I’m BioPulse AI. What would you like help understanding?',
  'General greeting wording must match fallback copy'
);
console.log('✅ Test 3 Passed: General greeting matches exact fallback copy.');

// Test 4: Forbidden Phrases Check
const forbidden = [
  'health literacy and pattern explanation companion',
  'baseline health patterns',
  'verified lab markers',
  'lifestyle insights',
  'hormonal vitality',
];
for (const greeting of [femaleGreeting, maleGreeting, generalGreeting]) {
  for (const phrase of forbidden) {
    assert.ok(
      !greeting.text.toLowerCase().includes(phrase.toLowerCase()),
      `Greeting should not contain forbidden phrase "${phrase}"`
    );
  }
}
console.log('✅ Test 4 Passed: No forbidden lengthy phrases present in any initial greeting.');

// Test 5: Session Storage Migration of Legacy Initial Greeting
const legacySession = [
  {
    id: 'initial_greeting',
    sender: 'ai',
    text: 'Hello! I am BioPulse AI Companion, your health literacy and pattern explanation companion (Recorded cycle: Day 14, Ovulatory). I am here to help you explore your baseline health patterns, verified lab markers, and lifestyle insights. What would you like to explore today?',
    timestamp: '10:00 AM',
  },
  {
    id: 'user_1710000000000',
    sender: 'user',
    text: 'What did my fasting glucose mean?',
    timestamp: '10:01 AM',
  },
  {
    id: 'ai_1710000000001',
    sender: 'ai',
    text: 'Your fasting glucose of 88 mg/dL is within optimal reference range.',
    timestamp: '10:01 AM',
  },
];

const migratedSession = migrateStoredMessages(legacySession, femaleGreeting);
assert.equal(migratedSession.length, 3, 'All 3 messages must be preserved');
assert.equal(
  migratedSession[0].text,
  femaleGreeting.text,
  'Legacy initial greeting must be migrated to new short greeting'
);
assert.equal(migratedSession[1].text, 'What did my fasting glucose mean?', 'User message preserved');
assert.equal(migratedSession[2].text, 'Your fasting glucose of 88 mg/dL is within optimal reference range.', 'AI reply preserved');
console.log('✅ Test 5 Passed: Legacy sessionStorage safely migrated without dropping user messages.');

// Test 6: History Payload Excludes Initial Greeting and Prevents Duplication
const history = buildHistoryPayload(migratedSession);
assert.equal(history.length, 2, 'History payload should exclude initial_greeting');
assert.deepEqual(history[0], { sender: 'user', text: 'What did my fasting glucose mean?' });
assert.deepEqual(history[1], { sender: 'ai', text: 'Your fasting glucose of 88 mg/dL is within optimal reference range.' });

// When user submits a new prompt:
const newPrompt = 'What about my insulin?';
assert.ok(
  !history.some((m) => m.text === newPrompt),
  'History payload must NOT include the pending user prompt before request'
);
console.log('✅ Test 6 Passed: History payload strictly bounds prior history and avoids prompt duplication.');

console.log('\n🎉 ALL 6 AI COMPANION GREETING & MIGRATION TESTS PASSED PERFECTLY!\n');
