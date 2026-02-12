import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function formatDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function slugify(title) {
  return title
    .replace(/[^0-9A-Za-z\u4e00-\u9fa5]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

const args = process.argv.slice(2);
const countArgIdx = args.findIndex((a) => a === '--count');
const count = countArgIdx >= 0 ? Number(args[countArgIdx + 1]) : 60;

if (!Number.isFinite(count) || count <= 0) {
  console.error('Invalid --count');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const postsDir = path.join(repoRoot, 'source', '_posts');
ensureDir(postsDir);
const existingPosts = fs.readdirSync(postsDir).filter((name) => name.endsWith('.md'));
for (const postName of existingPosts) {
  fs.unlinkSync(path.join(postsDir, postName));
}

const start = new Date('2019-01-05T10:00:00+08:00');
const end = new Date();
const spanMs = end.getTime() - start.getTime();

const topics = [
  {
    title: '用 Git 把个人项目管理好：分支、提交与回滚',
    tags: ['Git', '工程化'],
    img: 'git-branches.svg',
    lead: '把项目当成产品管理，分支策略就是你的时间轴。',
    background: '个人项目最容易丢失上下文：为什么改？改了什么？如何回退？如果提交记录足够清晰，你可以在任何时间重建决策链路。',
    steps: [
      '主干始终可发布，功能分支短周期完成。',
      '提交信息用“动词 + 影响”描述改动目的。',
      '发布点打 tag，回滚用 revert 保留可追溯历史。'
    ],
    codeLang: 'bash',
    snippet: 'git switch -c feat/notes\n# ... edit files\ngit add .\ngit commit -m "feat: add notes outline"\ngit tag v1.2.0\ngit revert <sha>',
    pitfalls: ['长期堆积未合并的分支', '提交信息没有语义', '在公共分支上强推覆盖历史'],
    checklist: ['功能分支 < 3 天完成', '合并前自测并备注风险点', '关键改动写在 commit body']
  },
  {
    title: 'HTTP 从建立连接到返回响应：一次请求的完整旅程',
    tags: ['HTTP', '网络'],
    img: 'network.svg',
    lead: '把链路拆成阶段看，性能瓶颈会非常清晰。',
    background: '一次请求不止是服务端处理那么简单，还包含 DNS、TCP/TLS、代理/CDN、缓存与回源等多个阶段。',
    steps: [
      '拆分阶段：DNS → TCP/TLS → 边缘缓存 → 应用处理 → 数据库。',
      '用 timing 记录每一段耗时，先抓最大头。',
      '对稳定链路启用 keep-alive 与 HTTP/2。'
    ],
    codeLang: 'bash',
    snippet: 'curl -w "DNS:%{time_namelookup} TCP:%{time_connect} TLS:%{time_appconnect} TTFB:%{time_starttransfer}\\n" -o /dev/null -s https://example.com',
    pitfalls: ['只优化应用逻辑忽略网络侧耗时', '缓存命中率低但仍走回源', '监控口径不一致'],
    checklist: ['记录 DNS/TCP/TLS/TTFB', '开启 CDN 缓存与压缩', '对热点接口做压测']
  },
  {
    title: '缓存设计入门：Cache Aside、TTL 与一致性取舍',
    tags: ['缓存', '后端'],
    img: 'layers.svg',
    lead: '缓存不是越多越好，边界和失效策略才是关键。',
    background: '常见问题不是“没有缓存”，而是“缓存命中后数据错了”。一致性与可回退是设计缓存时的核心。',
    steps: [
      '读：先查缓存，未命中再查数据库并回填。',
      '写：先写库，再删缓存（或延迟双删）。',
      '用 TTL + 版本号兜底，避免脏数据无限期存在。'
    ],
    codeLang: 'js',
    snippet: 'const key = `user:${id}`;\nlet data = await cache.get(key);\nif (!data) {\n  data = await db.getUser(id);\n  await cache.set(key, data, { ttl: 300 });\n}\nreturn data;',
    pitfalls: ['热数据写入顺序不当导致脏读', 'TTL 过长放大错误影响', '缓存雪崩未做降级'],
    checklist: ['为热点 Key 设置合理 TTL', '缓存失败时有降级路径', '监控命中率与回源比例']
  },
  {
    title: '从 0 到 1 搭建 CI/CD：让部署像提交代码一样简单',
    tags: ['CI/CD', '工程化'],
    img: 'rocket.svg',
    lead: '部署应该是流水线，而不是手工仪式。',
    background: '把测试、构建、部署标准化后，团队可以把精力放在需求和质量上，而不是频繁救火。',
    steps: [
      '构建 → 单测 → 打包 → 产物入库 → 多环境发布。',
      '把环境差异放进配置，避免人为操作。',
      '发布保留回滚入口，失败时一键切换。'
    ],
    codeLang: 'yaml',
    snippet: 'jobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm test\n      - run: npm run build',
    pitfalls: ['流水线没有质量门禁', '产物与配置混在一起', '发布过程不可回滚'],
    checklist: ['至少一条自动化测试', '产物可复用且可追溯', '每次发布都有回滚方案']
  },
  {
    title: '前端性能优化清单：从首屏到交互的关键指标',
    tags: ['前端', '性能'],
    img: 'speed.svg',
    lead: '首屏快不够，交互顺才是真体验。',
    background: 'LCP、INP、CLS 等核心指标决定了用户是否愿意继续浏览。优化需要先量化，再迭代。',
    steps: [
      '首屏资源拆分：关键 CSS/JS 内联或优先级加载。',
      '图片与字体做懒加载或子集化。',
      '交互侧减少长任务，拆分渲染工作。'
    ],
    codeLang: 'js',
    snippet: 'const loadWidget = () => import("./widget.js");\nrequestIdleCallback(loadWidget);',
    pitfalls: ['只做打包压缩不看实际指标', '未监控核心指标变化', '过度懒加载导致交互抖动'],
    checklist: ['测量 LCP/INP/CLS', '关键链路资源优先级', '首屏 < 2.5s 目标']
  },
  {
    title: 'TypeScript 实战：类型收窄、泛型与可维护的接口设计',
    tags: ['TypeScript', '前端'],
    img: 'type.svg',
    lead: '让类型成为团队协作的“合同”。',
    background: '类型系统的价值不是“写得多”，而是“能提前发现错误并解释设计意图”。',
    steps: [
      '为领域对象建模，避免任意结构随处流动。',
      '用类型守卫做收窄，让控制流更清晰。',
      '抽取泛型，减少重复定义。'
    ],
    codeLang: 'ts',
    snippet: 'type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };\nfunction isOk<T>(r: ApiResult<T>): r is { ok: true; data: T } {\n  return r.ok;\n}',
    pitfalls: ['大量 any 导致类型形同虚设', '类型与实际数据结构脱节', '过度抽象让类型难懂'],
    checklist: ['核心接口有类型覆盖', '类型守卫用于关键分支', '公共类型有注释说明']
  },
  {
    title: 'Node.js 服务稳定性：超时、重试、熔断与降级',
    tags: ['Node.js', '后端'],
    img: 'server.svg',
    lead: '稳定性不是零故障，而是“可恢复”。',
    background: '依赖链路越长，波动越难避免。稳定性工程就是把失败变得可控、可预测、可恢复。',
    steps: [
      '为所有外部调用设置超时与兜底。',
      '重试要有限制，避免雪崩。',
      '熔断触发后主动降级，保核心路径。'
    ],
    codeLang: 'js',
    snippet: 'const controller = new AbortController();\nconst timer = setTimeout(() => controller.abort(), 1500);\nconst res = await fetch(url, { signal: controller.signal });\nclearTimeout(timer);',
    pitfalls: ['超时缺失导致线程堆积', '无限重试放大故障', '降级逻辑与业务耦合太深'],
    checklist: ['核心依赖有超时', '重试次数 <= 2', '关键接口有降级策略']
  },
  {
    title: 'MySQL 索引与查询优化：从 EXPLAIN 到慢查询治理',
    tags: ['MySQL', '数据库'],
    img: 'database.svg',
    lead: '索引是成本与性能的权衡艺术。',
    background: '不合理索引会拖慢写入速度，合理索引能让查询效率提升一个量级。关键在于匹配查询场景。',
    steps: [
      '确认查询模式，先建联合索引再考虑覆盖索引。',
      '用 EXPLAIN 看执行计划，避免全表扫描。',
      '慢查询集中治理，定期归档。'
    ],
    codeLang: 'sql',
    snippet: 'EXPLAIN SELECT id, name FROM users WHERE tenant_id = 2 AND status = 1 ORDER BY created_at DESC LIMIT 20;',
    pitfalls: ['索引列发生隐式类型转换', '只建单列索引但查询走多列', '慢查询没有闭环'],
    checklist: ['慢查询都有 owner', '复合索引与 where 顺序匹配', '写入与查询开销可观测']
  },
  {
    title: 'Redis 实战：数据结构选择与常见踩坑',
    tags: ['Redis', '缓存'],
    img: 'chip.svg',
    lead: '选对数据结构，就是一半性能。',
    background: 'Redis 的优势不只在快，还在数据结构多样。不同业务场景需要不同结构组合。',
    steps: [
      '计数器用 String，排行榜用 ZSet。',
      '大对象拆分成 Hash，避免频繁更新整个对象。',
      '设置合理过期策略，避免内存不可控。'
    ],
    codeLang: 'bash',
    snippet: 'HSET user:42 name "keven" plan "pro"\nZADD leaderboard 120 "user:42"\nEXPIRE user:42 3600',
    pitfalls: ['Key 设计混乱导致扫描困难', '只用 String 忽略 Hash/ZSet 优势', '过期策略缺失'],
    checklist: ['命名统一、可分组', '热 key 有监控', '过期与淘汰策略明确']
  },
  {
    title: '日志与链路追踪：如何快速定位线上问题',
    tags: ['可观测性', '后端'],
    img: 'radar.svg',
    lead: '日志不是堆在一起，而是要能串起来。',
    background: '当问题跨服务时，单点日志很难还原现场。结构化日志与 Trace ID 是排障的核心。',
    steps: [
      '所有服务输出结构化日志，字段一致。',
      '请求入口生成 Trace ID，贯穿链路。',
      '对高频接口做采样与聚合分析。'
    ],
    codeLang: 'json',
    snippet: '{\n  "level": "error",\n  "traceId": "ab12cd34",\n  "service": "order",\n  "msg": "payment timeout",\n  "elapsed": 1480\n}',
    pitfalls: ['日志字段不统一导致不可检索', '无 trace 导致跨服务断链', '报警太多无法分级'],
    checklist: ['Trace ID 全链路透传', '日志可检索且有字段约束', '告警分级与抑制策略']
  }
];

const renderList = (items) => items.map((item) => `- ${item}`).join('\n');
const renderParagraphs = (...lines) => lines.filter(Boolean).join('\n\n');
const pick = (items, idx) => items[idx % items.length];

const angles = [
  {
    name: '性能',
    focus: '缩短响应路径，降低等待时间',
    metric: 'P95/INP/TTFB',
    risk: '只优化局部导致瓶颈迁移'
  },
  {
    name: '稳定性',
    focus: '降低故障率并缩短恢复时间',
    metric: 'SLA/MTTR/错误率',
    risk: '缺少降级兜底引发雪崩'
  },
  {
    name: '成本',
    focus: '用更少资源支撑同样吞吐',
    metric: 'QPS/成本、存储成本',
    risk: '过度优化导致投入失衡'
  },
  {
    name: '协作',
    focus: '让协作可追踪、可回滚',
    metric: '交付周期/回滚次数',
    risk: '规范缺失造成返工'
  }
];

const audiences = ['独立开发者', '2-5 人小团队', '有专职运维支持的团队', '多环境交付团队', '正在扩张的团队'];
const scenarios = ['从 0 到 1 的新项目', '已有系统的重构期', '线上问题频发的阶段', '业务增长带来的容量压力', '需要多端联动的复杂需求'];
const rhythms = ['每周一发布', '双周迭代 + 灰度 24 小时', '紧急修复热更新', '季度里程碑发布', '小步快跑 + 日常回滚演练'];
const titleSuffixes = [
  '实践手册',
  '落地路径',
  '排障清单',
  '复盘要点',
  '项目模板',
  '协作版',
  '性能版',
  '稳定性版',
  '成本优化',
  '团队协作',
  '快速上手',
  '关键细节',
  '常见坑',
  '策略拆解',
  '设计图谱',
  '执行路线',
  '案例复盘',
  '行动指南'
];
const toolkits = [
  ['文档：飞书/Notion 需求记录', '监控：Grafana + Prometheus', '告警：Sentry/自定义报警'],
  ['流水线：GitHub Actions', '性能：Lighthouse/DevTools', '质量：ESLint/单测'],
  ['压测：k6/Locust', '日志：ELK/ClickHouse', '链路：OpenTelemetry'],
  ['协作：Jira/禅道', '发布：灰度开关/特性开关', '回滚：可切换版本包'],
  ['分析：SQL/BI 报表', '缓存：Redis/Cloudflare', '观测：Datadog/Arms']
];

for (let i = 0; i < count; i++) {
  const t = topics[i % topics.length];
  const ratio = count <= 1 ? 0 : i / (count - 1);
  const date = new Date(start.getTime() + spanMs * ratio);

  const angle = pick(angles, i);
  const audience = pick(audiences, i);
  const scenario = pick(scenarios, i);
  const rhythm = pick(rhythms, i);
  const toolkit = pick(toolkits, i);
  const titleStem = t.title.split('：')[0] || t.title;
  const titleSuffix = pick(titleSuffixes, i);

  const title = `${t.title}｜${titleSuffix}`;
  const slug = slugify(title);
  const fileName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${slug}.md`;
  const filePath = path.join(postsDir, fileName);

  const tagLines = t.tags.map((x) => `- ${x}`).join('\n');
  const imgPath = `/images/illustrations/${t.img}`;

  const intro = renderParagraphs(
    `这篇面向${audience}，从${angle.name}视角拆解${titleStem}，目标是${angle.focus}。`,
    `我们先统一指标（${angle.metric}），再把动作拆成可验证步骤。`
  );

  const baseSections = [
    `![illustration](${imgPath})`,
    '',
    `> ${t.lead}`,
    '',
    '<!-- more -->',
    '',
    intro,
    ''
  ];

  let sections = [];
  switch (i % 3) {
    case 0:
      sections = [
        '## 背景',
        '',
        renderParagraphs(
          t.background,
          `在${scenario}阶段，最容易忽视的是${angle.risk}，先对齐度量口径能减少返工。`
        ),
        '',
        '## 方法拆解',
        '',
        renderList(t.steps),
        '',
        '## 关键指标',
        '',
        renderList([
          `核心指标：${angle.metric}`,
          `目标：${angle.focus}`,
          '验证方式：上线后 7 天回看趋势'
        ]),
        '',
        '## 示例',
        '',
        `~~~${t.codeLang || 'bash'}`,
        t.snippet,
        '~~~',
        '',
        '## 常见误区',
        '',
        renderList([...t.pitfalls, angle.risk]),
        '',
        '## 工具与资料',
        '',
        renderList(toolkit),
        '',
        '## Checklist',
        '',
        renderList([...t.checklist, `节奏：${rhythm}`]),
        ''
      ];
      break;
    case 1:
      sections = [
        '## 场景画像',
        '',
        renderParagraphs(
          `典型场景是「${scenario}」与「${audience}」并存：目标快速迭代，但资源有限。`,
          `我们从${angle.name}视角拆解 ${titleStem}，先锁定${angle.metric}，再逐层拆解改动点。`
        ),
        '',
        '## 目标与指标',
        '',
        renderList([
          `目标：${angle.focus}`,
          `衡量口径：${angle.metric}`,
          '复盘节奏：每次发布后复盘一次'
        ]),
        '',
        '## 方案路径',
        '',
        renderList(t.steps),
        '',
        '## 小型案例',
        '',
        '下面的片段可作为最小闭环示例：',
        '',
        `~~~${t.codeLang || 'bash'}`,
        t.snippet,
        '~~~',
        '',
        '## 取舍与边界',
        '',
        renderList([
          `如果只追求${angle.name}，可能带来新的风险：${angle.risk}`,
          '把复杂度锁在工具或中间层，避免侵入业务核心',
          '优先保证可回滚，再谈极致优化'
        ]),
        '',
        '## 落地节奏',
        '',
        renderList([
          `建议节奏：${rhythm}`,
          '先小范围灰度，再扩大覆盖',
          '每一步都要有可观察数据'
        ]),
        '',
        '## 工具清单',
        '',
        renderList(toolkit),
        ''
      ];
      break;
    default:
      sections = [
        '## 问题拆分',
        '',
        renderParagraphs(
          t.background,
          `当团队是${audience}规模时，问题往往不是“不会做”，而是“难以复用”。`
        ),
        '',
        '## 设计原则',
        '',
        renderList([
          `目标清晰：围绕${angle.metric}建立一致口径`,
          '拆分步骤可验证、可回滚',
          `权衡边界：避免${angle.risk}`
        ]),
        '',
        '## 分步实施',
        '',
        renderList(t.steps),
        '',
        '## 关键细节',
        '',
        renderParagraphs(
          `在执行${titleStem}时，建议把日志和监控作为“第二视角”，及时发现偏差。`,
          `如果资源有限，优先把${angle.focus}放在最靠近用户的路径上。`
        ),
        '',
        '## 常见误区',
        '',
        renderList(t.pitfalls),
        '',
        '## 下一步建议',
        '',
        renderList([
          `把${rhythm}固定为节奏约束，形成习惯`,
          `补齐工具链：${toolkit[0]} + ${toolkit[1]}`,
          '为关键环节写一份可复用的检查清单'
        ]),
        '',
        '## Checklist',
        '',
        renderList(t.checklist),
        ''
      ];
      break;
  }

  const body = baseSections.concat(sections).join('\n');
  const content = `---\n` +
    `title: ${title}\n` +
    `date: ${formatDate(date)}\n` +
    `tags:\n${tagLines}\n` +
    `---\n\n` +
    body;

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log(`Generated ${count} posts in ${postsDir}`);
