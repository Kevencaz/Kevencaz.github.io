param(
  [int]$Count = 50
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$postsDir = Join-Path $repoRoot 'source/_posts'

if (!(Test-Path $postsDir)) {
  New-Item -ItemType Directory -Path $postsDir | Out-Null
}

$start = Get-Date '2019-01-05T10:00:00+08:00'
$end = Get-Date
$spanTicks = ($end.Ticks - $start.Ticks)

$topics = @(
  @{ title = '用 Git 把个人项目管理好：分支、提交与回滚'; tags = @('Git','工程化'); img='git-flow.svg' },
  @{ title = 'HTTP 从建立连接到返回响应：一次请求的完整旅程'; tags = @('HTTP','网络'); img='http-lifecycle.svg' },
  @{ title = '缓存设计入门：Cache Aside、TTL 与一致性取舍'; tags = @('缓存','后端'); img='cache.svg' },
  @{ title = '从 0 到 1 搭建 CI/CD：让部署像提交代码一样简单'; tags = @('CI/CD','工程化'); img='pipeline.svg' },
  @{ title = '前端性能优化清单：从首屏到交互的关键指标'; tags = @('前端','性能'); img='pipeline.svg' },
  @{ title = 'TypeScript 实战：类型收窄、泛型与可维护的接口设计'; tags = @('TypeScript','前端'); img='pipeline.svg' },
  @{ title = 'Node.js 服务稳定性：超时、重试、熔断与降级'; tags = @('Node.js','后端'); img='pipeline.svg' },
  @{ title = 'MySQL 索引与查询优化：从 EXPLAIN 到慢查询治理'; tags = @('MySQL','数据库'); img='cache.svg' },
  @{ title = 'Redis 实战：数据结构选择与常见踩坑'; tags = @('Redis','缓存'); img='cache.svg' },
  @{ title = '日志与链路追踪：如何快速定位线上问题'; tags = @('可观测性','后端'); img='pipeline.svg' }
)

function New-Slug([string]$title) {
  $s = $title -replace '[^0-9A-Za-z\u4e00-\u9fa5]','-'
  $s = $s -replace '-{2,}','-'
  $s = $s.Trim('-')
  return $s
}

for ($i = 0; $i -lt $Count; $i++) {
  $t = $topics[$i % $topics.Count]
  $ratio = if ($Count -le 1) { 0 } else { $i / ($Count - 1) }
  $ticks = [int64]($start.Ticks + ($spanTicks * $ratio))
  $date = [DateTime]::new($ticks)

  $title = "{0}（{1:D2}）" -f $t.title, ($i + 1)
  $slug = New-Slug $title
  $fileName = $date.ToString('yyyy-MM-dd-') + $slug + '.md'
  $filePath = Join-Path $postsDir $fileName

  $tagLines = ($t.tags | ForEach-Object { "- $_" }) -join "`n"

  $imgPath = "/images/illustrations/{0}" -f $t.img

  $content = @"
---
title: $title
date: $($date.ToString('yyyy-MM-dd HH:mm:ss'))
tags:
$tagLines
---

![illustration]($imgPath)

这篇文章记录我在实践中的一个小结：

- 背景与问题
- 方案推导
- 实现细节
- 常见误区
- 一套可复用的检查清单

<!-- more -->

## 背景

在真实项目里，很多问题并不是“不会写代码”，而是缺少一套稳定的工程方法：可验证、可回滚、可观测。

## 方案

我通常会把问题拆成三个层面：

1. 目标与约束（业务/性能/成本）
2. 关键路径（数据流与依赖）
3. 风险面（边界条件、失败模式、回退策略）

## 实现要点

- 输入输出要可追踪
- 关键步骤要可度量
- 失败要可恢复

## 小结

把复杂问题产品化：流程、模板、自动化与复盘。

"@

  Set-Content -Path $filePath -Value $content -Encoding UTF8
}

Write-Host "Generated $Count posts in $postsDir"
