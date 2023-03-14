---
title: NeRF Faster Inference 调研（3）
date: 2022-03-31
tags: [NeRF, 实时渲染]
categories: [NeRF原理与相关论文]
---

## 实时环境光

### 球谐函数(Spherical Harmonics, SH)

#### 基本概念

- 是一系列的、定义在球面上的、二维的一组基函数

- 可以将一个二维函数 $f(\omega)$ 分解成一组球谐函数的和

- 类比于1维的傅里叶级数

    ![img](Faster%20Inference_20220331/https%253A%252F%252Fs3-us-west-2.amazonaws.com%252Fsecure.notion-static.com%252Fcd02de24-79ae-4da9-8944-c8116d137ec4%252FUntitled-16486270356271.png)

- 每一行的频率 l 都是一样的，l 越大，频率越高

- 每个频率下有 (2l + 1) 个不同形状的基函数

- 每个基函数都有一个编号，对于第 l 行，编号的范围为 [-l, l]

- 前 n 阶总共有 $n^2$个基函数

- 每个基函数是用 Legendre 多项式来描述的

- 计算球谐函数的系数

    - 求系数的过程被称为投影
    - $c_i = \int_{\Omega} f(\omega)B_i(\omega)d\omega$

- 性质

    - 正交性
    - 投影 / 重构很好计算
        - $c_i = \int_{\Omega} f(\omega)B_i(\omega)d\omega$
    - 旋转很好计算
        - 旋转原图 → 旋转所有的基函数
        - 旋转任一个基函数后，都可以用同阶的基函数的一个线性组合来描述
    - 可以用前几阶的基函数表示低频区域

#### 用球谐函数处理环境光

- Diffuse BRDF表现起来像一个低通滤波器
- 一般情况下，用 3 阶球谐函数就能基本上拟合Diffuse BRDF
- 既然经过Diffuse物体后只剩下低频部分，那我们何不在描述光照时也只使用低频部分呢？
- 使用球谐函数来描述环境光
    - 只要材质是Diffuse，用 3 阶 SH 就能达到非常准确的近似结果
- 把积分过程转化成了函数相乘，使得渲染方程实际可解
- 环境光贴图中有 Spherical Map
    - 可以将该贴图分解为 3 阶的 SH 函数，并用在 shading 中，得到准确的环境光结果
- SH适合做低频的拟合，对高频部分的拟合效果不够好

### Wavelet 小波函数

- 定义在 2D 图像块上，不同的基函数定义域不同

- Haar 小波

    <img src="Faster%20Inference_20220331/https%253A%252F%252Fs3-us-west-2.amazonaws.com%252Fsecure.notion-static.com%252Faaad4380-d3c5-4ba1-ab58-4649abadce1a%252FUntitled-16486270691972.png" alt="img" style="zoom: 50%;" align="left"/>

- 投影到小波函数上之后，有大量的系数接近 0

- 是一个非线性的近似

- 优点：支持全频率的表示

- 缺点：不支持快速的环境光旋转

## 实时全局光

### Light Propagation Volumes (LPV)

- 核心思路：radiance 在直线传播的过程中不会发生变化
- 解决方案：用 3D 网格来传播 radiance
- 步骤
    - <img src="Faster%20Inference_20220331/image-20220330160631221.png" alt="image-20220330160631221" style="zoom: 67%;"/>
    - 找到被光直接照射的表面，获得直接光照的 radiance
        - 把这些被光直接照亮的表面看做次级光源
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
        - <img src="Faster%20Inference_20220331/image-20220329162741984.png" alt="image-20220329162741984" style="zoom: 50%;"/>
        - 上图中，正确的情况下，点 p 反射的光无法照亮背面
        - 然而每个网格发出的光被认为是 uniform 的，因此背面会被照亮

###  Voxel Global Illumination (VXGI)

- two-pass algorithm
- 将整个场景体素化
    - 用树形结构优化
- Pass 1：从光源出发，计算直接光结果
    - <img src="Faster%20Inference_20220331/image-20220329164137646.png" alt="image-20220329164137646" style="zoom:67%;" />
    - 将直接光结果存储在 voxel 里
    - 每个 voxel 中存储光线方向（绿色）和法线方向（橙色）的分布，以解决 glossy 材质
        - 不同于 LPV 中存储的 SH
- Pass 2：从相机出发，渲染结果
    - ![image-20220329164717831](Faster%20Inference_20220331/image-20220329164717831.png)
    - 找到 shading point 对应的 voxel
    - 根据 voxel 中存储的光线方向分布，trace 一个圆锥
    - 根据圆锥大小的增长，在对应层级的 voxel 上进行采样
    - 对于 diffuse 表面，采样若干个小圆锥

- 渲染质量比 LPV 高，但是开销更大
- 思路比较接近离线渲染

## Baking Neural Radiance Fields for Real-Time View Synthesis

### Info

- 会议：ICCV
- 年份：2021
- https://phog.github.io/snerg/

### Method

- ![image-20220330153216564](Faster%20Inference_20220331/image-20220330153216564.png)
- 采用预计算的思路
- 使用两个神经网络，将 diffuse 和 specular 部分拆开
    - 在每个采样点处使用一个大的神经网络
        - 输入光线位置 + 方向，输出颜色、密度、用于 specular 的特征向量
    - 对于 specular 部分，在 volume rendering 的累计结果上使用一个小的神经网络
        - 输入累计的特征向量，输出 specular 的颜色值
- 训练时，将大网络的输出结果存储在 voxel grid 中
- 测试时，直接访问 voxel，不需要经过大的神经网络

### Result

- <img src="Faster%20Inference_20220331/image-20220330155142510.png" alt="image-20220330155142510" style="zoom:80%;" />
- 达到实时，数量级与同期的 FastNeRF，PlenOctrees，KiloNeRF 相同，但是数据上稍微差一点
    - 都是 2021 年的论文
- 这几篇 paper 的思路基本是一样的，区别只在于实现细节 / 技术上的优化
    - 用 voxel 划分场景 + 预计算
    - 投影到基函数上
    - 牺牲一定的质量，换来渲染速度






- 后续思路：参考 real-time ray tracing
    - 低采样数 + 降噪
    - 基于时序的降噪 （TAA）
