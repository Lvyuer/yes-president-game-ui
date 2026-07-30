import {
  PORT_STRIKE_FTUBE,
  PORT_STRIKE_FTUBE_REOPEN,
  PORT_STRIKE_REOPEN_VIDEO_SRC,
  PORT_STRIKE_VIDEO_SRC,
  type FtubeEpisode,
} from './casePortStrike';
import portStrikeThumb from './assets/ftube-port-strike-thumb.png';
import portReopenThumb from './assets/ftube-port-reopen-thumb.png';

export type FtubeTopicTier = 'story' | 'ambient';

export type FtubeComment = {
  id: string;
  user: string;
  text: string;
  timeLabel: string;
  likes?: number;
};

export type FtubeTopic = {
  id: string;
  tier: FtubeTopicTier;
  title: string;
  summary: string;
  /** Optional CSS accent for list thumb placeholder */
  thumbTone: string;
  /** Real preview image (video frame / poster) */
  thumb?: string;
  tag?: string;
  video?: string;
  facts?: string[];
  comments: FtubeComment[];
  playerLabel?: string;
  /** Show from crisis stage onward */
  availableFrom: 'crisis' | 'reopen';
};

const AMBIENT_COMMENTS: FtubeComment[] = [
  {
    id: 'a1',
    user: '路过看一眼',
    text: '剪辑还行。先存。',
    timeLabel: '12 分钟前',
    likes: 26,
  },
  {
    id: 'a2',
    user: '夜猫子电台',
    text: '评论区这么安静？我坐第一个。',
    timeLabel: '28 分钟前',
    likes: 11,
  },
  {
    id: 'a3',
    user: '普通观众甲',
    text: '有后续吗？关注了。',
    timeLabel: '1 小时前',
    likes: 8,
  },
  {
    id: 'a4',
    user: '刷到就是缘分',
    text: '画质还行，声音再大声点更好。',
    timeLabel: '2 小时前',
    likes: 5,
  },
];

