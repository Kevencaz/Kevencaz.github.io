---
title: MySQL 索引与查询优化：从 EXPLAIN 到慢查询治理｜成本优化
date: 2024-09-02 18:22:09
tags:
- MySQL
- 数据库
---

> 索引是成本与性能的权衡艺术。

<!-- more -->

## 开篇

这篇文章面向有专职运维支持的团队，从成本视角深入拆解MySQL 索引与查询优化。当前定位为「深挖」阶段，核心目标是规模化演进与成本优化。我们会从实际场景出发，结合具体代码示例，把关键知识点拆解为可落地的行动步骤。衡量标准：QPS/成本比。

## 问题拆解

数据库是大多数应用的性能瓶颈所在。当数据量从几千条增长到几百万条时，一条没有索引的查询可能从毫秒级变成秒级。但索引不是越多越好——每个索引都会占用存储空间，并且在写入时需要额外维护。理解索引的工作原理和 EXPLAIN 的输出，是数据库优化的基本功。

MySQL 的 InnoDB 引擎使用 B+ 树作为索引结构。没有索引时，查询需要全表扫描（Full Table Scan），逐行检查是否满足条件。有了索引，查询可以通过树的层级快速定位到目标数据，时间复杂度从 O(n) 降到 O(log n)。对于百万级数据表，这意味着从扫描 100 万行变成只需要访问 3-4 个树节点。

## 解决方案

索引设计的核心原则：

1. 联合索引遵循最左前缀原则。索引 (a, b, c) 可以加速 WHERE a=1、WHERE a=1 AND b=2、WHERE a=1 AND b=2 AND c=3 的查询，但不能加速 WHERE b=2 的查询。
2. 覆盖索引避免回表。如果查询的字段都在索引中，MySQL 可以直接从索引返回数据，不需要再去主键索引查完整行。
3. 索引列不要参与计算。WHERE YEAR(create_time) = 2024 无法使用 create_time 的索引，应改为 WHERE create_time >= '2024-01-01' AND create_time < '2025-01-01'。

EXPLAIN 是分析查询性能的核心工具。重点关注：type 列（ALL 表示全表扫描，ref/range 表示使用了索引），rows 列（预估扫描行数），Extra 列（Using index 表示覆盖索引，Using filesort 表示需要额外排序）。

## 代码实战

在线上问题频发的阶段的实际场景中，下面的代码模式非常实用：

```sql
-- 分析查询执行计划
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
ORDER BY avg_latency DESC LIMIT 10;
```

## 工程化落地

建议建立慢查询治理流程：开启 slow_query_log，设置 long_query_time = 1（1秒以上记为慢查询）。每周 review 慢查询日志，为每条慢查询指定 owner 负责优化。优化后用 EXPLAIN 验证执行计划，确认索引生效。对于复杂查询，可以用 EXPLAIN ANALYZE（MySQL 8.0+）查看实际执行时间。

对于有专职运维支持的团队来说，建议从最小可行方案开始，先跑通核心流程，再逐步完善边界处理和监控告警。不要试图一次性做到完美，规模化演进与成本优化才是当前阶段的重点。

## 避坑清单

常见错误：为每个 WHERE 条件单独建索引（应该建联合索引）；索引列发生隐式类型转换（比如 VARCHAR 列用数字查询）；SELECT * 导致无法使用覆盖索引；ORDER BY 和 WHERE 使用不同的索引导致 filesort；以及在低基数列（如性别、状态）上建索引，效果很差。

## 总结与展望

本文从成本视角梳理了MySQL 索引与查询优化在深挖阶段的关键实践。核心指标是QPS/成本比，最大风险是过度优化导致投入失衡。希望这些经验能帮你少走弯路，在线上问题频发的阶段中更从容地推进。
