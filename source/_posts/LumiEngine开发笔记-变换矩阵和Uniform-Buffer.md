---
title: LumiEngine 开发笔记 - 变换矩阵和 Uniform Buffer
date: 2021-10-23 16:44:00
tags: [Engine, Vulkan, Graphics]
categories: [LumiEngine开发笔记]
---

> 继续LumiEngine on Github: https://github.com/LumiOwO/LumiEngine 啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊

继续学习 [Vulkan Tutorial](https://vulkan-tutorial.com/Uniform_buffers/Descriptor_layout_and_buffer)，这次我们来看 Uniform buffers 章节并将这部分集成到引擎里。


## 1 不同 API 之间的差异

在讨论变换矩阵的原理之前，

- 好

    - 很好

        - 非常好

    - 特别好

        - 特标号
            - 特54别好

        - 好好好

我们先总结一下各种图形接口在定义变换操作上的一些差异。之前查资料时没有把这部分弄清楚，导致后面的变换部分看的我一头雾水。。

### 1.1 标准化设备坐标系 (NDC)

NDC (Normalized Device Coordinates) 

### 1.2 矩阵存储结构



Tutorial 中使用的是 glm 数学库。为了深入理解矩阵变换等数学操作的原理，并且受到[从零开始手敲次世代游戏引擎](https://edu.uwa4d.com/course-intro/0/164)课程的启发，引入 ispc 来实现一个自己的数学库。

该数学库功能尚不完善，目前我仍然遵循之前定下的“以功能为导向”的开发目标，只实现实际效果中需要用到的数学操作。

ispc code

## 2 变换矩阵

MVP矩阵

### 2.1 Model

<!--More-->

### 2.2 View

### 2.3 Projection

## 3 Uniform Buffer

### 3.1 流程



## 4 待解决的问题

- 模型加载进来后顶点坐标没有 z 值
    - a
- 设计相机和光源表示
- 变换矩阵的存储和传递

结点里储存了变换矩阵，需要转换成GPU能够解析的格式。

等 Tutorial 做完了，优先设计场景树结构。