export const FTUBE_TOPICS: FtubeTopic[] = [
  {
    id: 'port-strike',
    tier: 'story',
    title: PORT_STRIKE_FTUBE.headline,
    summary: '副总统游艇行程与水利署调水叠加，东部港口陷入封锁。',
    thumbTone: '#1e3a5f',
    thumb: portStrikeThumb,
    tag: 'LIVE',
    video: PORT_STRIKE_VIDEO_SRC,
    facts: [...PORT_STRIKE_FTUBE.facts],
    playerLabel: PORT_STRIKE_FTUBE.videoCaption,
    availableFrom: 'crisis',
    comments: [
      {
        id: 'c1',
        user: '码头夜班老周',
        text: '我们在闸口站三天。副总统在船上。谁拍的？好镜头。',
        timeLabel: '3 分钟前',
        likes: 1284,
      },
      {
        id: 'c2',
        user: '航运情报站',
        text: '18 小时排队。车不动，货不动，账单照来。',
        timeLabel: '8 分钟前',
        likes: 862,
      },
      {
        id: 'c3',
        user: '普通纳税人',
        text: '等下，所以政府真的为了家庭行程调水？',
        timeLabel: '15 分钟前',
        likes: 2401,
      },
      {
        id: 'c4',
        user: '工会观察员',
        text: '别直播了。加班费在哪？道歉在哪？',
        timeLabel: '22 分钟前',
        likes: 977,
      },
      {
        id: 'c5',
        user: '东部港区志愿队',
        text: '现场雾大。安保快艇和游艇都在。自己看。',
        timeLabel: '41 分钟前',
        likes: 533,
      },
      {
        id: 'c6',
        user: '财经早报留言区',
        text: '供应链断一天，价格就先动。',
        timeLabel: '1 小时前',
        likes: 701,
      },
      {
        id: 'c7',
        user: '匿名码头工人',
        text: '先让人回家睡觉，再谈考察行程。',
        timeLabel: '1 小时前',
        likes: 1560,
      },
      {
        id: 'c8',
        user: '媒体校对君',
        text: '圆厅还在睡吗，还是在写“安全需求”？',
        timeLabel: '2 小时前',
        likes: 219,
      },
    ],
  },
  {
    id: 'port-reopen',
    tier: 'story',
    title: PORT_STRIKE_FTUBE_REOPEN.headline,
    summary: '补偿令落地后闸口恢复通行，工人陆续返岗。',
    thumbTone: '#1a4d3a',
    thumb: portReopenThumb,
    tag: '现场',
    video: PORT_STRIKE_REOPEN_VIDEO_SRC,
    facts: [...PORT_STRIKE_FTUBE_REOPEN.facts],
    playerLabel: PORT_STRIKE_FTUBE_REOPEN.videoCaption,
    availableFrom: 'reopen',
    comments: [
      {
        id: 'c1',
        user: '闸口值班员',
        text: '吊机响了。终于。',
        timeLabel: '2 分钟前',
        likes: 644,
      },
      {
        id: 'c2',
        user: '卡车司机老金',
        text: '排队短了。钱到账了吗？',
        timeLabel: '9 分钟前',
        likes: 891,
      },
      {
        id: 'c3',
        user: '港口志愿者',
        text: '闸口开了。下次别为了一条船调水。',
        timeLabel: '18 分钟前',
        likes: 512,
      },
      {
        id: 'c4',
        user: '外贸小老板',
        text: '货能走就行。仓储费再拖两天我撑不住。',
        timeLabel: '35 分钟前',
        likes: 377,
      },
      {
        id: 'c5',
        user: '时政吃瓜协会',
        text: '复工视频看起来像危机公关。挺圆厅。',
        timeLabel: '52 分钟前',
        likes: 290,
      },
      {
        id: 'c6',
        user: '一线叉车工',
        text: '人回来了。设备热了。下一班我顶上。',
        timeLabel: '1 小时前',
        likes: 458,
      },
    ],
  },
  {
    id: 'market-open',
    tier: 'ambient',
    title: '早盘速览：能源与航运板块震荡',
    summary: '港口封锁消息扩散后，航运期货早盘波动加大，分析师呼吁关注供应链风险。',
    thumbTone: '#3d2a1a',
    tag: '财经',
    availableFrom: 'crisis',
    comments: [
      ...AMBIENT_COMMENTS,
      {
        id: 'm1',
        user: '盘感选手',
        text: '航运一抖，我账户也跟着抖。',
        timeLabel: '6 分钟前',
        likes: 44,
      },
    ],
  },
  {
    id: 'weather-coast',
    tier: 'ambient',
    title: '东部沿海大雾预警延长至夜间',
    summary: '气象台称大雾将影响部分港口作业窗口，建议船舶谨慎航行。',
    thumbTone: '#1a2d3d',
    tag: '天气',
    availableFrom: 'crisis',
    comments: [
      ...AMBIENT_COMMENTS,
      {
        id: 'w1',
        user: '沿海通勤族',
        text: '大雾天出门，能见度离谱。像进了单机游戏。',
        timeLabel: '19 分钟前',
        likes: 63,
      },
    ],
  },
  {
    id: 'cabinet-brief',
    tier: 'ambient',
    title: '内阁例会：本周将通报基础设施进展',
    summary: '圆厅日程显示例会将讨论交通与港口相关议题，具体内容尚未公开。',
    thumbTone: '#2a1a3d',
    tag: '时政',
    availableFrom: 'crisis',
    comments: [
      ...AMBIENT_COMMENTS,
      {
        id: 'p1',
        user: '议程猎人',
        text: '通报归通报。有没有实质方案，另说。',
        timeLabel: '40 分钟前',
        likes: 37,
      },
    ],
  },
  {
    id: 'sports-night',
    tier: 'ambient',
    title: '今夜赛事：联赛焦点战前瞻',
    summary: '两支争冠球队将在主场相遇，转播窗口已排定黄金时段。',
    thumbTone: '#1a3d2a',
    tag: '体育',
    availableFrom: 'crisis',
    comments: [
      ...AMBIENT_COMMENTS,
      {
        id: 's1',
        user: '夜场球迷',
        text: '黄金时段开球，零食已就位。',
        timeLabel: '5 分钟前',
        likes: 72,
      },
    ],
  },
];

export function requiredTopicIdForEpisode(episode: FtubeEpisode): string {
  return episode === 'reopen' ? 'port-reopen' : 'port-strike';
}

export function topicsForEpisode(episode: FtubeEpisode): FtubeTopic[] {
  return FTUBE_TOPICS.filter((topic) => {
    if (topic.availableFrom === 'reopen') return episode === 'reopen';
    return true;
  }).sort((a, b) => {
    const req = requiredTopicIdForEpisode(episode);
    if (a.id === req) return -1;
    if (b.id === req) return 1;
    if (a.tier !== b.tier) return a.tier === 'story' ? -1 : 1;
    return 0;
  });
}

export function getFtubeTopic(id: string): FtubeTopic | undefined {
  return FTUBE_TOPICS.find((t) => t.id === id);
}
