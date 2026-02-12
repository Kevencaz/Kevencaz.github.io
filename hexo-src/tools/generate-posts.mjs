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
    lead: '把项目当成产品管理，分支策略就是你的时间轴。',
    background: `很多开发者在个人项目中不重视版本管理，觉得"就自己一个人用，随便提交就行"。但当项目规模增长、需要回溯某个决策、或者想在多台设备间同步时，混乱的提交历史会让你寸步难行。Git 不只是团队协作工具，它更是个人项目的"时间机器"。一个清晰的提交历史，就像一本项目日记，记录了每一次思考和决策。`,
    sections: {
      why: `为什么个人项目也需要规范的 Git 工作流？答案很简单：你未来的自己就是你的"队友"。三个月后回看代码，如果提交信息全是"update"和"fix"，你根本无法理解当时的上下文。好的分支策略能让你同时推进多个想法而互不干扰，好的提交规范能让你快速定位任何一次改动的原因。`,
      how: `首先，确立主干保护原则：main 分支始终保持可运行状态，所有开发在功能分支上进行。分支命名采用 feat/xxx、fix/xxx、refactor/xxx 的前缀约定，一眼就能看出分支目的。每个功能分支的生命周期控制在 1-3 天，避免长期分支带来的合并冲突。

提交信息遵循 Conventional Commits 规范：类型(范围): 描述。比如 feat(auth): add JWT token refresh、fix(api): handle timeout in retry logic。这不仅让历史可读，还能自动生成 CHANGELOG。

对于重要的里程碑，使用 git tag 标记版本号。当需要回退时，优先使用 git revert 而非 git reset，因为 revert 会保留完整的操作历史，让回退本身也是可追溯的。`,
      practice: `实际操作中，建议配置 .gitignore 模板（可以用 gitignore.io 生成），设置 git hooks 做提交前检查（比如 lint-staged + husky），以及定期用 git log --oneline --graph 审视分支结构。如果你用 VS Code，GitLens 插件能让历史浏览变得非常直观。`,
      mistakes: `最常见的错误是在 main 分支上直接开发，导致半成品代码混入主干。其次是提交粒度不当——要么一个提交包含了十几个文件的改动，要么每改一行就提交一次。理想的提交粒度是"一个逻辑完整的改动"，比如"添加用户注册表单验证"而不是"改了几个文件"。另一个常见问题是忘记推送到远程，本地硬盘一坏，所有历史都没了。`
    },
    codeLang: 'bash',
    snippet: `# 创建功能分支
git switch -c feat/user-auth

# 开发完成后，规范提交
git add .
git commit -m "feat(auth): implement login with email verification"

# 合并回主干
git switch main
git merge --no-ff feat/user-auth
git tag v1.2.0 -m "Release: user authentication"

# 如果需要回退
git revert HEAD --no-edit
git push origin main --tags`
  },
  {
    title: 'HTTP 从建立连接到返回响应：一次请求的完整旅程',
    tags: ['HTTP', '网络'],
    lead: '把链路拆成阶段看，性能瓶颈会非常清晰。',
    background: `当你在浏览器地址栏输入一个 URL 并按下回车，背后发生的事情远比你想象的复杂。从 DNS 解析到 TCP 握手，从 TLS 协商到 HTTP 请求发送，再到服务器处理、响应传输、浏览器渲染——每一个环节都可能成为性能瓶颈。理解这条完整链路，是做性能优化的基础。`,
    sections: {
      why: `很多开发者在排查"页面加载慢"的问题时，第一反应是优化后端接口。但实际上，网络层面的耗时往往占了总时间的大头。DNS 解析可能花 50-200ms，TCP 握手需要一个 RTT，TLS 1.2 还要额外两个 RTT。如果服务器在海外，光是网络往返就可能超过 500ms。不了解完整链路，优化就像蒙着眼睛射箭。`,
      how: `一次完整的 HTTP 请求可以拆分为以下阶段：

1. DNS 解析：浏览器查询域名对应的 IP 地址，依次检查浏览器缓存、系统缓存、路由器缓存、ISP DNS 服务器。
2. TCP 连接：通过三次握手建立可靠连接。如果是 HTTPS，还需要 TLS 握手协商加密参数。
3. 请求发送：浏览器构造 HTTP 请求报文（方法、路径、头部、Body），通过已建立的连接发送。
4. 服务器处理：Web 服务器接收请求，经过路由、中间件、业务逻辑、数据库查询等处理。
5. 响应传输：服务器将响应数据分块传输回客户端。
6. 浏览器渲染：解析 HTML、构建 DOM、加载 CSS/JS、布局绘制。

每个阶段都有对应的优化手段：DNS 预解析（dns-prefetch）、连接复用（keep-alive）、HTTP/2 多路复用、CDN 就近访问、Gzip/Brotli 压缩、浏览器缓存策略等。`,
      practice: `用 Chrome DevTools 的 Network 面板可以看到每个请求的 Timing 分解。curl 的 -w 参数也能输出各阶段耗时。建议在关键页面设置 Performance Budget，用 Lighthouse CI 在流水线中自动检测。对于 API 接口，在网关层记录 TTFB（Time To First Byte）作为核心监控指标。`,
      mistakes: `常见误区包括：只关注接口响应时间而忽略网络传输耗时；没有开启 HTTP/2 导致队头阻塞；缓存策略设置不当导致每次都回源；CDN 配置了但缓存命中率很低；以及忽略了 DNS 解析时间——特别是使用了多个第三方域名的页面。`
    },
    codeLang: 'bash',
    snippet: `# 查看完整请求各阶段耗时
curl -w "DNS:      %{time_namelookup}s\\nTCP:      %{time_connect}s\\nTLS:      %{time_appconnect}s\\nTTFB:     %{time_starttransfer}s\\nTotal:    %{time_total}s\\nSize:     %{size_download} bytes\\n" \\
     -o /dev/null -s https://example.com

# DNS 预解析 (HTML 中添加)
# <link rel="dns-prefetch" href="//api.example.com">
# <link rel="preconnect" href="//cdn.example.com">`
  },
  {
    title: '缓存设计入门：Cache Aside、TTL 与一致性取舍',
    tags: ['缓存', '后端'],
    lead: '缓存不是越多越好，边界和失效策略才是关键。',
    background: `缓存是后端系统中最常用的性能优化手段，但也是最容易出问题的地方。"缓存一时爽，一致性火葬场"这句话虽然夸张，但确实反映了现实。很多线上事故的根因都是缓存数据与数据库不一致，或者缓存雪崩导致数据库被打垮。理解缓存的设计模式和失效策略，是后端工程师的必修课。`,
    sections: {
      why: `数据库的 QPS 上限通常在几千到几万，而 Redis 这样的缓存系统可以轻松达到十万级。对于读多写少的场景，缓存能将响应时间从几十毫秒降到亚毫秒级。但缓存引入了数据一致性的挑战：当数据库更新了，缓存里的旧数据怎么办？不同的业务场景对一致性的容忍度不同，这决定了你应该选择哪种缓存策略。`,
      how: `最常用的缓存模式是 Cache Aside（旁路缓存）：

读流程：先查缓存，命中则直接返回；未命中则查数据库，将结果写入缓存后返回。
写流程：先更新数据库，再删除缓存（而不是更新缓存）。

为什么是"删除"而不是"更新"缓存？因为在并发场景下，两个写请求可能导致缓存中存储了旧值。删除缓存让下一次读请求自然回源，保证最终一致性。

TTL（Time To Live）是缓存的安全网。即使删除操作失败，TTL 到期后缓存也会自动失效。建议根据业务容忍度设置 TTL：用户信息 5-15 分钟，配置数据 1-5 分钟，热点数据 30-60 秒。

对于一致性要求更高的场景，可以使用延迟双删：先删缓存，更新数据库，等待一小段时间后再删一次缓存，覆盖可能的并发读回填。`,
      practice: `实际落地时，还需要考虑缓存穿透（查询不存在的数据）、缓存击穿（热点 Key 过期瞬间大量请求打到数据库）和缓存雪崩（大量 Key 同时过期）。应对方案分别是：布隆过滤器或缓存空值、互斥锁或永不过期+异步更新、TTL 加随机偏移量。监控方面，重点关注缓存命中率（目标 > 95%）和回源 QPS。`,
      mistakes: `最常见的错误是"先删缓存再更新数据库"，这在并发下几乎必然导致脏数据。其次是 TTL 设置过长，导致数据不一致的窗口期太大。还有一种情况是缓存了过多的冷数据，占用内存但命中率很低——缓存应该只存热数据。`
    },
    codeLang: 'js',
    snippet: `// Cache Aside 读流程
async function getUser(id) {
  const key = \`user:\${id}\`;
  let data = await redis.get(key);
  if (data) return JSON.parse(data); // 缓存命中

  data = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  if (data) {
    // 回填缓存，TTL 5分钟 + 随机偏移防雪崩
    const ttl = 300 + Math.floor(Math.random() * 60);
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  }
  return data;
}

// Cache Aside 写流程
async function updateUser(id, updates) {
  await db.query('UPDATE users SET ? WHERE id = ?', [updates, id]);
  await redis.del(\`user:\${id}\`); // 先更新库，再删缓存
}`
  },
  {
    title: '从 0 到 1 搭建 CI/CD：让部署像提交代码一样简单',
    tags: ['CI/CD', '工程化'],
    lead: '部署应该是流水线，而不是手工仪式。',
    background: `还记得手动部署的日子吗？SSH 登录服务器，git pull，npm install，pm2 restart——每次都提心吊胆，生怕漏了哪一步。CI/CD 的核心价值不是"自动化"本身，而是"可重复、可追溯、可回滚"。当部署变成一条流水线，你就能把精力从"怎么发布"转移到"发布什么"上。`,
    sections: {
      why: `手动部署有三个致命问题：不可重复（每次操作可能有细微差异）、不可追溯（谁在什么时候部署了什么版本？）、不可回滚（出了问题只能手动修复）。CI/CD 流水线把这三个问题一次性解决。更重要的是，它降低了发布的心理门槛——当你知道随时可以安全回滚时，你会更愿意频繁发布小改动，而不是攒一大堆改动一次性上线。`,
      how: `一条基本的 CI/CD 流水线包含以下阶段：

1. 代码检查：ESLint/Prettier 格式化检查，TypeScript 类型检查。
2. 自动化测试：单元测试、集成测试，确保改动没有破坏已有功能。
3. 构建打包：生成生产环境产物，记录构建版本号。
4. 产物存储：将构建产物上传到制品库（如 Docker Registry、S3），确保产物可复用。
5. 部署发布：将产物部署到目标环境，支持灰度发布和快速回滚。

以 GitHub Actions 为例，一个基本的 Node.js 项目流水线只需要一个 YAML 文件。关键是把环境差异抽象为配置变量，而不是硬编码在代码或脚本中。`,
      practice: `建议从最小可用流水线开始：代码推送 → 跑测试 → 自动部署到测试环境。等流程稳定后，再逐步加入代码质量门禁（测试覆盖率、代码扫描）、多环境发布（staging → production）、灰度策略等。每次发布都应该生成一个可追溯的版本号，并保留至少最近 5 个版本的回滚能力。`,
      mistakes: `常见错误包括：流水线没有质量门禁，测试不通过也能部署；构建产物没有版本化，无法精确回滚；环境配置硬编码在代码中，导致"在我机器上能跑"的问题；以及流水线执行时间过长（超过 10 分钟），导致开发者不愿意等待而绕过流程。`
    },
    codeLang: 'yaml',
    snippet: `# .github/workflows/ci.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --coverage
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - name: Deploy to production
        run: echo "Deploy version $GITHUB_SHA"`
  },
  {
    title: '前端性能优化清单：从首屏到交互的关键指标',
    tags: ['前端', '性能'],
    lead: '首屏快不够，交互顺才是真体验。',
    background: `用户对网页性能的感知不只是"打开快不快"，还包括"滚动顺不顺"、"点击响不响应"、"布局跳不跳"。Google 的 Core Web Vitals 用三个指标量化了这些体验：LCP（最大内容绘制）衡量加载速度，INP（交互到下一次绘制）衡量响应性，CLS（累积布局偏移）衡量视觉稳定性。这三个指标直接影响 SEO 排名和用户留存。`,
    sections: {
      why: `据 Google 研究，页面加载时间从 1 秒增加到 3 秒，跳出率增加 32%；增加到 5 秒，跳出率增加 90%。性能不是锦上添花，而是直接影响业务指标的核心因素。更重要的是，性能优化不是一次性工作，而是需要持续监控和迭代的过程。没有度量就没有优化——你需要先建立基线，才能知道改进了多少。`,
      how: `性能优化可以从三个维度入手：

加载优化：关键 CSS 内联，非关键资源延迟加载。图片使用 WebP/AVIF 格式并配合 srcset 做响应式。字体使用 font-display: swap 避免 FOIT。启用 Brotli 压缩（比 Gzip 小 15-20%）。利用 HTTP/2 的多路复用减少连接开销。

渲染优化：避免强制同步布局（读写分离 DOM 操作）。长任务拆分为多个微任务，使用 requestIdleCallback 或 scheduler.yield()。虚拟滚动处理大列表。CSS 动画优先使用 transform 和 opacity（触发合成层而非重排）。

资源优化：代码分割（dynamic import），按路由懒加载。Tree Shaking 移除未使用代码。预加载关键资源（preload），预连接第三方域名（preconnect）。Service Worker 缓存静态资源实现离线可用。`,
      practice: `建议在项目中集成 Lighthouse CI，每次 PR 自动跑性能评分。用 web-vitals 库在真实用户端采集 Core Web Vitals 数据，发送到监控平台。设定性能预算：LCP < 2.5s，INP < 200ms，CLS < 0.1。对于图片密集的页面，使用 Intersection Observer 实现懒加载，配合 loading="lazy" 属性。`,
      mistakes: `常见误区：只看 Lighthouse 分数不看真实用户数据（Lab Data vs Field Data 差异很大）；过度懒加载导致用户看到大量占位符；第三方脚本（广告、分析）拖慢页面但没有做异步加载；以及只优化首屏而忽略了交互阶段的长任务。`
    },
    codeLang: 'js',
    snippet: `// 按路由懒加载组件
const Dashboard = () => import('./views/Dashboard.vue');

// 使用 requestIdleCallback 延迟非关键任务
requestIdleCallback(() => {
  import('./analytics.js').then(m => m.init());
});

// 监控 Core Web Vitals
import { onLCP, onINP, onCLS } from 'web-vitals';
onLCP(metric => report('LCP', metric.value));
onINP(metric => report('INP', metric.value));
onCLS(metric => report('CLS', metric.value));`
  },
  {
    title: 'TypeScript 实战：类型收窄、泛型与可维护的接口设计',
    tags: ['TypeScript', '前端'],
    lead: '让类型成为团队协作的"合同"。',
    background: `TypeScript 的价值不在于"给 JavaScript 加了类型"，而在于它能在编译期捕获错误、提供智能提示、并作为活文档描述代码意图。但很多项目引入 TypeScript 后，到处都是 any 和 as，类型系统形同虚设。真正发挥 TypeScript 威力的关键，是学会类型收窄、泛型抽象和接口设计。`,
    sections: {
      why: `JavaScript 的灵活性是双刃剑：一个函数可能返回 string、null、undefined 甚至 Error 对象，调用方如果不做检查就直接使用，运行时就会炸。TypeScript 的类型系统把这些"运行时惊喜"提前到了编译期。更重要的是，类型定义就是最好的 API 文档——它精确描述了函数接受什么、返回什么、可能出什么错，而且永远不会过时（因为代码改了类型不改，编译就报错）。`,
      how: `类型收窄（Type Narrowing）是 TypeScript 最实用的特性之一。通过 typeof、instanceof、in 操作符或自定义类型守卫，你可以在不同的代码分支中获得更精确的类型推断。

泛型让你写出可复用的类型安全代码。比如一个通用的 API 响应类型 ApiResult<T>，可以在不同接口间复用，同时保持每个接口返回数据的精确类型。

接口设计的原则是：对外暴露最小必要类型，对内使用精确类型。用 Pick、Omit、Partial 等工具类型从已有类型派生新类型，避免重复定义。用 discriminated union（可辨识联合）处理多态场景，比如不同类型的消息、不同状态的订单。`,
      practice: `建议在项目中开启 strict 模式，逐步消除 any。为核心业务模型建立类型定义文件（如 types/order.ts），作为团队的"数据合同"。对于第三方库缺少类型定义的情况，先用 @types/xxx 查找社区类型，没有的话写一个最小的 .d.ts 声明文件。`,
      mistakes: `最常见的错误是滥用 any 和 as 类型断言，这等于关闭了类型检查。其次是类型定义与实际运行时数据不一致（比如后端返回的字段名变了但前端类型没更新），这比没有类型更危险，因为它给了你虚假的安全感。还有一种情况是过度抽象——五层嵌套的泛型类型，没人看得懂，维护成本比收益还高。`
    },
    codeLang: 'ts',
    snippet: `// 可辨识联合 + 类型守卫
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: number };

function isOk<T>(r: ApiResult<T>): r is { ok: true; data: T } {
  return r.ok;
}

// 使用时自动收窄
async function fetchUser(id: string) {
  const result: ApiResult<User> = await api.get(\`/users/\${id}\`);
  if (isOk(result)) {
    console.log(result.data.name); // ✅ 类型安全
  } else {
    console.error(result.error, result.code); // ✅ 自动推断
  }
}

// 工具类型派生
type UserCreate = Omit<User, 'id' | 'createdAt'>;
type UserUpdate = Partial<Pick<User, 'name' | 'email'>>;`
  },
  {
    title: 'Node.js 服务稳定性：超时、重试、熔断与降级',
    tags: ['Node.js', '后端'],
    lead: '稳定性不是零故障，而是"可恢复"。',
    background: `在微服务架构下，一个请求可能经过 5-10 个服务节点。任何一个节点的抖动都可能引发连锁反应：下游超时 → 上游线程堆积 → 整个链路雪崩。稳定性工程的核心不是"消灭故障"（这不现实），而是"控制故障的影响范围"和"缩短恢复时间"。超时、重试、熔断、降级是四个最基本的稳定性手段。`,
    sections: {
      why: `没有超时的外部调用就像一颗定时炸弹。当下游服务响应变慢时，如果调用方没有设置超时，请求会一直挂着，占用连接池和内存。随着堆积的请求越来越多，调用方自己也会变慢，最终整条链路瘫痪。这就是所谓的"级联故障"。超时是最基本的自我保护机制，重试是容错手段，熔断是快速失败策略，降级是保核心放非核心的取舍。`,
      how: `超时设置的原则是：比下游的 P99 响应时间稍大，但不能太大。比如下游 P99 是 800ms，超时可以设 1.5s。太短会导致正常请求被误杀，太长起不到保护作用。

重试要有限制：最多重试 1-2 次，且只对可重试的错误（网络超时、5xx）重试，不要对 4xx 重试。重试间隔使用指数退避（exponential backoff）加随机抖动（jitter），避免重试风暴。

熔断器（Circuit Breaker）有三个状态：关闭（正常通行）、打开（快速失败）、半开（试探恢复）。当错误率超过阈值时熔断器打开，所有请求直接返回降级结果，不再调用下游。一段时间后进入半开状态，放少量请求试探，如果成功则恢复，否则继续熔断。

降级是业务层面的取舍：核心功能保证可用，非核心功能在压力大时主动关闭。比如商品详情页，价格和库存是核心，推荐和评论是非核心，可以在高峰期降级。`,
      practice: `Node.js 中可以用 AbortController 实现请求超时，用 p-retry 库做重试，用 opossum 库实现熔断器。建议为每个外部依赖（数据库、Redis、第三方 API）都配置独立的超时和熔断策略。监控方面，重点关注超时率、重试率、熔断触发次数，这些是系统健康度的先行指标。`,
      mistakes: `最危险的错误是没有设置超时——这在 Node.js 中尤其致命，因为单线程模型下一个慢请求就能阻塞整个事件循环。其次是无限重试，这会在下游故障时成倍放大流量，加速雪崩。还有一种常见问题是降级逻辑和正常逻辑耦合太深，导致降级本身也可能出错。`
    },
    codeLang: 'js',
    snippet: `// 带超时的 fetch 封装
async function fetchWithTimeout(url, options = {}, timeout = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// 带重试的调用（指数退避 + 抖动）
async function fetchWithRetry(url, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fetchWithTimeout(url);
    } catch (err) {
      if (i === maxRetries) throw err;
      const delay = Math.min(1000 * 2 ** i, 5000);
      const jitter = delay * 0.2 * Math.random();
      await new Promise(r => setTimeout(r, delay + jitter));
    }
  }
}`
  },
  {
    title: 'MySQL 索引与查询优化：从 EXPLAIN 到慢查询治理',
    tags: ['MySQL', '数据库'],
    lead: '索引是成本与性能的权衡艺术。',
    background: `数据库是大多数应用的性能瓶颈所在。当数据量从几千条增长到几百万条时，一条没有索引的查询可能从毫秒级变成秒级。但索引不是越多越好——每个索引都会占用存储空间，并且在写入时需要额外维护。理解索引的工作原理和 EXPLAIN 的输出，是数据库优化的基本功。`,
    sections: {
      why: `MySQL 的 InnoDB 引擎使用 B+ 树作为索引结构。没有索引时，查询需要全表扫描（Full Table Scan），逐行检查是否满足条件。有了索引，查询可以通过树的层级快速定位到目标数据，时间复杂度从 O(n) 降到 O(log n)。对于百万级数据表，这意味着从扫描 100 万行变成只需要访问 3-4 个树节点。`,
      how: `索引设计的核心原则：

1. 联合索引遵循最左前缀原则。索引 (a, b, c) 可以加速 WHERE a=1、WHERE a=1 AND b=2、WHERE a=1 AND b=2 AND c=3 的查询，但不能加速 WHERE b=2 的查询。
2. 覆盖索引避免回表。如果查询的字段都在索引中，MySQL 可以直接从索引返回数据，不需要再去主键索引查完整行。
3. 索引列不要参与计算。WHERE YEAR(create_time) = 2024 无法使用 create_time 的索引，应改为 WHERE create_time >= '2024-01-01' AND create_time < '2025-01-01'。

EXPLAIN 是分析查询性能的核心工具。重点关注：type 列（ALL 表示全表扫描，ref/range 表示使用了索引），rows 列（预估扫描行数），Extra 列（Using index 表示覆盖索引，Using filesort 表示需要额外排序）。`,
      practice: `建议建立慢查询治理流程：开启 slow_query_log，设置 long_query_time = 1（1秒以上记为慢查询）。每周 review 慢查询日志，为每条慢查询指定 owner 负责优化。优化后用 EXPLAIN 验证执行计划，确认索引生效。对于复杂查询，可以用 EXPLAIN ANALYZE（MySQL 8.0+）查看实际执行时间。`,
      mistakes: `常见错误：为每个 WHERE 条件单独建索引（应该建联合索引）；索引列发生隐式类型转换（比如 VARCHAR 列用数字查询）；SELECT * 导致无法使用覆盖索引；ORDER BY 和 WHERE 使用不同的索引导致 filesort；以及在低基数列（如性别、状态）上建索引，效果很差。`
    },
    codeLang: 'sql',
    snippet: `-- 分析查询执行计划
EXPLAIN SELECT id, name, email
FROM users
WHERE tenant_id = 2 AND status = 1
ORDER BY created_at DESC
LIMIT 20;

-- 创建联合索引（匹配查询模式）
ALTER TABLE users
ADD INDEX idx_tenant_status_created (tenant_id, status, created_at DESC);

-- 优化前：全表扫描 type=ALL, rows=1000000
-- 优化后：索引范围扫描 type=range, rows=50

-- 查看慢查询统计
SELECT query, exec_count, avg_latency
FROM sys.statements_with_runtimes_in_95th_percentile
ORDER BY avg_latency DESC LIMIT 10;`
  },
  {
    title: 'Redis 实战：数据结构选择与常见踩坑',
    tags: ['Redis', '缓存'],
    lead: '选对数据结构，就是一半性能。',
    background: `Redis 之所以强大，不仅因为它快（内存操作 + 单线程避免锁竞争），更因为它提供了丰富的数据结构：String、Hash、List、Set、Sorted Set、HyperLogLog、Bitmap 等。不同的业务场景选择合适的数据结构，性能和内存效率可以差几倍甚至几十倍。很多人把 Redis 当成"快速的 Key-Value 存储"，只用 String 类型，这是对 Redis 能力的巨大浪费。`,
    sections: {
      why: `举个例子：存储用户信息。如果用 String 类型，每次更新一个字段都要序列化/反序列化整个对象。用 Hash 类型，可以单独读写某个字段（HGET user:42 name），既节省带宽又减少序列化开销。再比如排行榜功能，用 Sorted Set 一行命令（ZADD + ZREVRANGE）就能实现，如果用 String 存储再在应用层排序，复杂度和性能都差很多。`,
      how: `数据结构选择指南：

String：简单的键值对、计数器（INCR）、分布式锁（SET NX EX）、缓存序列化对象。
Hash：对象属性存储（用户信息、商品详情），支持单字段读写。
List：消息队列（LPUSH + BRPOP）、最新动态列表（LPUSH + LTRIM 保持固定长度）。
Set：标签系统、共同好友（SINTER）、去重计数。
Sorted Set：排行榜、延迟队列（用 score 存时间戳）、范围查询。
HyperLogLog：大规模去重计数（UV 统计），内存固定 12KB，误差约 0.81%。
Bitmap：用户签到、特性开关、布隆过滤器的底层实现。

Key 命名规范建议使用冒号分隔的层级结构：业务:对象类型:ID:字段，如 order:detail:12345 或 user:session:abc123。统一的命名让运维和排查问题时能快速定位。`,
      practice: `内存管理是 Redis 运维的重点。建议为所有 Key 设置 TTL，避免内存无限增长。使用 MEMORY USAGE 命令检查大 Key，超过 10KB 的 String 或超过 5000 个元素的集合都应该考虑拆分。配置 maxmemory-policy 为 allkeys-lru 或 volatile-lru，让 Redis 在内存不足时自动淘汰。监控方面，关注 used_memory、keyspace_hits/misses（命中率）、connected_clients。`,
      mistakes: `最常见的错误是大 Key 问题：一个 Hash 存了几十万个字段，删除时会阻塞 Redis 几秒。其次是热 Key 问题：某个 Key 的 QPS 特别高，单个 Redis 节点扛不住。解决方案是本地缓存 + 读副本分散压力。还有一个容易忽略的问题是 Key 过期策略：Redis 的过期是惰性删除 + 定期删除，大量 Key 同时过期可能导致瞬间 CPU 飙高。`
    },
    codeLang: 'bash',
    snippet: `# Hash 存储用户信息（支持单字段操作）
HSET user:42 name "keven" email "k@example.com" plan "pro"
HGET user:42 name          # 只读取 name 字段
HINCRBY user:42 login_count 1  # 原子递增

# Sorted Set 实现排行榜
ZADD leaderboard 120 "user:42" 95 "user:13" 200 "user:7"
ZREVRANGE leaderboard 0 9 WITHSCORES  # Top 10

# 分布式锁（原子操作）
SET lock:order:123 "owner-id" NX EX 30
# 业务处理...
DEL lock:order:123

# 内存分析
MEMORY USAGE user:42
INFO memory`
  },
  {
    title: '日志与链路追踪：如何快速定位线上问题',
    tags: ['可观测性', '后端'],
    lead: '日志不是堆在一起，而是要能串起来。',
    background: `线上出了问题，第一反应是"看日志"。但当你面对几十个服务、每秒产生上万条日志时，"看日志"变成了大海捞针。更糟糕的是，一个用户请求可能经过 API 网关、用户服务、订单服务、支付服务、通知服务——每个服务都有自己的日志，怎么把它们串起来？这就是链路追踪要解决的问题。结构化日志 + Trace ID 是现代后端系统可观测性的基石。`,
    sections: {
      why: `传统的 console.log 式日志有三个致命问题：格式不统一（有的是纯文本，有的是 JSON），无法检索（只能 grep 关键词），无法关联（跨服务的日志没有关联关系）。当系统规模增长后，这种日志几乎没有排障价值。结构化日志解决了前两个问题，链路追踪解决了第三个问题。两者结合，你可以在几秒内定位到"用户 A 在 14:32:05 的下单请求，在支付服务的第三方回调环节超时了"。`,
      how: `结构化日志的核心是：每条日志都是一个 JSON 对象，包含固定的字段集合。必要字段包括：timestamp（时间戳）、level（日志级别）、service（服务名）、traceId（链路 ID）、msg（消息）。可选字段包括：userId、requestId、duration、error 等。

链路追踪的实现原理：在请求入口（通常是 API 网关）生成一个全局唯一的 Trace ID，通过 HTTP Header（如 X-Trace-Id）在服务间传递。每个服务在处理请求时，将 Trace ID 写入所有日志。这样，通过 Trace ID 就能检索到一个请求在所有服务中的完整日志链路。

OpenTelemetry 是目前最主流的可观测性标准，它统一了 Traces（链路）、Metrics（指标）、Logs（日志）三种信号的采集和传输协议。建议新项目直接使用 OpenTelemetry SDK，避免被特定厂商锁定。`,
      practice: `日志级别使用规范：ERROR 用于需要立即处理的异常，WARN 用于可能的问题但不影响主流程，INFO 用于关键业务节点（请求开始/结束、状态变更），DEBUG 用于开发调试（生产环境关闭）。告警策略：ERROR 日志触发即时告警，WARN 日志按频率告警（5分钟内超过 100 条），INFO 日志不告警但可检索。`,
      mistakes: `常见错误：日志中包含敏感信息（密码、Token、身份证号）；日志量过大导致存储成本失控（应该做采样和分级存储）；告警太多导致"狼来了"效应（应该分级和抑制）；以及 Trace ID 没有贯穿全链路（某个服务忘记传递了，链路就断了）。`
    },
    codeLang: 'js',
    snippet: `// 结构化日志工具封装
const logger = {
  info(msg, meta = {}) {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME,
      traceId: meta.traceId || 'unknown',
      msg,
      ...meta
    }));
  },
  error(msg, error, meta = {}) {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME,
      traceId: meta.traceId || 'unknown',
      msg,
      error: { message: error.message, stack: error.stack },
      ...meta
    }));
  }
};

// Express 中间件：注入 Trace ID
app.use((req, res, next) => {
  req.traceId = req.headers['x-trace-id'] || crypto.randomUUID();
  res.setHeader('X-Trace-Id', req.traceId);
  logger.info('request start', {
    traceId: req.traceId,
    method: req.method,
    path: req.path
  });
  next();
});`
  }
];

