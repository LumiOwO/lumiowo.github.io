---
title: GAMES202 - Global Illumination
date: 2022-04-01
tags: [GAMES202, GI, 实时渲染]
categories: [图形学入门笔记]
---

## 1 实时全局光照

### 1.1 简介

- 实时渲染中，一般考虑 one-bounce 的间接光照
- 把被光源直接照亮的表面看作新的光源(secondary light)
- 我们需要知道什么信息来计算间接光照？
    - 哪些surface patch是被光源照亮的？
        - 可以由shadow map找到
    - 这些patch的贡献是多少？
        - 把每个patch看做面光源

### 1.2 辐射度量学

- Flux / Power
    - 总能量大小
- Radiant Intensity
    - 单位立体角上的能量大小
- Irradiance
    - 单位面积上的能量大小
- Radiance
    - 单位面积、单位立体角上的能量大小

## 2 Reflective Shadow Map (RSM)

- 3D 空间的实时全局光照

- 把 shadow map 上的每一个 texel 都认为是一个次级光源

- 假设：认为所有的反射物（次级光源）都是 diffuse 的

    - shading point可能从各个方向看向次级光源，通过该假设可以简化计算

<!--More-->

- 如果在 shading point 处采样，会有很多 sample 到不了 patch 处，从而被浪费

    <img src="Global%20Illumination/2Ffa099d1f-8837-4f3e-a938-d5d40c3fe788-2FUntitled.png" alt="img" style="zoom:50%;" />

- 转换成在 patch 处计算

- 转换办法：把对立体角的积分转换为对面积的积分

    ![img](Global%20Illumination/2F8f667e09-a2d2-4862-9b70-16b127a365c6-2FUntitled.png)

- 对于次级光源（点 q 处）

    - BRDF： $f_q = \rho / \pi$
        - 这个并不是上面公式里的BRDF，而是点 q 处的
        - 由假设可以知道，该BRDF是 diffuse 的
        - 公式里是点 p 的 BRDF，这个BRDF 可以是 glossy 的
    - Radiance： $L_i = f_q \cdot \frac{\Phi}{dA}$
        - $\Phi$是直接光照打到 patch 上的能量

- 把上面的代换式代入积分中：

    ![img](Global%20Illumination/2F76bd1deb-6d82-4dbb-ab8f-b498e9f0662c-2FUntitled.png)

- 存在的问题

    - 对于 Visibility 项
        - 判断点p是否能看到点q
        - 由于很难算，所以不去算了，直接忽略这一项
    - 分母为什么是4次方
        - 论文作者写错了，应该是平方

- 加速

    - 理论上，并不是所有的texel都对p有贡献，有很多会被挡住
    - 思路
        - 把shading point投影到shadow map上
        - 认为只有投影到shadow map上的位置附近的texel才对该点有贡献
        - 对该区域进行采样

- RSM中存储的内容

    - 深度信息
    - 世界坐标
    - 法线值
    - Flux

- 用途：经常用来处理手电筒产生的间接光照

- 优点：

    - 易于实现，只需要扩展shadow map储存的内容

- 缺点：

    - 性能消耗与光源的数量成正比
    - 缺少了Visibility项，容易出现不真实的情况
    - 做了非常多的假设，会影响最终质量
    - sample数量 / 图像质量的tradeoff

## 3 Light Propagation Volumes (LPV)

- 核心思路：radiance 在直线传播的过程中不会发生变化
- 解决方案：用 3D 网格来传播 radiance
- 步骤
    - 找到被光直接照射的表面，获得直接光照的 radiance
        - 可以用 RSM 来获得这些次级光源
    - 将该值注入到网格中
        - 在每个网格中，将网格内的所有次级光源的结果累计起来
        - 将该结果投影到 SH 上进行压缩
    - 在网格中传播
        - 每个网格向相邻的 6 个网格传播
        - 不断迭代直到收敛
    - 后续的渲染中，直接从网格中获得间接光的 radiance
    - 每一帧都要重复以上步骤
- 存在的问题
    - Light leaking
        - <img src="Global%20Illumination/image-20220329162741984.png" alt="image-20220329162741984" style="zoom: 50%;" />
        - 上图中，正确的情况下，点 p 反射的光无法照亮背面
        - 然而每个网格发出的光被认为是 uniform 的，因此背面会被照亮


## 4 Voxel Global Illumination (VXGI)

- two-pass algorithm
- 将整个场景体素化
    - 用树形结构优化
- Pass 1：从光源出发，计算直接光结果
    - <img src="Global%20Illumination/image-20220329164137646.png" alt="image-20220329164137646" style="zoom:67%;" />
    - 将直接光结果存储在 voxel 里
    - 每个 voxel 中存储光线方向（绿色）和法线方向（橙色）的分布，以解决 glossy 材质
        - 不同于 LPV 中存储的 SH
- Pass 2：从相机出发，渲染结果
    - ![image-20220329164717831](Global%20Illumination/image-20220329164717831.png)
    - 找到 shading point 对应的 voxel
    - 根据 voxel 中存储的光线方向分布，trace 一个圆锥
    - 根据圆锥大小的增长，在对应层级的 voxel 上进行采样
    - 对于 diffuse 表面，采样若干个小圆锥

- 渲染质量比 LPV 高，但是开销更大
- 思路比较接近离线渲染