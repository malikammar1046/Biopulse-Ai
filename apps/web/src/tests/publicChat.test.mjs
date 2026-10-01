/**
 * apps/web/src/tests/publicChat.test.mjs
 *
 * Automated verification test suite for BioPulse AI Public Chatbot.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(thisDir, '..', '..');
const projectRoot = path.resolve(webRoot, '..');

test('1. Service exports correct constants and suggested questions', async () => {
  const servicePath = path.join(webRoot, 'src', 'services', 'publicChatService.ts');
  assert.ok(fs.existsSync(servicePath), 'publicChatService.ts must exist');

  const content = fs.readFileSync(servicePath, 'utf8');

  // Verify welcome message
  assert.ok(
    content.includes("Hi! I'm BioPulse Assistant. I can help you understand BioPulse"),
    'Must include the required initial welcome message'
  );

  // Verify all 5 suggested quick questions
  assert.ok(content.includes('What is BioPulse AI?'), 'Must have "What is BioPulse AI?"');
  assert.ok(content.includes('How does BioPulse work?'), 'Must have "How does BioPulse work?"');
  assert.ok(content.includes('What is PCOS?'), 'Must have "What is PCOS?"');
  assert.ok(
    content.includes('What health conditions does BioPulse support?'),
    'Must have "What health conditions does BioPulse support?"'
  );
  assert.ok(content.includes('How can I get started?'), 'Must have "How can I get started?"');

  // Verify endpoint URL
  assert.ok(content.includes('/v1/intelligence/public/chat/'), 'Must use public endpoint');

  // Verify zero auth token headers in public service
  assert.ok(
    !content.includes('Authorization') && !content.includes('supabase.auth'),
    'Public chat must NEVER include Authorization headers or Supabase session tokens'
  );

  // Verify sessionStorage isolation
  assert.ok(
    content.includes('biopulse_public_chat_session_v1'),
    'Public chat must use isolated session storage key'
  );
  assert.ok(
    !content.includes('biopulse_ai_chat_session_v2'),
    'Public chat must NOT touch authenticated companion session key'
  );
});

test('2. PublicFloatingChatbot component satisfies UI and design system requirements', () => {
  const componentPath = path.join(webRoot, 'src', 'components', 'chat', 'PublicFloatingChatbot.tsx');
  assert.ok(fs.existsSync(componentPath), 'PublicFloatingChatbot.tsx must exist');

  const content = fs.readFileSync(componentPath, 'utf8');

  // Floating trigger button positioning at bottom-right
  assert.ok(
    content.includes('fixed bottom-6 md:bottom-8 right-5 sm:right-8 z-40'),
    'Trigger must be positioned at bottom-right corner'
  );

  // Design tokens: Primary teal (#16B8C4), Navy (#073B72), Background (#F5FBFD), Border (#D7EAF2)
  assert.ok(content.includes('#16B8C4'), 'Must use primary teal (#16B8C4)');
  assert.ok(content.includes('#073B72'), 'Must use BioPulse navy (#073B72)');
  assert.ok(content.includes('#D7EAF2'), 'Must use BioPulse border token (#D7EAF2)');
  assert.ok(content.includes('#F5FBFD'), 'Must use BioPulse background token (#F5FBFD)');

  // Icons used
  assert.ok(content.includes('MessageChatCircle'), 'Must use MessageChatCircle icon');
  assert.ok(content.includes('Sparkles'), 'Must use Sparkles icon');

  // Suggested quick questions rendered
  assert.ok(
    content.includes('SUGGESTED_QUICK_QUESTIONS.map'),
    'Must map over suggested quick questions'
  );

  // Streaming text support & typing indicator
  assert.ok(content.includes('isStreaming'), 'Must track streaming status');
  assert.ok(content.includes('AIMessageContent'), 'Must use secure Markdown renderer');

  // Privacy banner & Sign In / Register links
  assert.ok(
    content.includes('To protect your privacy') && content.includes('ROUTES.LOGIN'),
    'Must include privacy redirection to login'
  );
  assert.ok(content.includes('ROUTES.REGISTER'), 'Must include register route link');

  // Clear conversation & Close buttons
  assert.ok(content.includes('handleClearChat'), 'Must support clearing conversation');
  assert.ok(content.includes('XClose'), 'Must include close button');
});

test('3. PublicLayout mounts PublicFloatingChatbot on public homepage and pages', () => {
  const layoutPath = path.join(webRoot, 'src', 'layouts', 'PublicLayout.tsx');
  assert.ok(fs.existsSync(layoutPath), 'PublicLayout.tsx must exist');

  const content = fs.readFileSync(layoutPath, 'utf8');

  assert.ok(
    content.includes("import { PublicFloatingChatbot } from '../components/chat/PublicFloatingChatbot'"),
    'PublicLayout must import PublicFloatingChatbot'
  );
  assert.ok(
    content.includes('{!isAuthPage && <PublicFloatingChatbot />}'),
    'PublicLayout must mount PublicFloatingChatbot when !isAuthPage'
  );
});

test('4. Backend views & safety guardrails enforce strict privacy and zero DB queries', () => {
  const viewsPath = path.join(webRoot, '..', '..', 'backend', 'apps', 'intelligence', 'views.py');
  assert.ok(fs.existsSync(viewsPath), 'views.py must exist');

  const content = fs.readFileSync(viewsPath, 'utf8');

  // Check PublicIntelligenceChatView definition
  assert.ok(content.includes('class PublicIntelligenceChatView(APIView):'), 'Must define PublicIntelligenceChatView');
  assert.ok(content.includes('authentication_classes = []'), 'Public view must have empty authentication_classes');
  assert.ok(content.includes('permission_classes = [AllowAny]'), 'Public view must have AllowAny permission');

  // Check zero HealthContextBuilder usage in PublicIntelligenceChatView
  const publicViewSegment = content.slice(content.indexOf('class PublicIntelligenceChatView'));
  assert.ok(
    !publicViewSegment.includes('HealthContextBuilder.build_context'),
    'Public chat must NEVER call HealthContextBuilder'
  );
  assert.ok(
    !publicViewSegment.includes('supabase_health_service'),
    'Public chat must NEVER call supabase_health_service'
  );

  // Check privacy refusal text
  const guardrailsPath = path.join(
    webRoot,
    '..',
    '..',
    'backend',
    'apps',
    'intelligence',
    'services',
    'safety_guardrails.py'
  );
  const guardrailsContent = fs.readFileSync(guardrailsPath, 'utf8');
  assert.ok(
    guardrailsContent.includes(
      'To protect your privacy, personalized health information is only available after you sign in to your BioPulse account.'
    ),
    'SafetyGuardrails must contain verbatim privacy statement'
  );
});
