// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROJECTS, SHARED, locate, visibleGroups, visibleProjects } from '../src/lib/adminNav.ts';

test('every page sits in the menu once per project, nothing lost', () => {
  const paths = [...PROJECTS.flatMap(p => p.groups), ...SHARED].flatMap(g => g.tabs.map(t => t.path));
  for (const p of ['/dashboard', '/analytics', '/delegates', '/chairs', '/volunteers', '/forms', '/committees', '/allocation',
    '/schedule', '/resources', '/check-in', '/awards', '/certificates', '/messages', '/debate', '/debate-day', '/judging',
    '/content', '/team', '/accounts', '/seasons', '/activity', '/debate-home', '/debate-site', '/telegram']) {
    assert.ok(paths.includes(p), p);
  }
});

test('locate: unique pages pick their project; shared pages keep the current one', () => {
  assert.equal(locate('/delegates', 'debate')?.project, 'mun');
  assert.equal(locate('/delegates', 'debate')?.group.id, 'applications');
  assert.equal(locate('/debate-day', 'mun')?.project, 'debate');
  assert.equal(locate('/certificates', 'debate')?.group.id, 'dcert');
  assert.equal(locate('/certificates', 'mun')?.group.id, 'results');
  assert.deepEqual([locate('/seasons', 'debate')?.project, locate('/seasons', 'debate')?.group.id], ['debate', 'settings']);
  assert.equal(locate('/telegram', 'debate')?.group.id, 'dtelegram');
  assert.equal(locate('/telegram', 'mun')?.group.id, 'inbox');
  assert.equal(locate('/judging/print', 'mun'), null);
});

test('roles: judge and registration desk get one project, SG gets both', () => {
  assert.deepEqual(visibleProjects('judge').map(p => p.id), ['debate']);
  assert.deepEqual(visibleProjects('judge')[0].groups.map(g => g.id), ['djudge']);
  assert.deepEqual(visibleProjects('registration').map(p => p.id), ['mun']);
  assert.deepEqual(visibleProjects('sg').map(p => p.id), ['mun', 'debate']);
  // Logistics: Home shows only Overview, Applications only Volunteers.
  const l = visibleGroups(PROJECTS[0].groups, 'logistics');
  assert.deepEqual(l.map(g => [g.id, g.tabs.map(t => t.path)]), [['home', ['/dashboard']], ['applications', ['/volunteers']], ['checkin', ['/check-in']]]);
  assert.deepEqual(visibleGroups(SHARED, 'academics'), []);
});
