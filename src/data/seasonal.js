/*
 * Seasonal storefront touches.
 *
 * Christmas: snowfall over the home-page hero, hanging ornaments and a festive
 * greeting band. Set `enabled: false` to switch it off early; it also switches
 * itself off after `until` (inclusive, YYYY-MM-DD) so it never lingers.
 */
export const CHRISTMAS = {
  enabled: true,
  until: '2027-01-06',
};

export const isChristmasSeason = (now = new Date()) =>
  CHRISTMAS.enabled && now.toISOString().slice(0, 10) <= CHRISTMAS.until;
