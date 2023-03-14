---
title: NeRF Faster Inference 调研（2）
date: 2022-03-24
tags: [NeRF, 实时渲染]
categories: [NeRF原理与相关论文]
---

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

## GAMES202

- 实时环境光照
    - prefiltering，split sum，**球谐函数，小波函数**

- 实时全局光照
    - 屏幕空间：ambient occlusion，screen space ray tracing，RSM
    - 3D 空间：VPL，LPV，VXGI，RTXGI
    - 预计算：precomputed radiance transfer，light baking

- 实时高质量着色
    - BRDF

- 实时光线追踪
