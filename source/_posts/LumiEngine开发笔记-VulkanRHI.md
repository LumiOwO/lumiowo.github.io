---
title: LumiEngine 开发笔记 - Vulkan RHI
date: 2021-10-09 20:15:39
tags: [Engine, Vulkan]
categories: [LumiEngine开发笔记]
---

> LumiEngine on Github: https://github.com/LumiOwO/LumiEngine 

## 1 前言

事实证明，照抄别人的代码对自己的帮助是非常小的。。大佬在《[从零开始手敲次世代游戏引擎](https://edu.uwa4d.com/course-intro/0/164)》教程里设置的目标是搭建一个次世代的高性能引擎，而我目前的目标是了解引擎结构和实时渲染基本算法。在看教程前半段包括内存管理、资源读取等内容时，我甚至有点丧失开发引擎的兴趣了。（这就是你鸽了快一年多理由吗x）

因此，我重新计划了引擎开发的目标，以目标为导向，先实现预期效果，之后再考虑优化问题。同时，博客内容尽量精简，毕竟自己不是大佬，做的是笔记而不是教程，所以今后只把自己对关键部分的理解记录下来，若有错误，欢迎评论或邮件！

现阶段的目标：

- 搭建引擎基本框架
- 底层 Vulkan 管线
- 抽象层 RenderManager 
- 设计场景结构，以加载模型并渲染
- 基本的 Binn-Phong 材质

## 2 基本框架

仍然采用教程中介绍的运行时模块 + 主循环的框架，主体代码如下。

```c++
// Initialize
for (auto it = modules.begin(); it != modules.end(); ++it) {
    (*it)->Initialize();
}
// Tick
while (!gApplication->IsQuit()) {
    for (auto &module : modules) {
        module->Tick();
    }
}
// Finalize in reverse order
for (auto it = modules.rbegin(); it != modules.rend(); ++it) {
    (*it)->Finalize();
}
```

资源加载和内存管理这些“高级”模块以后再说，先想办法让窗口上有东西显示再说。

## 3 Vulkan

之前做毕设的时候稍微接触了一点 Vulkan 的光线追踪，干脆就先把 DX12 放放，来看看 Vulkan 究竟是怎么一回事。

顺着 [Vulkan Tutorial](https://vulkan-tutorial.com/) 的 Triangle hello-world 实现了一遍，终于在引擎上画出了一个三角形。目前的顶点数据是在 shader 里给的，还没有用到 Vertex buffer。下面是我对 Vulkan 搭建流程的理解。

### 3.1 初始化

- 初始化 Vulkan Instance

需要 `VkApplicationInfo `和 `VkInstanceCreateInfo` 两个 Info 以创建 instance。

为了方便 Debug，需要添加 Vulkan SDK 提供的 `VK_LAYER_KHRONOS_validation` 层。在代码实现的过程中遇到了该层找不到的问题，解决方案[见这里](#jump)。

- 创建 Windows Surface

将窗口的 Handle 交给 Vulkan 接管。Tutorial 中使用的是 glfw 的内置函数，我们这里使用的是 Windows 原生窗口，直接将 HWND 变量传给对应的 Vulkan 函数即可。

- 选择物理设备

遍历所有的物理设备，对每个物理设备进行打分，并排除掉不支持特定功能的设备，选择分数最高者。

- 创建逻辑设备

同时，根据物理设备的支持，创建所需的命令队列，并将这些队列传入逻辑设备的 createInfo 中，从而创建逻辑设备

### 3.2 SwapChain

<!--More-->

- Surface format

Swap chain 中存储图像的格式，一般是RGBA 32bit，SRGB 颜色空间

- Present mode

`VK_PRESENT_MODE_IMMEDIATE_KHR`：绘制结束后立刻显示，可能造成画面撕裂

`VK_PRESENT_MODE_FIFO_KHR`：FIFO，每次屏幕刷新时显示队首的帧，每次绘制结束后插在队尾，如果队列满了需要等待

`VK_PRESENT_MODE_FIFO_RELAXED_KHR`：与上一条类似，唯一的区别是，如果队列为空，该方法会立即显示绘制好的帧，可能造成画面撕裂

`VK_PRESENT_MODE_MAILBOX_KHR`：又称为“三重缓存(triple buffering)”，与第二条类似，区别在于当队列满时，在队中的帧会被新来的帧替换掉

- Extent

窗口的实际大小(宽 x 高)

- Image Views

Swap chain 里的 Frame buffer 不能直接显示，我们需要额外声明 image view 来将这些 buffer 里的内容显示在窗口中

### 3.3 Render pass 与 渲染管线

- Render pass

一个 Render pass 可以理解为以下流程：

```
读取Framebuffer -> 渲染管线 -> Sub-passes（例如后处理） -> 写回Framebuffer
```

因此，Render pass 的创建参数不关心渲染管线的细节，而是关心对 Framebuffer 的 load、store操作，以及可能存在的 sub-pass 的操作。

- shader 模块

目前只考虑 vertex shader 和 fragment shader。需要读取已编译的 shader 并创建对应的 shader module。

- 固定函数模块

Vulkan 允许我们配置渲染管线中的固定流程，例如顶点输入、顶点拓扑格式、光栅化、Viewport裁剪、深度测试、Blend等。

- 动态模块

部分模块可以声明为动态的，这样只需要在绘制时传入修改的参数即可，无需重新构建新的 pipeline

- Pileline layout

用于向GPU传递一些 uniform 的 buffer，例如变换矩阵、纹理贴图等。

### 3.4 Command队列

Vulkan 提供了一系列命令队列。我们可以在开始绘制之前，先在队列中填好绘制需要的命令，这样在绘制过程中，只需要将数据传递给GPU，GPU便会安装预先给定的命令队列依次执行，不需要进行函数调用，这样可以提高执行效率。

我们需要对 swap chain 里的每一个 frame buffer 都创建一个 command buffer，并填入以下命令：

- `vkCmdBeginRenderPass`：开始绘制
- `vkCmdBindPipeline`：绑定绘制所用的渲染关系
- `vkCmdDraw`：执行绘制操作
- `vkCmdEndRenderPass`：结束绘制

### 3.5 主循环绘制函数

在主循环内，我们需要顺序地做三件事情：

（1）从 swap chain 中取一个 frame

（2）把这个 frame 对应的 command 队列提交给GPU执行

（3）将得到的结果写入swap chain，展示在窗口中

因为上面三个操作都是向 GPU 传递信息，指导 GPU 应该做什么事情，因此他们都是异步进行的。所以我们需要引入一系列同步变量，以保证上面三步顺序执行。

- 信号量 Semaphore

用于同步 GPU-GPU 的操作。实现过程中遇到的问题：由于 Tutorial 中起的变量名比较容易混淆，我传给`presentInfo.pWaitSemaphores`的信号量传错了，导致(2)、(3) 两步都依赖 (1) 的释放，从而导致 (2)、(3) 的执行先后顺序无法保证。只有(1) -> (2) 和 (2) -> (3) 这两个过程使用不同的信号量，才能保证这三步顺序执行。

- Fence

用于同步 CPU-GPU 的操作，可以通过`vkWaitForFences`主动等待信号量释放。

CPU 端需要用 Fence 在两个地方主动同步：

（1）每个 frame in flight 对应一个 fence

Frames in flight 指同一时间可以有多个帧同时在GPU中进行绘制。这里的同步保证了在 GPU 中同时渲染的帧数量不会超过给定的最大值

（2）每个 frame buffer 对应一个 fence

如果GPU中同时绘制的帧数超过frame buffer总数时，有可能出现这种错误情况：取到的待绘制的下一帧已经在GPU中进行绘制了。因此我们需要每一帧对应一个 fence，以跟踪该帧是不是已经在GPU中了；如果是，则要主动等待同步。

## 4 一些踩坑

**CMake 编译 shader**

编译工程的时候发现，修改 shader 源代码后并不会对 shader 进行编译，于是转头研究了半天 CMake，碰钉子的过程中发现了 CMake 的以下特征：

- `execute_process()` 在 Configure 阶段执行，而`add_custom_command()` 是在 Build 阶段执行的
- `add_custom_command()` 的 Output 参数必须被其他 target 依赖，否则该条`add_custom_command() `语句不会被执行
- 可以用`add_custom_target()` 为你的 `add_custom_command()` 添加一个自定义target，该 target 执行编译 shaders 的命令
- （未成功）如果在`add_custom_target()`中声明了`ALL`参数，那么任何 build 过程中都会执行这个 target
- 在子文件夹里的 CMakeLists.txt 定义的内容，父文件夹里是访问不到的！！

**Vulkan 初始化时<span id="jump">找不到 `VK_LAYER_KHRONOS_validation`</span>**

可以参考[这篇博客](https://www.asawicki.info/news_1683_vulkan_layers_dont_work_look_at_registry)的内容。不知道是什么原因，我的注册表在`HKEY_LOCAL_MACHINE\SOFTWARE\Khronos\Vulkan\ExplicitLayers`处是空的。把 Vulkan SDK 中提供的 json 文件路径（例如`D:\VulkanSDK\1.2.162.1\Bin\VkLayer_khronos_validation.json`）加入到注册表的这个位置以后，Vulkan 就能找到`VK_LAYER_KHRONOS_validation`了。
