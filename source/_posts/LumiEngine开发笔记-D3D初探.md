---
title: LumiEngine开发笔记 - D3D初探
date: 2020-06-24 00:34:10
tags: [Engine, Direct3D]
categories: [LumiEngine开发笔记]
---

> 本系列是我自己在LumiEngine个人引擎开发过程中的学习笔记。引擎的实现基于UWA课程[从零开始手敲次世代游戏引擎](https://edu.uwa4d.com/course-intro/0/164)，该课程是知乎上[同名专栏](https://zhuanlan.zhihu.com/p/28589792)系列文章的作者在UWA学堂上发布的整理汇总。
>
> LumiEngine项目的github地址： https://github.com/SolarBear251/LumiEngine 

这部分的内容被课程作者成为“支线任务”，因为这部分代码并不会成为我们引擎的一部分。但是，对于现代的图形接口，包括Direct3D、OpenGL等，对他们的学习了解是非常有必要的。况且我目前对渲染管线的部分细节了解的还不是特别清楚，对OpenGL的了解也仅限于图形学课上用的古老的glut库，所以这部分支线任务还是要认真对待一下。

之后我会对渲染管线的内容再系统地学习一下，然后写一篇文章记录下来。这篇文章中，我们先来看一看Direct3D相关。

另外，我个人觉得，既然是跟着别人的教程自己实现，就千万不要Ctrl+C, Ctrl+V直接拷贝过来用，宁愿一个字一个字照原样手敲一遍。因为在手敲的过程中会有很充足的时间思考这一行究竟在干什么，而直接复制粘贴过来以后很多细节自己就根本不会注意了。

## D2D

课程首先展示的是Direct2D API的使用。

首先，定义4个全局变量：

```C++
ID2D1Factory            *pFactory = nullptr;
ID2D1HwndRenderTarget   *pRenderTarget = nullptr;
ID2D1SolidColorBrush    *pLightSlateGrayBrush = nullptr;
ID2D1SolidColorBrush    *pCornflowerBlueBrush = nullptr;
```

D2D的库是以一种被称为“COM组件”的方式提供的。

之后需要设计创建画布的函数。D2D为我们封装了很多接口去使用GPU绘图，但是同时我们也少了很多控制的余地。这也是之后DX12所要解决的问题。

<!--More-->

```C++
HRESULT CreateGraphicsResources(HWND hWnd) {
    HRESULT hr = S_OK;
    if(pRenderTarget != nullptr) 
        return hr;
    
    RECT rc;
    GetClientRect(hWnd, &rc);
    D2D1_SIZE_U size = D2D1::SizeU(
        rc.right - rc.left,
        rc.bottom - rc.top
    );
    
    hr = pFactory->CreateHwndRenderTarget(
        D2D1::RenderTargetProperties(),
        D2D1::HwndRenderTargetProperties(hWnd, size),
        &pRenderTarget
    );
    if(SUCCEEDED(hr)) {
        hr = pRenderTarget->CreateSolidColorBrush(
            D2D1::ColorF(D2D1::ColorF::LightSlateGray),
            &pLightSlateGrayBrush
        );
    }
    if(SUCCEEDED(hr)) {
        hr = pRenderTarget->CreateSolidColorBrush(
            D2D1::ColorF(D2D1::ColorF::CornflowerBlue), 
            &pCornflowerBlueBrush);
    }

    return hr;
}
```

使用D2D绘图的流程基本如下：创建窗口 -> 创建绘制资源 -> 进入消息循环 -> 当遇到WM_PAINT事件时进行绘制 -> 结束时释放资源。

由于代码比较多，这里就不详细展开了，细节可以参考原课程的内容。这大概是我写的第一个与GPU绘图有关的程序了。

最后输出的结果如下图所示：

![image-20200628124013802](LumiEngine%E5%BC%80%E5%8F%91%E7%AC%94%E8%AE%B0-D3D%E5%88%9D%E6%8E%A2/image-20200628124013802.png)

## D3D

接下来使用Direct3D 11 接口绘制一个3D图形。

基本窗体的创建没有任何变化。这里不需要COM的相关代码，原因应该是D3D11的库中已经进行了相关处理。没有具体考证过。

在成功创建了窗体后，调用了下面几个函数：

```C++
if(hr == S_OK) {
    CreateRenderTarget();
    SetViewPort();
    InitPipeline();
    InitGraphics();
}
```

第一个函数为创建画布。

第二个函数用于设置视口，因为可能会存在多人分屏游玩的游戏，或者类似VR这种需要左眼和右眼两个不同视口的程序。

第三个函数用于初始化渲染管线。GPU进行3D渲染时，一般会有顶点变换、像素化、像素填色这3个阶段。这个过程中，顶点变换和填色是可以编程的，也就是所谓的Shader编程。而在这个初始化函数中就读入了两个shader程序的结果。

第四个函数用于传入实际绘制的模型信息。这里只绘制一个三角形。需要注意的是，D3D采用左手坐标系。我认为左手坐标系的优点就是z轴指向屏幕里面，这样大部分物体的z坐标都是正值，而右手坐标系的优点就是与理论知识的常用定义吻合。二者皆有优劣。

于是我第一次接触到的Shader程序终于出现了：

这里的着色器实际上没有做任何变化，只是将输入原样输出，因此命名为copy。毕竟是作为刚接触的教程用，至少让我知道了Shader到底是在干什么。

首先是顶点着色器copy.vs：

```c
#include "cbuffer.h"
#include "vsoutput.hs"

v2p main(a2v input) {
    v2p output;
    output.position = float4(input.position, 1.0);
    output.color = input.color;

    return output;
}
```

之后是像素着色器copy.ps：

```C
#include "vsoutput.hs"

float4 main(v2p input): SV_TARGET {
    return input.color;
}
```

引用的两个头文件是两个数据结构定义，分别定义了应用程序传给Vertex Shader的数据结构和Vertex Shader输出给Pixel Shader的数据结构。

cbuffer.h：

```C
struct a2v {
    float3 position: POSITION;
    float4 color:    COLOR;
};
```

vsoutput.hs

```C
struct v2p {
    float4 position: SV_POSITION;
    float4 color: COLOR;
};
```

这里

``` 
fxc /T vs_5_0 /Zi /Fo copy.vso copy.vs
fxc /T ps_5_0 /Zi /Fo copy.pso copy.ps
```

最后重新编译代码，可以得到如下的过渡色三角形。

![image-20200628123951320](LumiEngine%E5%BC%80%E5%8F%91%E7%AC%94%E8%AE%B0-D3D%E5%88%9D%E6%8E%A2/image-20200628123951320.png)

实际上，我们的程序给GPU的只有三个顶点的位置和颜色信息。对于其他的点，GPU根据该点到三个顶点的重心坐标进行插值运算得到的。这个插值不仅仅发生在position参数中，也发生在color参数中，最终形成了渐变色的结果。

感觉自己终于踏进了3D绘制的大门。大门后面的路还很远呢！

但总感觉自己折腾了这么久，真正用在引擎里面的代码貌似基本上没开始。。下一篇笔记我打算先跳开支线任务的学习，去实现一个能用在引擎里面的有意思的模块。