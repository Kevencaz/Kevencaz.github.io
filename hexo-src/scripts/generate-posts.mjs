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
const count = countArgIdx >= 0 ? Number(args[countArgIdx + 1]) : 50;

if (!Number.isFinite(count) || count <= 0) {
  console.error('Invalid --count');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const postsDir = path.join(repoRoot, 'source', '_posts');
ensureDir(postsDir);

const start = new Date('2019-01-05T10:00:00+08:00');
const end = new Date();
const spanMs = end.getTime() - start.getTime();

const topics = [
  { title: '用 Git 把个人项目管理好：分支、提交与回滚', tags: ['Git', '工程化'], img: 'git-flow.svg' },
  { title: 'HTTP 从建立连接到返回响应：一次请求的完整旅程', tags: ['HTTP', '网络'], img: 'http-lifecycle.svg' },
  { title: '缓存设计入门：Cache Aside、TTL 与一致性取舍', tags: ['缓存', '后端'], img: 'cache.svg' },
  { title: '从 0 到 1 搭建 CI/CD：让部署像提交代码一样简单', tags: ['CI/CD', '工程化'], img: 'pipeline.svg' },
  { title: '前端性能优化清单：从首屏到交互的关键指标', tags: ['前端', '性能'], img: 'pipeline.svg' },
  { title: 'TypeScript 实战：类型收窄、泛型与可维护的接口设计', tags: ['TypeScript', '前端'], img: 'pipeline.svg' },
  { title: 'Node.js 服务稳定性：超时、重试、熔断与降级', tags: ['Node.js', '后端'], img: 'pipeline.svg' },
  { title: 'MySQL 索引与查询优化：从 EXPLAIN 到慢查询治理', tags: ['MySQL', '数据库'], img: 'cache.svg' },
  { title: 'Redis 实战：数据结构选择与常见踩坑', tags: ['Redis', '缓存'], img: 'cache.svg' },
  { title: '日志与链路追踪：如何快速定位线上问题', tags: ['可观测性', '后端'], img: 'pipeline.svg' }
];

for (let i = 0; i < count; i++) {
  const t = topics[i % topics.length];
  const ratio = count <= 1 ? 0 : i / (count - 1);
  const date = new Date(start.getTime() + spanMs * ratio);

  const title = `${t.title}（${String(i + 1).padStart(2, '0')}）`;
  const slug = slugify(title);
  const fileName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${slug}.md`;
  const filePath = path.join(postsDir, fileName);

  const tagLines = t.tags.map((x) => `- ${x}`).join('\n');
  const imgPath = `/images/illustrations/${t.img}`;

  const content = `---\n` +
    `title: ${title}\n` +
    `date: ${formatDate(date)}\n` +
    `tags:\n${tagLines}\n` +
    `---\n\n` +
    `![illustration](${imgPath})\n\n` +
    `这篇文章记录我在实践中的一个小结：\n\n` +
    `- 背景与问题\n` +
    `- 方案推导\n` +
    `- 实现细节\n` +
    `- 常见误区\n` +
    `- 一套可复用的检查清单\n\n` +
    `<!-- more -->\n\n` +
    `## 背景\n\n` +
    `在真实项目里，很多问题并不是“不会写代码”，而是缺少一套稳定的工程方法：可验证、可回滚、可观测。\n\n` +
    `## 方案\n\n` +
    `我通常会把问题拆成三个层面：\n\n` +
    `1. 目标与约束（业务/性能/成本）\n` +
    `2. 关键路径（数据流与依赖）\n` +
    `3. 风险面（边界条件、失败模式、回退策略）\n\n` +
    `## 实现要点\n\n` +
    `- 输入输出要可追踪\n` +
    `- 关键步骤要可度量\n` +
    `- 失败要可恢复\n\n` +
    `## 小结\n\n` +
    `把复杂问题产品化：流程、模板、自动化与复盘。\n`;

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log(`Generated ${count} posts in ${postsDir}`);
