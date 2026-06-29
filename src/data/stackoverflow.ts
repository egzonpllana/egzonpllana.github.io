/** Stack Overflow profile summary — update these from your SO profile. */
export const STACK_OVERFLOW = {
  url: 'https://stackoverflow.com/users/7987502/egzon-p',
  reputation: 4808,
  reputationDelta: 50,
  topTag: { name: 'ios', score: 30 },
  nextPrivilege: { name: 'Approve tag wiki edits', at: 5000 },
  badgesTotal: 27,
  /** Best badges, highest tier first. tier: 'gold' | 'silver' | 'bronze'. */
  topBadges: [
    { name: 'Populist', tier: 'gold', count: 1 },
    { name: 'Great Answer', tier: 'gold', count: 1 },
    { name: 'Fanatic', tier: 'gold', count: 1 },
  ],
  newestBadge: 'Yearling',
  nextBadge: { name: 'Excavator', progress: '0/1' },
  impact: {
    peopleReached: '~1.9m',
    postsEdited: 1,
    helpfulFlags: 1,
    votesCast: 501,
  },
  /** Reputation-over-time samples (oldest → newest) for the sparkline. */
  repSeries: [
    4000, 4008, 4016, 4012, 4028, 4070, 4160, 4320, 4500, 4630, 4715, 4768,
    4792, 4803, 4808,
  ],
  /** X-axis year labels shown under the chart. */
  years: ['2023', '2024', '2025', '2026'],
} as const;
