---
title: GAMES202 - Recap of CG basics
date: 2022-03-12
tags: [GAMES202, 实时渲染]
categories: [图形学入门笔记]
---

## 1 渲染管线

- 顶点处理
    - 变换，将世界坐标中的顶点投影到屏幕空间上
- 三角形处理
    - 顶点间的连接关系不变，在屏幕上连接三角形
- 光栅化
    - 将三角形离散成屏幕上的像素，称为片段(fragment)
- 片段处理
    - 片段着色、纹理映射
- 输出帧图像

## 2 OpenGL流程 - 类比于画油画

- 放置模型
    - 模型描述、模型变换
    - Vertex buffer object(VBO)
        - 一块传给GPU的buffer，存储模型的顶点、法线、纹理坐标
- 放置画架
    - 视图变换
        - 相机属性
    - 创建framebuffer
- 将画布放在画架上
    - 用同一个framebuffer可以输出多个不同纹理(renderTarget)
        - 一个pass里可以输出多张结果：normal、depth等
        - 用户在fragment shader中决定输出纹理的样式
- 在画布上画画
    - Vertex shader
        - 对每个顶点，顶点变换、投影、插值
    - fragment shader
        - 对每个片段，光照、阴影、深度测试
- 可以画多次
    - 之前的帧可以作为参考

<!--More-->

## 3 GLSL

### 3.1 shader language简介

- HLSL → vertex shader + pixel shader

- GLSL → vertex shader + fragment shader

### 3.2 配置shader

- 写shader
- 编译shader
- 将编译好的shader链接到程序中
- 运行程序

### 3.3 vertex shader

- attribute关键字
    - 表示顶点属性，只在vertex shader中出现
    - 在创建VBO的时候定义
- varying关键字
    - 告诉片段着色器哪些量需要被插值
    - 例如纹理坐标，vertex shader中只有顶点的纹理坐标，而fragment shader中需要知道三角形内部的纹理坐标，因此需要插值
- uniform关键字
    - 可以理解成直接从CPU拿过来的全局变量
    - vertex、fragment两个shader都可以访问
- gl_Position
    - OpenGL预定义的变量，需要将变换后的顶点位置写到该变量里

### 3.4 fragment shader

- varying关键字
    - 从vertex shader拿到的已插值的变量
- sampler2D类型
    - 表示一张二维的纹理
    - 可以使用texture2D()查询纹理上的某个位置
- gl_FragColor
    - OpenGL预定义的变量，需要将最终的输出颜色写到该变量里
- 注意gamma矫正

### 3.5 对shader进行Debug

- Nsight Graphics，只用于NVIDIA GPU
- Renderdoc
- 手动debug办法
    - 把值当成颜色，输出为图像
    - 负数可以加上某个偏移再输出

## 4 渲染方程

![img](Recap%20of%20CG%20basics/56298d70-cd6c-4046-b024-1ee97028e215Untitled.png)

- 实时渲染的间接光照通常只考虑one-bounce