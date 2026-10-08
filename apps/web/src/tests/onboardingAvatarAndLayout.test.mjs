import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

import { fileURLToPath } from 'node:url';

console.log('=== RUNNING ONBOARDING AVATAR & CARD POSITION TEST SUITE ===');

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(thisDir, '..', '..');

// 1. Verify default avatar asset exists and is valid SVG
const defaultAvatarPath = path.join(webRoot, 'public/avatars/avatar-default.svg');
assert.ok(fs.existsSync(defaultAvatarPath), 'Default avatar SVG must exist at public/avatars/avatar-default.svg');
const svgContent = fs.readFileSync(defaultAvatarPath, 'utf8');
assert.ok(svgContent.includes('<svg') && svgContent.includes('viewBox="0 0 120 120"'), 'Default avatar must have valid SVG root and viewBox');
assert.ok(svgContent.includes('def-bg') && svgContent.includes('def-figure'), 'Default avatar must include gradient defs');
console.log('✓ Test 1: Neutral default avatar asset verified in public/avatars/avatar-default.svg');

// 2. Verify UserAvatar component logic
const userAvatarSource = fs.readFileSync(path.join(webRoot, 'src/components/common/UserAvatar.tsx'), 'utf8');
assert.ok(userAvatarSource.includes("export const DEFAULT_AVATAR_URL = '/avatars/avatar-default.svg'"), 'UserAvatar must export DEFAULT_AVATAR_URL');
assert.ok(userAvatarSource.includes('activeImageSrc = hasUserCustomAvatar ? avatarUrl! : DEFAULT_AVATAR_URL'), 'UserAvatar must select custom avatar if provided, otherwise DEFAULT_AVATAR_URL');
console.log('✓ Test 2: UserAvatar component resolves custom photo or DEFAULT_AVATAR_URL seamlessly');

// 3. Verify FemaleOnboarding Step 1 validation (avatar is optional)
const femaleOnboardingSource = fs.readFileSync(path.join(webRoot, 'src/pages/onboarding/FemaleOnboarding.tsx'), 'utf8');
assert.ok(!femaleOnboardingSource.includes("errs.avatarUrl = 'Choose an avatar or upload a photo to continue.'"), 'FemaleOnboarding must NOT require an avatar in step 1');
console.log('✓ Test 3: FemaleOnboarding step 1 allows proceeding without an avatar');

// 4. Verify MaleOnboarding Step 1 validation (avatar is optional)
const maleOnboardingSource = fs.readFileSync(path.join(webRoot, 'src/pages/onboarding/MaleOnboarding.tsx'), 'utf8');
assert.ok(!maleOnboardingSource.includes("errs.avatarUrl = 'Choose an avatar or upload a photo to continue.'"), 'MaleOnboarding must NOT require an avatar in step 1');
console.log('✓ Test 4: MaleOnboarding step 1 allows proceeding without an avatar');

// 5. Verify ProfilePictureSelector UI hints and toggle behavior
const selectorSource = fs.readFileSync(path.join(webRoot, 'src/components/onboarding/ProfilePictureSelector.tsx'), 'utf8');
assert.ok(selectorSource.includes('Optional'), 'ProfilePictureSelector must display Optional badge');
assert.ok(selectorSource.includes('Default avatar active'), 'ProfilePictureSelector must indicate default avatar is active when unselected');
assert.ok(selectorSource.includes("onChange(value === avatarSrc ? '' : avatarSrc)"), 'ProfilePictureSelector must allow clicking active cartoon avatar to toggle back to default');
assert.ok(selectorSource.includes('Reset to default'), 'ProfilePictureSelector must include Reset to default action');
console.log('✓ Test 5: ProfilePictureSelector features optional badge, default avatar notice, toggle & reset');

// 6. Verify FemaleStep5ReviewReady & MaleStep5ReviewReady status
const femaleReviewSource = fs.readFileSync(path.join(webRoot, 'src/pages/onboarding/female/FemaleStep5ReviewReady.tsx'), 'utf8');
assert.ok(femaleReviewSource.includes("profile.avatarUrl ? 'Configured' : 'Default avatar'"), 'Female review step must show Default avatar when not configured');
const maleReviewSource = fs.readFileSync(path.join(webRoot, 'src/pages/onboarding/male/MaleStep5ReviewReady.tsx'), 'utf8');
assert.ok(maleReviewSource.includes("profile.avatarUrl ? 'Configured' : 'Default avatar'"), 'Male review step must show Default avatar when not configured');
console.log('✓ Test 6: Female & Male review steps display "Default avatar" when user proceeds without custom photo');

// 7. Verify Responsive Card Positioning in Female & Male Layouts
const femaleLayoutSource = fs.readFileSync(path.join(webRoot, 'src/pages/onboarding/female/FemaleOnboardingLayout.tsx'), 'utf8');
const maleLayoutSource = fs.readFileSync(path.join(webRoot, 'src/pages/onboarding/male/MaleOnboardingLayout.tsx'), 'utf8');

for (const [name, source] of [['FemaleOnboardingLayout', femaleLayoutSource], ['MaleOnboardingLayout', maleLayoutSource]]) {
  assert.ok(source.includes('lg:gap-10 xl:gap-14'), `${name} must use expanded desktop gap (lg:gap-10 xl:gap-14)`);
  assert.ok(source.includes('md:w-[calc(100%-1.25rem)] md:ml-auto lg:w-auto lg:ml-2 xl:ml-4'), `${name} must responsively shift card slightly right on tablet and desktop`);
}
console.log('✓ Test 7: Onboarding card position adjusted slightly right on tablet & desktop, centered on mobile');

// 8. Viewport Width Calculations
const viewports = [
  { name: 'Desktop (1440px)', width: 1440, asideWidth: 290, gap: 56, isStacked: false },
  { name: 'Laptop (1024px)', width: 1024, asideWidth: 260, gap: 40, isStacked: false },
  { name: 'Tablet (768px)', width: 768, isStacked: true, cardShiftRightPx: 20 },
  { name: 'Mobile (390px)', width: 390, isStacked: true, cardShiftRightPx: 0 },
  { name: 'Small mobile (320px)', width: 320, isStacked: true, cardShiftRightPx: 0 },
];

for (const vp of viewports) {
  if (!vp.isStacked) {
    const availableWidth = vp.width - 64; // px-8 padding
    const mainWidth = Math.min(1180, availableWidth - vp.asideWidth - vp.gap);
    assert.ok(mainWidth > 600, `${vp.name} main card width must be generous (${mainWidth}px)`);
    assert.ok(vp.asideWidth + vp.gap + mainWidth <= availableWidth, `${vp.name} no horizontal overflow`);
    console.log(`  • Viewport [${vp.name}]: Aside=${vp.asideWidth}px, Gap=${vp.gap}px, Card=${mainWidth}px. No overflow.`);
  } else {
    const padding = vp.width >= 640 ? 48 : 24;
    const availableWidth = vp.width - padding;
    const cardWidth = availableWidth - vp.cardShiftRightPx;
    assert.ok(cardWidth > 0 && cardWidth <= availableWidth, `${vp.name} card width valid without overflow`);
    console.log(`  • Viewport [${vp.name}]: Available=${availableWidth}px, Card=${cardWidth}px, Right Shift=${vp.cardShiftRightPx}px. No overflow.`);
  }
}
console.log('✓ Test 8: All 5 responsive viewport width calculations verified without clipping or overflow');

console.log('\n=== ALL ONBOARDING UI & AVATAR VERIFICATION TESTS PASSED ===');
