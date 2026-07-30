import { computed, ref } from 'vue';
import {
  PORT_STRIKE_FILLER_TRENDS,
  PORT_STRIKE_NPC_POSTS,
  YACHT_WEEK1_FILLER_TRENDS,
  YACHT_WEEK1_NPC_POSTS,
  type FNpcPostSeed,
} from './casePortStrike';

export type FFeedTheme = 'port-strike' | 'yacht-week1';

export type FPostMetrics = {
  comments: number;
  reposts: number;
  likes: number;
};

export type FPost = {
  id: string;
  authorName: string;
  authorHandle: string;
  avatarKey: string;
  text: string;
  createdAt: number;
  isPlayer: boolean;
  metrics: FPostMetrics;
};

export type FTrendItem = {
  rank: number;
  text: string;
  linkedPostId: string | null;
  heat: number;
};

const FEED_PAGE = 8;
/** Soft cap only to avoid unbounded DOM; still plenty for continuous scrolling. */
const FEED_MAX = 120;
const TREND_SIZE = 5;
const TREND_TEXT_MAX = 42;

const PLAYER_AUTHOR = {
  authorName: '总统',
  authorHandle: 'POTUS',
  avatarKey: 'player',
} as const;

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

function fakeMetrics(scale = 1): FPostMetrics {
  return {
    comments: Math.round(randInt(12, 420) * scale),
    reposts: Math.round(randInt(8, 680) * scale),
    likes: Math.round(randInt(40, 4200) * scale),
  };
}

function seedToPost(seed: FNpcPostSeed, createdAt: number): FPost {
  return {
    id: seed.id,
    authorName: seed.authorName,
    authorHandle: seed.authorHandle,
    avatarKey: seed.id,
    text: seed.text,
    createdAt,
    isPlayer: false,
    metrics: fakeMetrics(),
  };
}

export function truncateTrendText(text: string, max = TREND_TEXT_MAX): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/**
 * Session-scoped F social store for the port-strike playground.
 * Survives leaving/re-entering the F app within one page load.
 */
const posts = ref<FPost[]>([]);
const trends = ref<FTrendItem[]>([]);
const playerPostId = ref<string | null>(null);
const hydrated = ref(false);
const feedTheme = ref<FFeedTheme>('port-strike');

function npcPool(): FNpcPostSeed[] {
  return feedTheme.value === 'yacht-week1' ? YACHT_WEEK1_NPC_POSTS : PORT_STRIKE_NPC_POSTS;
}

function trendFillers(): string[] {
  return feedTheme.value === 'yacht-week1' ? YACHT_WEEK1_FILLER_TRENDS : PORT_STRIKE_FILLER_TRENDS;
}

function buildTrendsFromPlayer(player: FPost | null): FTrendItem[] {
  const fillers = shuffle(trendFillers());
  const items: FTrendItem[] = [];

  if (player) {
    items.push({
      rank: 1,
      text: truncateTrendText(player.text),
      linkedPostId: player.id,
      heat: randInt(180000, 420000),
    });
  }

  let rank = items.length + 1;
  for (const line of fillers) {
    if (items.length >= TREND_SIZE) break;
    items.push({
      rank,
      text: line,
      linkedPostId: null,
      heat: randInt(12000, 160000) - rank * 8000,
    });
    rank += 1;
  }

  return items;
}

export function useFSocialStore() {
  const playerPost = computed(
    () => posts.value.find((p) => p.id === playerPostId.value) ?? null,
  );

  function drawNpcPosts(count = FEED_PAGE): FPost[] {
    const pool = shuffle(npcPool());
    const now = Date.now();
    return pool.slice(0, count).map((seed, index) => seedToPost(seed, now - index * 60_000));
  }

  function composeFeed(npcBatch: FPost[]): FPost[] {
    const player = playerPost.value;
    if (!player) return npcBatch;
    const withoutDup = npcBatch.filter((p) => !p.isPlayer);
    return [player, ...withoutDup];
  }

  function ensureHydrated() {
    if (hydrated.value) return;
    // Start with two pages so the feed is immediately scrollable.
    posts.value = composeFeed([
      ...drawNpcPosts(FEED_PAGE),
      ...drawNpcPosts(FEED_PAGE).map((p, i) => ({
        ...p,
        id: `${p.id}-b${i}`,
      })),
    ]);
    trends.value = buildTrendsFromPlayer(playerPost.value);
    hydrated.value = true;
  }

  /** Switch feed theme; resets NPC pool so W1 does not spoil port strike. */
  function setFeedTheme(theme: FFeedTheme) {
    if (feedTheme.value === theme && hydrated.value) return;
    feedTheme.value = theme;
    posts.value = [];
    trends.value = [];
    // Keep player post id; it will reappear on next hydrate if still desired.
    hydrated.value = false;
    ensureHydrated();
  }

  /** Pull-to-refresh: reshuffle the visible NPC batch, keep player post on top. */
  function refreshFeed() {
    ensureHydrated();
    posts.value = composeFeed(drawNpcPosts(FEED_PAGE));
  }

  /** Infinite scroll: append more NPC posts while scrolling down. */
  function appendFeed(count = FEED_PAGE): boolean {
    ensureHydrated();
    if (posts.value.length >= FEED_MAX) return false;
    const room = FEED_MAX - posts.value.length;
    const take = Math.min(count, room);
    const now = Date.now();
    const batch = shuffle(npcPool())
      .slice(0, take)
      .map((seed, index) => ({
        ...seedToPost(seed, now - index * 45_000),
        id: `${seed.id}-${now}-${index}`,
      }));
    if (!batch.length) return false;
    posts.value = [...posts.value, ...batch];
    return true;
  }

  function publishPlayerPost(text: string): FPost {
    ensureHydrated();
    const content = text.trim();
    const post: FPost = {
      id: `player-${Date.now()}`,
      ...PLAYER_AUTHOR,
      text: content,
      createdAt: Date.now(),
      isPlayer: true,
      metrics: fakeMetrics(2.4),
    };
    playerPostId.value = post.id;
    const others = posts.value.filter((p) => !p.isPlayer);
    posts.value = [post, ...others];
    trends.value = buildTrendsFromPlayer(post);
    return post;
  }

  /** 插入热搜首位（事件驱动，如 TECH 异动 / 内幕曝光）。 */
  function pushTrend(text: string, heat = randInt(90_000, 220_000)) {
    ensureHydrated();
    const label = text.trim().startsWith('#') ? text.trim() : `#${text.trim()}`;
    const item: FTrendItem = {
      rank: 1,
      text: truncateTrendText(label),
      linkedPostId: null,
      heat,
    };
    const rest = trends.value.slice(0, TREND_SIZE - 1).map((entry, index) => ({
      ...entry,
      rank: index + 2,
    }));
    trends.value = [item, ...rest];
  }

  /** Dev / preview reset if needed. */
  function resetFSocial() {
    posts.value = [];
    trends.value = [];
    playerPostId.value = null;
    hydrated.value = false;
    feedTheme.value = 'port-strike';
  }

  return {
    posts,
    trends,
    playerPostId,
    playerPost,
    feedTheme,
    ensureHydrated,
    setFeedTheme,
    refreshFeed,
    appendFeed,
    publishPlayerPost,
    pushTrend,
    resetFSocial,
  };
}
