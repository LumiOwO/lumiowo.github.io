---
title: 【CMake的使用】单元测试和GoogleTest简单使用
date: 
tags: [CMake, GoogleTest]
categories: [CMake的使用]
---

单元测试是项目中非常重要的一个环节。在开发的过程中，应该养成每实现一个小模块就相应地做一系列单元测试的习惯，以保证该模块的正确性。这篇文章将简单介绍GTest框架以及如何利用CMake为自己的项目添加单元测试模块。

## 运行环境

 Windows + gcc 4.9.2 + GNUWin32，使用VS Code的CMake Tools插件 

##  1 CMake集成的测试工具——CTest

要使用CTest，用户需要先写一份测试代码。通常我们会使用一些测试框架来辅助我们进行测试（如下面的GTest），但这里我们先用最原始的方式，即在代码中使用`assert()`语句来判断结果的正确性，类似下面这样：

```c++
// test.cpp
#include <cassert>
int main() {
    assert(2 * 3 == 6);  // true
    assert(2 * 3 == 5);  // false
    assert( /* Expression */ )
}
```

使用`assert()`的目的是当测试结果不正确时，测试程序会终止，从而能被CTest检测到该测试程序是否正常结束。

在`CMakeLists.txt`文件中，首先将我们设计的功能代码添加为库文件，例如，

```cmake
add_library(hello_lib hello.cpp)
```

之后，开启CTest测试模块，

```cmake
enable_testing()
```

然后添加一个用于测试的可执行文件，并将需要测试的库文件链接到该可执行文件上，

```cmake
add_executable(hello_test test.cpp)
target_link_libraries(hello_test
    hello_lib
)
```

最后，使用`add_test()`函数为CTest添加一个测试项，

```cmake
add_test(test1 hello_test)
```

`add_test()`函数的参数形式可以更加复杂，详细可以参阅[CMake的官方文档](https://cmake.org/cmake/help/latest/command/add_test.html)。这里是一种简单用法，第一个参数是该测试项的名字，第二个参数是该测试项对应的可执行文件的名字。因为这两个参数指代的对象不同，所以即便它们像下面这样名称相同，CMake也不会报错：

```cmake
add_test(hello_test hello_test)
```

之后建立`build`目录并构建CMake项目。这里我使用了VS Code的CMake Tools插件帮我完成了这个步骤。

进入`build`目录，输入`make test`命令，就能看到CTest的测试结果。测试通过时输出如下所示：

```shell
D:/example/build>make test
Running tests...
Test project D:/example/build
    Start 1: Test1
1/2 Test #1: Test1 ............................   Passed    0.42 sec
    Start 2: Test2
2/2 Test #2: Test2 ............................   Passed    0.36 sec

100% tests passed, 0 tests failed out of 2

Total Test time (real) =   0.82 sec
```

## 2 GTest——GoogleTest

GoogleTest是Google的开源C++单元测试框架，主要有GTest和GMock两个功能模块。这里简单介绍一下GTest模块的基本用法，GMock模块等以后有机会使用的时候再来研究。

### 2.1 集成GTest到项目中

<!--More-->

### 2.2 基本用法

```cpp
// asda
int main() {
    int a = 12;
}
class A {
    printf("asd");
}
```



### 2.3 实例

## 3 VS Code中的可视化插件



> **参考内容：**
