---
title: 缓存设计入门：Cache Aside、TTL 与一致性取舍｜常见坑
date: 2020-06-16 05:45:54
tags:
- 缓存
- 后端
---

![illustration](/images/illustrations/layers.svg)

> 缓存不是越多越好，边界和失效策略才是关键。

<!-- more -->

这篇面向有专职运维支持的团队，从性能视角拆解缓存设计入门，目标是缩短响应路径，降低等待时间。

我们先统一指标（P95/INP/TTFB），再把动作拆成可验证步骤。

## 背景

常见问题不是“没有缓存”，而是“缓存命中后数据错了”。一致性与可回退是设计缓存时的核心。

在线上问题频发的阶段阶段，最容易忽视的是只优化局部导致瓶颈迁移，先对齐度量口径能减少返工。

## 方法拆解

- 读：先查缓存，未命中再查数据库并回填。
- 写：先写库，再删缓存（或延迟双删）。
- 用 TTL + 版本号兜底，避免脏数据无限期存在。

## 关键指标

- 核心指标：P95/INP/TTFB
- 目标：缩短响应路径，降低等待时间
- 验证方式：上线后 7 天回看趋势

## 示例

~~~js
const key = `user:${id}`;
let data = await cache.get(key);
if (!data) {
  data = await db.getUser(id);
  await cache.set(key, data, { ttl: 300 });
}
return data;
~~~

## 常见误区

- 热数据写入顺序不当导致脏读
- TTL 过长放大错误影响
- 缓存雪崩未做降级
- 只优化局部导致瓶颈迁移

## 工具与资料

- 压测：k6/Locust
- 日志：ELK/ClickHouse
- 链路：OpenTelemetry

## Checklist

- 为热点 Key 设置合理 TTL
- 缓存失败时有降级路径
- 监控命中率与回源比例
- 节奏：紧急修复热更新