const angles = [
  { name: '性能', focus: '缩短响应路径，降低等待时间', metric: 'P95/P99 延迟', risk: '只优化局部导致瓶颈迁移' },
  { name: '稳定性', focus: '降低故障率并缩短恢复时间', metric: 'SLA/MTTR/错误率', risk: '缺少降级兜底引发雪崩' },
  { name: '成本', focus: '用更少资源支撑同样吞吐', metric: 'QPS/成本比', risk: '过度优化导致投入失衡' },
  { name: '协作', focus: '让协作可追踪、可回滚', metric: '交付周期/回滚次数', risk: '规范缺失造成返工' },
  { name: '可维护性', focus: '降低理解和修改代码的成本', metric: '代码复杂度/变更频率', risk: '过度抽象反而增加认知负担' }
];

const audiences = ['独立开发者', '2-5 人小团队', '有专职运维支持的团队', '多环境交付团队', '正在扩张的团队'];
const scenarios = ['从 0 到 1 的新项目', '已有系统的重构期', '线上问题频发的阶段', '业务增长带来的容量压力', '需要多端联动的复杂需求'];

const depthStages = [
  { name: '入门', focus: '建立基本概念与最小闭环', suffix: ['快速上手', '入门指南', '实践手册', '关键细节', '核心概念'] },
  { name: '进阶', focus: '稳定可复用，开始处理边界', suffix: ['落地路径', '执行路线', '排障清单', '策略拆解', '复盘要点'] },
  { name: '实战', focus: '面向真实流量与团队协作', suffix: ['案例复盘', '项目模板', '行动指南', '团队协作', '实战清单'] },
  { name: '深挖', focus: '规模化演进与成本优化', suffix: ['性能版', '稳定性版', '成本优化', '设计图谱', '架构思考'] }
];

