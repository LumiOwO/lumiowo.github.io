---
title: Monte Carlo Volume Rendering 原理
date: 2022-09-03
tags: [NeRF, 体渲染, 实时渲染]
categories: [NeRF原理与相关论文]
---

## 进展

- 学习理解了 monte carlo volume rendering 相关内容
- 实现了 pytorch 版本，验证正确
- 后续工作
  - 解决该方法带来的一些新问题
  - 实现时序降噪
  - 进一步优化速度

## 原理

### 参考资料

- 参考 delta tracking 的原理

- Transmittance 计算，https://zhuanlan.zhihu.com/p/519969318
- delta tracking，https://zhuanlan.zhihu.com/p/166116224
- \***volume rendering siggraph18 课程，https://cs.dartmouth.edu/wjarosz/publications/novak18monte-sig.html**
- \***volume rendering survey, https://cs.dartmouth.edu/wjarosz/publications/novak18monte.pdf**

### 公式

- nerf 的积分公式
  - <img src="Faster%20Inference_20220903/image-20220902150611361.png" alt="image-20220902150611361" style="zoom: 67%;" />
- **目标：获得一个数值解，使得该数值解的期望值等于积分的值**
  - nerf：采样 1 条光线，这条光线上取 1024个 采样点
  - ours：采样 n 条光线，每条光线上取 少量 采样点，最终结果为 n 条光线结果的均值
    - 每条光线相互独立，因此可以每一帧只采样 1 条光线，再根据相邻帧的结果进行降噪（即时序降噪）
  - 每像素采样数 (spp) = 采样光线的数量
- 完整的 volume rendering 公式
  - 记号说明：密度 $\sigma \to \mu$，颜色 $c \to L$，$\tau = \int_0^y\mu_t(s) \,\mathrm{d}s$
  - nerf 没有 in-scattering 这一项
  - <img src="Faster%20Inference_20220903/image-20220902151406809.png" alt="image-20220902151406809" style="zoom:67%;" />
- 利用 $\int_a^bf(x) \,\mathrm{d}x \to \frac{1}{N}\sum_{i=1}^N \frac{f(x_i)}{p(x_i)}\\$  写成蒙特卡洛形式
  - <img src="Faster%20Inference_20220903/image-20220902152830548.png" alt="image-20220902152830548" style="zoom:67%;" />

### distance sampling

- **目标：利用概率密度函数，把 $T$ 消掉**
- 由于 <img src="Faster%20Inference_20220903/image-20220902153148833.png" alt="image-20220902153148833" style="zoom:67%;" />, $T \in [0, 1]$，在 $[0, +\infty)$ 上单调递减
- 取 $F(t) = 1 - T(t)$ 作为累积密度函数 (CDF)
  - 此时 $p(t)$ 正好为 $\mu \cdot T$
- <img src="Faster%20Inference_20220903/image-20220902153058630.png" alt="image-20220902153058630" style="zoom:67%;" />
- 采样时，先取一个 $[0, 1]$ 之间的随机数 $\xi$，令 $F(t) = \xi$，解出 $t$ 的值作为采样点的位置
- 如果 $\mu_t$ 是常数，可以直接得到 $F^{-1}$ 的解析式
- <img src="Faster%20Inference_20220903/image-20220902154438934.png" alt="image-20220902154438934" style="zoom:67%;" />

### null collision

- **目标：想办法把空间填充成均匀的**
- 向空间中填入虚拟粒子（粉色），与真实粒子（灰色）构成一个均匀的空间
- 虚拟粒子不影响光线原本的传播
  - <img src="Faster%20Inference_20220903/image-20220902155146793.png" alt="image-20220902155146793" style="zoom:67%;" />

- 例子：采样一条光线
  - 每次前进 $-\frac{\ln (1-\xi)}{\bar\mu}\\$
  - 如果采样到虚拟粒子，认为是一个 null collision，继续向前取采样点
  - 如果采样到真实粒子，认为光线被该粒子挡住，停止向前
  - <img src="Faster%20Inference_20220903/image-20220902160119667.png" alt="image-20220902160119667" style="zoom:67%;" />

- 积分公式

  - <img src="Faster%20Inference_20220903/image-20220902160713366.png" alt="image-20220902160713366" style="zoom:67%;" />

- 蒙特卡洛形式

  - <img src="Faster%20Inference_20220903/image-20220902160739942.png" alt="image-20220902160739942" style="zoom:67%;" />

  - <img src="Faster%20Inference_20220903/image-20220902160953396.png" alt="image-20220902160953396" style="zoom:67%;" />

