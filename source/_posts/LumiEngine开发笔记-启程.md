---
title: LumiEngine开发笔记 - 启程
date: 2020-06-23 22:17:30
tags: [Engine]
categories: [LumiEngine开发笔记]
---

> 本系列是我自己在LumiEngine个人引擎开发过程中的学习笔记。引擎的实现基于UWA课程[从零开始手敲次世代游戏引擎](https://edu.uwa4d.com/course-intro/0/164)，该课程是知乎上[同名专栏](https://zhuanlan.zhihu.com/p/28589792)系列文章的作者在UWA学堂上发布的整理汇总。
>
> LumiEngine项目的github地址： https://github.com/LumiOwO/LumiEngine

## 前言

在导师的实验室里做引擎相关的工作时，很多流程都是一知半解的，硬啃教材和课程又很难理解，所以一直都很想从头开始搭建一个与当前最新的架构类似的渲染引擎。所谓实践出真知，自己把相关原理实现一遍以后，对技术的理解程度会透彻很多。

机缘巧合，在UWA学堂上看到了《从零开始手敲次世代游戏引擎》这门课程，决定跟着大佬的教程一步步把自己的引擎搭起来。粗略地浏览了一下这个专栏，感觉作者真的特别强，而且目前这个专栏仍在持续更新，希望自己能从中学到一些作者的工程思维和能力吧233 

当前的目标是尽量能追上作者发布的新内容，并在引擎逐渐完善之后加入一些自己的内容。

## 总览

这篇专栏课程最吸引我的地方，除了可以学到渲染技术之外，就是作者一开始就强调的“跨平台”和“性能”。从我刚学编程语言到现在，写出来的代码基本上就没有考虑过这两个东西。

目前我打算只支持Windows和Linux两个平台作为学习内容，后续如果自己能力足够了再扩展到Mac等平台。

## Clang环境配置 - Windows平台

要想支持跨平台，就不能使用Visual Studio进行项目的编译，而是要寻找一个跨平台的工具链。课程中使用的是Clang，因为Clang比较年轻而且现在比较流行。所以，我们需要准备好编译Clang的环境。由于日常使用的环境都是Windows，因此先在Windows平台上配置好Clang工具链。

<!-- more -->

教程中让我们安装TortoiseSVN获取LLVM的源码。亲测SVN慢到令人发指。。（Tortoise这个名字取得还挺贴切）最后发现github上面有LLVM移植过去的llvm-project，于是用github -> gitee -> clone的方式曲线救国，终于把LLVM的代码拉下来了。之后就是用Cmake生成Visual Studio工程并编译，我这边选择的是x64的Release版，编译时间大约一个半小时。

编译结束以后，课程中提到需要执行Clang的测试程序，防止编译后的Clang程序有bug导致后续的工程里出现找不到问题所在的谜之bug。官网上给出的执行Clang测试的命令如下：

```
python (path to llvm)\llvm\utils\lit\lit.py -sv
  --param=build_mode=Win32 --param=build_config=Debug
  --param=clang_site_config=(build dir)\tools\clang\test\lit.site.cfg
 (path to llvm)\llvm\tools\clang\test
```

但是我一直都没能成功执行这条命令。。把上面的`build_mode=Win32`改成`build_mode=x64`，`build_config=Debug`改成`build_config=Release`这些操作也都尝试了，但一直都会报下面的错误：

```
lit.py: D:\111\projects\llvm-project\llvm\utils\lit\lit\TestingConfig.py:102: fatal: unable to parse config file 'D:\\111\\projects\\llvm-project\\llvm\\tools\\clang\\test\\lit.cfg.py', traceback: Traceback (most recent call last):
  File "D:\111\projects\llvm-project\llvm\utils\lit\lit\TestingConfig.py", line 89, in load_from_path
    exec(compile(data, path, 'exec'), cfg_globals, None)
  File "D:\111\projects\llvm-project\llvm\tools\clang\test\lit.cfg.py", line 25, in <module>
    config.test_format = lit.formats.ShTest(not llvm_config.use_lit_shell)
AttributeError: 'NoneType' object has no attribute 'use_lit_shell'
```

这里的问题暂且搁置，毕竟跑不起来的只是测试程序，目前Clang是可以编译Hello World的，先认为这个Clang没有问题吧，以后如果实在有搞不定的bug再来考虑是不是Clang的问题。。需要注意的是，使用Clang编译C++代码需要在Visual Studio开发人员命令行中，否则会提示缺少标准库等错误。

配置环境实在是太麻烦了，所以我计划先在Windows平台上实现一小部分功能，之后再去配Linux的环境。

## 引擎程序入口

终于要开始写引擎的代码了！！

定义好应用程序的接口（Interface和implements是宏定义，为了让代码更可读）：

```c++
interface IApplication: implements IRuntimeModule
{
public:
    virtual ~IApplication() { }

    virtual int initialize() = 0;
    virtual void finalize() = 0;

    virtual void tick() = 0;

    virtual bool isQuit() = 0;
};
```

然后做一个基础应用程序BaseApplication，里面所有的内容为空即可：

```C++
int BaseApplication::initialize() {
    _quit = false;
    return 0;
}

void BaseApplication::finalize() {

}

void BaseApplication::tick() {

}

bool BaseApplication::isQuit() {
    return _quit;
}
```

最后完成我们的入口main函数：

``` C++
#include <iostream>
#include "IApplication.hpp"

namespace Lumi {
    extern IApplication *g_pApp;
}

int main(int argc, char **argv) {
    int ret;
    if((ret = Lumi::g_pApp->initialize()) != 0) {
        std::cout << "App initialize failed. Exit now" << std::endl;
        return ret;
    }

    while(!Lumi::g_pApp->isQuit()) {
        Lumi::g_pApp->tick();
    }

    Lumi::g_pApp->finalize();

    return 0;
}
```

由于`g_pApp`是外部全局变量，我们在EmptyApplication里创建这个全局变量

```C++
#include "BaseApplication.hpp"

namespace Lumi {
    BaseApplication g_App;
    IApplication *g_pApp = &g_App;
};
```

最后是添加Cmake，然后编译运行，我们的引擎终于第一次跑起来了！虽然它现在什么也不会做233

​	