const pick = (items, idx) => items[idx % items.length];

for (let i = 0; i < count; i++) {
  const ratio = count <= 1 ? 0 : i / (count - 1);
  const depthIndex = Math.min(depthStages.length - 1, Math.floor(ratio * depthStages.length));
  const depth = depthStages[depthIndex];
  const topicPoolSize = Math.max(1, Math.ceil(((depthIndex + 1) * topics.length) / depthStages.length));
  const topicPool = topics.slice(0, topicPoolSize);
  const t = topicPool[i % topicPool.length];
  const date = new Date(start.getTime() + spanMs * ratio);

  const angle = pick(angles, i);
  const audience = pick(audiences, i);
  const scenario = pick(scenarios, i);
  const titleSuffix = pick(depth.suffix, i);

  const title = `${t.title}｜${titleSuffix}`;
  const slug = slugify(title);
  const fileName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${slug}.md`;
  const filePath = path.join(postsDir, fileName);
  const tagLines = t.tags.map((x) => `- ${x}`).join('\n');

  // 根据文章序号选择不同的内容组织方式，确保多样性
  const variant = i % 3;
  let body = '';

  const intro = `这篇文章面向${audience}，从${angle.name}视角深入拆解${t.title.split('：')[0]}。当前定位为「${depth.name}」阶段，核心目标是${depth.focus}。我们会从实际场景出发，结合具体代码示例，把关键知识点拆解为可落地的行动步骤。衡量标准：${angle.metric}。`;

  if (variant === 0) {
    body = [
      `> ${t.lead}`, '', '<!-- more -->', '',
      '## 为什么要关注这个话题', '',
      intro, '',
      t.sections.why, '',
      '## 背景与问题', '',
      t.background, '',
      `在「${scenario}」这个阶段，${angle.name}问题尤为突出。${angle.risk}是最容易踩的坑，我们需要先建立正确的度量体系，再逐步优化。`, '',
      '## 方法论与实践路径', '',
      t.sections.how, '',
      '## 代码示例', '',
      `下面是一个可以直接参考的${depth.name}级别示例：`, '',
      `\`\`\`${t.codeLang}`,
      t.snippet,
      '```', '',
      '## 落地建议', '',
      t.sections.practice, '',
      '## 常见误区与避坑指南', '',
      t.sections.mistakes, '',
      `## 小结`, '',
      `${t.title.split('：')[0]}的${depth.name}阶段，核心是${depth.focus}。从${angle.name}角度出发，关注${angle.metric}，避免${angle.risk}。把上面的实践清单逐项落地，你会发现效果比想象中来得快。`, ''
    ].join('\n');
  } else if (variant === 1) {
    body = [
      `> ${t.lead}`, '', '<!-- more -->', '',
      '## 场景与痛点', '',
      intro, '',
      t.background, '',
      `当团队规模是${audience}时，最大的挑战不是"不会做"，而是"做了但不可复用、不可追溯"。在${scenario}的背景下，我们需要一套既轻量又可靠的方案。`, '',
      '## 核心原理', '',
      t.sections.why, '',
      '## 分步实施指南', '',
      t.sections.how, '',
      '## 实战代码', '',
      '以下代码片段经过简化，可以直接用于项目中：', '',
      `\`\`\`${t.codeLang}`,
      t.snippet,
      '```', '',
      '## 进阶实践', '',
      t.sections.practice, '',
      '## 踩坑记录', '',
      t.sections.mistakes, '',
      `## 下一步行动`, '',
      `如果你正处于${depth.name}阶段，建议先把核心链路的${angle.metric}监控建立起来，然后按照上面的步骤逐项推进。记住，${angle.focus}不是一蹴而就的，而是持续迭代的过程。每次改进后都要回看数据，确认效果符合预期。`, ''
    ].join('\n');
  } else {
    body = [
      `> ${t.lead}`, '', '<!-- more -->', '',
      '## 开篇', '',
      intro, '',
      '## 问题拆解', '',
      t.background, '',
      t.sections.why, '',
      '## 解决方案', '',
      t.sections.how, '',
      '## 代码实战', '',
      `在${scenario}的实际场景中，下面的代码模式非常实用：`, '',
      `\`\`\`${t.codeLang}`,
      t.snippet,
      '```', '',
      '## 工程化落地', '',
      t.sections.practice, '',
      `对于${audience}来说，建议从最小可行方案开始，先跑通核心流程，再逐步完善边界处理和监控告警。不要试图一次性做到完美，${depth.focus}才是当前阶段的重点。`, '',
      '## 避坑清单', '',
      t.sections.mistakes, '',
      `## 总结与展望`, '',
      `本文从${angle.name}视角梳理了${t.title.split('：')[0]}在${depth.name}阶段的关键实践。核心指标是${angle.metric}，最大风险是${angle.risk}。希望这些经验能帮你少走弯路，在${scenario}中更从容地推进。`, ''
    ].join('\n');
  }

  const content = `---\ntitle: ${title}\ndate: ${formatDate(date)}\ntags:\n${tagLines}\n---\n\n${body}`;
  fs.writeFileSync(filePath, content, 'utf8');
}

console.log(`Generated ${count} posts in ${postsDir}`);