- $L_*$ 用俄罗斯轮盘赌的方法估计，即 $\langle L_*(y, \omega) \rangle = \left\{ \begin{matrix} \frac{L_*(y)}{P_*(y)}&, \xi < P_*(y)\\0&,\mathrm{otherwise}\end{matrix} \right. \\$

- 因此 $\langle L(x, \omega) \rangle = \sum_C^{ \;} w_*(x)L_*(y, \omega)\\$
  其中 $w_*(x) = \frac{T_{\bar\mu}(x, y)}{p_{\bar\mu}}\frac{\mu_*(x)}{P_*(x)}\\$

- 由于 $p_{\bar\mu} = \bar\mu \cdot T_{\bar\mu}(x, y)\\$，故 $w_*(x) = \frac{1}{\bar\mu}\frac{\mu_*(x)}{P_*(x)} = 1\\$

### 实验结果

- 结果符合预期

  - 透明度的问题在后面讨论

  |                            1 spp                             |                            16 spp                            |                           1024 spp                           |
  | :----------------------------------------------------------: | :----------------------------------------------------------: | :----------------------------------------------------------: |
  | ![image-20220902163521228](Faster%20Inference_20220903/image-20220902163521228.png) | ![image-20220902163638842](Faster%20Inference_20220903/image-20220902163638842.png) | ![ngp_ep0300_0000_rgb](Faster%20Inference_20220903/ngp_ep0300_0000_rgb.png) |

- 采样问题终于解决，可以实现后续的时序降噪

## 一些问题

### $\mu_t$ 的范围

- 目前结果的透明度不正确

- 原因：目前 $\bar\mu = 10$ ，取值小于 $\mu_t$

  - 此时 $P_t = \mu_t / \bar\mu > 1$，必定会取到真实粒子
  - 相当于把 $\mu_t$ 的最大值裁剪到了 $\bar\mu$
  - <img src="Faster%20Inference_20220903/image-20220902164241172.png" alt="image-20220902164241172"  />

- 验证：$\bar\mu$ 值越高，越接近真实值

  - spp = 1024

  |                        $\bar\mu = 2$                         |                        $\bar\mu = 10$                        |                        $\bar\mu = 20$                        |                ground truth                 |
  | :----------------------------------------------------------: | :----------------------------------------------------------: | :----------------------------------------------------------: | :-----------------------------------------: |
  | ![ngp_ep0300_0000_rgb](Faster%20Inference_20220903/ngp_ep0300_0000_rgb-16621090516547.png) | ![ngp_ep0300_0000_rgb](Faster%20Inference_20220903/ngp_ep0300_0000_rgb-16621088581862.png) | ![ngp_ep0300_0000_rgb](Faster%20Inference_20220903/ngp_ep0300_0000_rgb-16621089759004.png) | ![r_0](Faster%20Inference_20220903/r_0.png) |

- $\bar\mu$ 取的太大会出现新的问题（见后文）

- $\mu_t$ 的最大值太大了

  - 最大值能达到 200000 左右
  - <img src="Faster%20Inference_20220903/image-20220902170029346.png" alt="image-20220902170029346" style="zoom: 67%;" />

### $\bar\mu$ 的选取

- $\bar\mu$ 越大，每条光线的采样点数量越多
  - 步长为 $-\frac{\ln (1-\xi)}{\bar\mu}\\$，$\bar\mu$ 越大步长越小
  - $\bar\mu$ 越大，越容易采样到虚拟粒子，需要继续往前步进
  - <img src="Faster%20Inference_20220903/image-20220902170601183.png" alt="image-20220902170601183" style="zoom:67%;" />

- 验证：$\bar\mu$ 值越高，运行时间越长
  - spp = 1024

|                    | $\bar\mu = 2$ | $\bar\mu = 10$ | $\bar\mu = 20$ | $\bar\mu = 2000$ |
| :----------------: | :-----------: | :------------: | :------------: | :--------------: |
|      运行时间      |    10.58 s    |    35.79 s     |    64.10 s     |     > 60 min     |
| 采样点个数的最大值 |      26       |       54       |       81       |        -         |

### 解决思路

#### 思路一

- 重新训练网络，限制 $\sigma$（即 $\mu_t$）的输出范围
  - 如果能限制 $\sigma$ 在 $[0, 1]$ 范围内，可以很大提升采样效率
- 当前 density 网络使用的激活函数是指数函数 (exp)
- 手动试了一些激活函数
  - 学习率 lr = 0.01，epoch = 50
  - 发现在 $\sigma$ 值很大的时候结果才比较好

| $\sigma$ 激活函数 | $\sigma$ 范围 | $c$ 激活函数 |     验证集 psnr      |
| :---------------: | :-----------: | :----------: | :------------------: |
|        exp        |  [0, 200000]  |   sigmoid    | 32.294314 (baseline) |
|       relu        |   [0, 1000]   |   sigmoid    |      31.334019       |
|      sigmoid      |    [0, 1]     |   sigmoid    |       9.352023       |
|      sigmoid      |    [0, 1]     |     relu     |       9.371691       |
|  sigmoid * 1000   |   [0, 1000]   |     relu     |      30.554971       |
|    tanh + relu    |    [0, 1]     |     relu     |      15.853888       |

- 后面去搜索一下参数，看看能不能找到一个比较好的组合

#### 思路二

-  $\sigma$ 值限制在 $[0, 1]$ 之间，允许颜色值大于 1
  - 此时的颜色不再理解为像素的 rgb 颜色值，而是理解为辐射度 $L$，因此可以大于 1

- 改用 NeRF-SH 网络
  - 将输出的 rgb 颜色值改为球谐函数的系数
  - 系数的取值范围不再限制在 $[0, 1]$ 内



- 以上思路打算后续都试一下



## Todos

- [x] 学习 delta tracking 原理

- [x] 实现 pytorch 版本

- [ ] 解决 $\bar\mu$ 的问题

  - [ ] 尝试上面提到的思路
  - [ ] 继续看论文，找找有没有可参考的其他解决方法
  
- [ ] 实现时序降噪

- [ ] 后续优化

  - [ ] empty skipping
  - [ ] early stop
  - [ ] 实现 cuda 版本

  
