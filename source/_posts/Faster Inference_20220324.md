---
title: NeRF Faster Inference 调研（2）
date: 2022-03-24
tags: [NeRF, 实时渲染]
categories: [NeRF原理与相关论文]
---

## 汇总

- [Plenoxels](#Plenoxels-Radiance-Fields-without-Neural-Networks)
- [DVGO](#Direct-Voxel-Grid-Optimization-Super-fast-Convergence-for-Radiance-Fields-Reconstruction)
- [NeX](#NeX-Real-time-View-Synthesis-with-Neural-Basis-Expansion)
- [SNeRG](#Baking-Neural-Radiance-Fields-for-Real-Time-View-Synthesis)

## Plenoxels: Radiance Fields without Neural Networks

### Info

- 会议：CVPR
- 年份：2022
- https://alexyu.net/plenoxels/?s=09

### Method

- ![image-20220323220157130](Faster%20Inference_20220324/image-20220323220157130.png)

- 不使用神经网络
- 场景用 voxel 表达，每个 voxel 的顶点处存储球谐函数的系数
    - 使用了 **2 阶球谐函数**，共 9 个系数 -> 尝试用小波函数优化？
    - GAMES202 课件：一般情况下，使用 4 阶 16 个 SH 函数
- 渲染时，每个 voxel 对应的颜色值通过插值得到
- loss：MSE + variation
- 核心工作是加速训练过程
- 该论文的结果表明：NeRF 的关键在于可微分的 volume rendering 部分，而不是神经网络

### Result

- 只对比了训练时间和图像质量，未给出测试时的帧率等数据
- <img src="Faster%20Inference_20220324/image-20220323220836486.png" alt="image-20220323220836486" style="zoom:67%;"/>

<!--More-->

## Direct Voxel Grid Optimization: Super-fast Convergence for Radiance Fields Reconstruction

### Info

- 会议：CVPR
- 年份：2022
- Plenoxels 提到的相似工作
- https://github.com/sunset1995/DirectVoxGO

### Method

- ![image-20220323222522454](Faster%20Inference_20220324/image-20220323222522454.png)
- coarse to fine
    - coarse：低分辨率，颜色值与视线方向无关
        - 该过程不使用神经网络

    - fine：高分辨率，颜色值与视线方向相关
        - 使用一个 shallow MLP
        - 只有两个隐藏层，每个 128 通道

- 核心工作仍然是加速训练过程

### Result

- <img src="Faster%20Inference_20220324/image-20220323225254063.png" alt="image-20220323225254063" style="zoom:80%;"/>

## NeX: Real-time View Synthesis with Neural Basis Expansion

### Info

- 会议：CVPR
- 年份：2021
- https://nex-mpi.github.io/

### Method

- 引入 multiplane image (MPI)
    - 每张图存储 rgba 值
    - 缺点：只能处理 diffuse 表面
    - <img src="Faster%20Inference_20220324/image-20220323230036126.png" alt="image-20220323230036126" style="zoom: 50%;"/>
- ![image-20220323230552175](Faster%20Inference_20220324/image-20220323230552175.png)
- view-dependent MPI
    - 思路：存储的 rgb 值应该是视线方向的函数
    - 学习一组全局的基函数，用神经网络表示
    - MPI 中存储基函数的系数
- 学习两个网络
    - $F_\theta$：位置 -> 基函数的系数 $k_n$
        - 实验中发现把 $k_0$ 从神经网络里拿出来作为一组参数进行优化，最终效果会更好
    - $G_\phi$：视角 -> 基函数 $H_n$

### Result

- 核心工作在于解决 view-dependent，没有比较帧率
- <img src="Faster%20Inference_20220324/image-20220323233052246.png" alt="image-20220323233052246" style="zoom: 67%;"/>


## Baking Neural Radiance Fields for Real-Time View Synthesis

### Info

- 会议：ICCV
- 年份：2021
- https://phog.github.io/snerg/

### Method

- ![image-20220330153216564](Faster%20Inference_20220324/image-20220330153216564.png)
- 采用预计算的思路
- 使用两个神经网络，将 diffuse 和 specular 部分拆开
    - 在每个采样点处使用一个大的神经网络
        - 输入光线位置 + 方向，输出颜色、密度、用于 specular 的特征向量
    - 对于 specular 部分，在 volume rendering 的累计结果上使用一个小的神经网络
        - 输入累计的特征向量，输出 specular 的颜色值
- 训练时，将大网络的输出结果存储在 voxel grid 中
- 测试时，直接访问 voxel，不需要经过大的神经网络

### Result

- <img src="Faster%20Inference_20220324/image-20220330155142510.png" alt="image-20220330155142510" style="zoom:80%;" />
- 达到实时，数量级与同期的 FastNeRF，PlenOctrees，KiloNeRF 相同，但是数据上稍微差一点
    - 都是 2021 年的论文
- 这几篇 paper 的思路基本是一样的，区别只在于实现细节 / 技术上的优化
    - 用 voxel 划分场景 + 预计算
    - 投影到基函数上
    - 牺牲一定的质量，换来渲染速度