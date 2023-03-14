---
title: GAMES202 - Environment Lighting
date: 2022-04-07
tags: [GAMES202, 环境光, GI, IBL, 实时渲染]
categories: [图形学入门笔记]
---

## 1 时间上的滤波

- 关键思路
    - 假设上一帧已滤波，并重复利用上一帧的信息
    - 利用 motion vector
    - SPP 的累积数量是指数递增的
- back projection
    - 找到当前帧 i 中的像素 x 在第 i - 1 中的像素位置
    -  第一步：将屏幕空间的点变换到世界空间中
        - 可以用 G-buffer 预先储存世界坐标
        - 如果没有储存，做坐标变换即可：$s = M^{-1}V^{-1}P^{-1}E^{-1}x$
        - 假设上一帧到这一帧的变换为 $s' \overset{T}{\rightarrow}s$，则 $s'=T^{-1}s$
        - 使用上一帧的坐标变换，投影到上一帧的屏幕空间：$x'=E'P'V'M's'$
- 先对当前帧做 spatial 降噪，再与上一帧进行 alpha blend
    - <img src="Real-time%20Ray%20Tracing/image-20220406151526130.png" alt="image-20220406151526130" style="zoom: 50%;" />
    - $\alpha$ 一般取 0.1 - 0.2

- 存在的问题
    - 切换场景 / 场景的第一帧
        - 场景、光照的突变
    - 倒退着走的情况
        - 从屏幕边缘新出现的点在上一帧没有出现
    - 突然改变的遮挡关系 (disocclusion)
        - 上一帧的某个被挡住的物体在这一帧出现了
        - 本质原因：G-buffer 只储存了屏幕空间的信息
        - 如果强行使用上一帧信息，会出现残影
        - <img src="Real-time%20Ray%20Tracing/image-20220406152814409.png" alt="image-20220406152814409" style="zoom:67%;" />
    - shading 带来的问题
        - 阴影
        - glossy 材质

- 解决办法
    - Clamping
        - 先将上一帧的结果 clamp 到接近当前帧的结果，再进行混合
    - Detection
        - 检测上一帧的像素是否可用
            - eg. 记录一个 object ID，检测上一帧对应的物体是否与当前帧相同
        - 如果发现上一帧不可用，调整 $\alpha$ 的值，增大当前帧的权重
        - 新带来的问题：引入了更多当前帧的噪声
    - Temporally Reliable Motion Vectors for Real-time Ray Tracing, Eurographics 2021

## 2 空间上的滤波

- 高斯滤波

    - 低通滤波，只保留低频信息
    - 滤波时，根据周围像素 j 到中心像素 i 的距离，由高斯函数确定权重

- 双边滤波

    - 在高斯滤波的基础上，保留边缘信息
    - 边缘 $\leftrightarrow$ 剧烈变化的颜色值
    - 添加一项基于颜色差值的高斯函数
    - ![image-20220406160914164](Real-time%20Ray%20Tracing/image-20220406160914164.png)
        - 第一项：基于距离的高斯函数
        - 第二项：基于颜色值的高斯函数

- 联合双边滤波

    - 用更多的 distance 来指导滤波
    - 利用 G-buffer 中的信息
        - G-buffer 中的信息是无噪声的
    - 考虑深度、法线、颜色

- 如何实现大的滤波核

    - Separate Pass

        - 二维滤波 $\rightarrow$ 先水平滤波一遍，再竖直滤波一遍
        - $N^2 \rightarrow N + N$
        - 原理：二维高斯函数可以拆分成两个一维高斯函数的乘积
            - $G_{2D}(x, y) = G_{1D}(x) \cdot G_{1D}(y)$
            - ![image-20220406163341415](Real-time%20Ray%20Tracing/image-20220406163341415.png)
            - 理论上，双边滤波是没办法拆开的
            - 实际上，为了效率仍然会拆开计算，且结果基本无区别

    - Progressively Growing Size

        - 过滤若干次，每次都滤波核大小不断增长

        - 例子：a-trous wavelet 滤波器

            ![image-20220406163806846](Real-time%20Ray%20Tracing/image-20220406163806846.png)

        - 原理
            - 更大的 filter == 去除更低频的信息
            - 采样 == 搬移频谱
            - ![image-20220406164646405](Real-time%20Ray%20Tracing/image-20220406164646405.png)
            - 存在的问题：很多滤波核并没有把高频信息全部扔掉

- Outlier Removal
    - 对于图像中非常亮的点，滤波会出现问题
        - 特别亮的点会被扩散到周围像素，产生 fireflies / blocky artifacts
    - 特别亮的点称为 outlier
    - outlier detection
        - 寻找 7 x 7 范围内的像素
        - 计算均值和方差
        - $[\mu-k\sigma, \mu+k\sigma]$ 范围外的点即为 outlier
    - outlier removal
        - 把 outlier 的像素值 clamp 到 $[\mu-k\sigma, \mu+k\sigma]$ 范围内
    - 用于时序的 clamping
        - 如果上一帧的像素不可用，需要把上一帧的结果 clamp 到当前帧的范围内
        - $\text{clamp}(C^{(i-1)},\mu-k\sigma, \mu+k\sigma)$
        - 是噪声和残影之间的一个 tradeoff

## 3 Spatiotemporal Variance-Guided Filtering (SVGF)

- 联合双边滤波
- 深度
    - <img src="Real-time%20Ray%20Tracing/image-20220406214022908.png" alt="image-20220406214022908" style="zoom:50%;" align="left"/>
    - <img src="Real-time%20Ray%20Tracing/image-20220406213905637.png" alt="image-20220406213905637" style="zoom:50%;" align="left"/>
    - $\epsilon$：防止分母为 0
    - 用深度差除以梯度，从而让侧面上两个点对彼此的贡献增大
    - 可以理解为切平面上的深度差距
- 法线
    - <img src="Real-time%20Ray%20Tracing/image-20220406215030002.png" alt="image-20220406215030002" style="zoom:50%;" align="left"/>
    - <img src="Real-time%20Ray%20Tracing/image-20220406214217900.png" alt="image-20220406214217900" style="zoom:50%;" align="left"/>
    - 不应用法线贴图
- 颜色
    - <img src="Real-time%20Ray%20Tracing/image-20220406214953646.png" alt="image-20220406214953646" style="zoom:50%;" align="left" />
    - <img src="Real-time%20Ray%20Tracing/image-20220406214501832.png" alt="image-20220406214501832" style="zoom:50%;" align="left"/>
    - 为了避免 B 点过亮导致与 A 点的颜色相近，在分母加上一个方差项
    - 如何求分母的方差
        - Spatial：在目标点周围 7 x 7 范围内求方差
        - Temporal：在时域上对该方差做平均
        - Spatial：对上述平均值，用一个 3 x 3 的核进行滤波

## 4 Recurrent AutoEncoder (RAE)

- 关键思路

    - 用神经网络降噪
        - 输入：G-buffer、noisy image
        - 输出：clean image
    - 神经网络自动累积 temporal 信息
        - recurrent convolution block

- 网络结构：U-Net

- ![image-20220406220221397](Real-time%20Ray%20Tracing/image-20220406220221397.png)

- 训练时需要使用连续帧

- 没有使用 motion-vector

- 缺点

    - overblur、artifact 会比较多

- 对比

    ![image-20220406220730183](Real-time%20Ray%20Tracing/image-20220406220730183.png)

