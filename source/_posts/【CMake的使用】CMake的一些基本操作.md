---
title: 【CMake的使用】CMake 的一些基本操作
date: 2021-01-11 11:11:13
tags: [CMake]
categories: [CMake的使用]
---

>  对github项目https://github.com/ttroy50/cmake-examples.git 进行学习总结 

## 运行环境

 Windows + gcc 4.9.2 + GNUWin32，使用VS Code的CMake Tools插件 

##  1 Out-of-Source Build

在构建CMake项目时，一个非常重要的原则是：不要把构建后生成的文件和源代码混在一起！

一般采取的做法是在项目根目录下新建一个build目录，然后在build目录中构建Cmake项目。这样如果需要重新构建项目，只需要把build目录删掉再重新构建即可，不会污染原项目的文件结构。

CMake命令如下：

```sh
mkdir build
cd build
cmake ..    # 构建CMake项目，生成Makefile文件
make        # 根据Makefile文件生成可执行文件
```

由于我使用gcc编译并且安装了GNUWin32，因此可以使用make命令生成可执行文件。一般在Windows环境下会默认使用Visual Studio的编译器，这样在执行`cmake ..` 命令后会生成`.sln`后缀的VS项目，使用Visual Studio打开并构建工程即可。

##  2 最简单的情况 —— Hello CMake

如果我们整个工程里面只有一个源文件main.cpp，CMake文件只需要三行即可：

<!-- more -->

首先声明CMake的最小版本号，低于该版本号的CMake将不能继续执行后面的命令。这里的最小版本号为3.5。

```Cmake
cmake_minimum_required(VERSION 3.5)
```

之后声明工程名称：

```cmake
project(hello_cmake)
```

最后添加输出的可执行文件：

```cmake
add_executable(hello_cmake main.cpp)
```

或者：

```cmake
add_executable(${PROJECT_NAME} main.cpp)
```

第一个参数是生成的可执行文件的文件名。很多情况下可执行文件名称与工程名相同，因此用变量`${PROJECT_NAME}`来表示工程名。注意该变量是`project()`函数生成的，因此在`project()`函数之前调用该变量将不会得到正确的工程名。

后面跟着的若干个参数是与该可执行程序相关的所有源文件，这里只有一个main.cpp文件。

以上三行就是CMakeLists.txt的全部内容，按上一节的操作执行一系列命令即可得到`hello_cmake.exe`可执行文件。

## 3 编译多个文件

假设当前需要编译在`src`目录下的`Hello.cpp`和`main.cpp`两个文件。可以在CMake文件里设置一个变量来表示所有需要编译的文件。这里我们定义的变量名为`SOURCES`：

```cmake
set(SOURCES
    src/Hello.cpp
    src/main.cpp
)
```

也可以使用模糊匹配来获得文件夹下所有以.cpp后缀结尾的文件：

```cmake
file(GLOB SOURCES "src/*.cpp")
```

这样在`add_executable()`函数中，使用`${SOURCES}`表示所有的源文件即可：

```cmake
add_executable(${PROJECT_NAME} ${SOURCES})
```

> **Tips:** 最新的CMake规范不推荐用一个变量来表示所有的源文件，而是建议直接在`add_xxx()`函数里声明每一个源文件，例如：
>
> ```cmake
> add_executable(${PROJECT_NAME}
>     src/Hello.cpp
>     src/main.cpp
> )
> ```

## 4 添加头文件所在目录

很多工程会把所有头文件放在一个单独的include文件夹里。一个可执行文件被看做一个target。使用` target_include_directories() `函数可以指定target包含的头文件路径，这相当于在编译时加入了`-I`选项。

假设当前只依赖一个头文件，路径为`include/Hello.h`，我们需要把`include`文件夹加入`-I`编译选项，因此在CMake文件中添加以下内容：

```cmake
target_include_directories(hello_headers
    PRIVATE 
    ${PROJECT_SOURCE_DIR}/include
)
```

第一个参数为目标名，这里为`hello_headers`.

第二个参数限定了依赖的使用范围，总共有三种不同的属性：

|   类型    |                   说明                   |
| :-------: | :--------------------------------------: |
|  PRIVATE  |     只在目标内部使用，外部文件不使用     |
| INTERFACE | 只在目标的外部文件中使用，目标本身不使用 |
|  PUBLIC   |     **PUBLIC = PRIVATE + INTERFACE**     |

第三个参数即为头文件所在的目录。这里使用了`${PROJECT_SOURCE_DIR}`变量表示工程顶层目录。CMake中预设了许多变量来方便用户寻找某些常用的路径：

|            变量            |                    说明                     |
| :------------------------: | :-----------------------------------------: |
|      CMAKE_SOURCE_DIR      |                工程顶层目录                 |
|     PROJECT_SOURCE_DIR     |                    同上                     |
| \<ProjectName\>_SOURCE_DIR |                    同上                     |
|  CMAKE_CURRENT_SOURCE_DIR  |      当前的CMakeLists.txt文件所在目录       |
|      CMAKE_BINARY_DIR      |     工程编译发生的目录，一般为build目录     |
|     PROJECT_BINARY_DIR     |                    同上                     |
| \<ProjectName\>_BINARY_DIR |                    同上                     |
| CMAKE_CURRRENT_BINARY_DIR  | 当前target的编译目录，一般为build的子文件夹 |

## 5 构建静态库

现在我们尝试把`Hello.cpp`的内容构建成静态库，再把这个静态库和`main.cpp`链接起来得到可执行文件。

首先，我们构建该静态库，使用的是`add_library()`函数，用法和之前的`add_executable()`函数类似。

```cmake
add_library(hello_library STATIC 
    src/Hello.cpp
)
```

第一个参数为静态库的名称，这里命名为`"hello_library"`.

第二个参数为库的类型，`STATIC`表示静态库，`SHARED`表示动态库。

后面列出该静态库的所有源文件。

一个库文件也被看做一个target。因此我们同样需要指定库文件包含的头文件目录：

```cmake
target_include_directories(hello_library
    PUBLIC 
    ${PROJECT_SOURCE_DIR}/include
)
```

这里访问属性声明为`PUBLIC`，因为用到的`Hello.h`在静态库外部的`main.cpp`文件中也会被用到。

构建好静态库后，下一步我们开始构建可执行文件。总共分为两步：先用`add_executable()`函数根据所需的源文件创建可执行文件，再用`target_link_libraries()`函数将之前的静态库链接到可执行文件中。

```cmake
add_executable(hello_binary 
    src/main.cpp
)
target_link_libraries(hello_binary
    PRIVATE 
    hello_library
)
```

这里的`target_xxx()`函数的访问属性声明为`PRIVATE`，因为在该例中这个库不会被其他外部文件所使用。

> **Tips:** 对于`PUBLIC`属性的头文件，一个非常推荐的做法是使用子文件夹来限定"命名空间"从而防止同名头文件的冲突。
>
> 需要注意的是，CMake里添加的头文件目录仍然是所有头文件的根目录，即`include`目录，这样我们在C++中引用的头文件路径就是从该目录开始的相对路径。
>
> 在该例中，`Hello.h`的文件路径如下：
>
> ```shell
> ├── include
>     └── static
>         └── Hello.h
> ```
>
> 因此在C++中引用`Hello.h`时，需要写成：
>
> ```cpp
> #include "static/hello.h"
> ```

## 6 构建动态库

现在我们尝试把`Hello.cpp`的内容构建成动态库，再把这个动态库和`main.cpp`链接起来得到可执行文件。

这里的步骤与静态库类似，只需要将`STATIC`关键字替换成`SHARED`即可，步骤如下：

```cmake
# 添加动态库
add_library(hello_library SHARED 
    src/Hello.cpp
)
target_include_directories(hello_library
    PUBLIC 
    ${PROJECT_SOURCE_DIR}/include
)
# 添加可执行文件并链接动态库
add_executable(hello_binary
    src/main.cpp
)
target_link_libraries(hello_binary
    PRIVATE 
    hello_library
)
```

> **Tips:** 类似地，在该例中，`Hello.h`的文件路径如下：
>
> ```shell
> ├── include
>     └── shared
>         └── Hello.h
> ```
>
> 因此在C++中引用`Hello.h`时，需要写成：
>
> ```cpp
> #include "shared/Hello.h"
> ```

## 7 目标的别名(Alias)

在之前的动态库构建例子中，原作者用下面的语句为动态库起了一个别名：

```cmake
add_library(hello::library ALIAS hello_library)
```

该别名用来指代原目标名称，但是只能在只读(read-only)的环境下使用。（这里的双冒号`::`貌似没有特殊含义，只是作为名称的一部分，如果理解错误了请见谅）

这样在链接动态库时，我们就可以使用别名来链接了：

```cmake
target_link_libraries(hello_binary
    PRIVATE 
    hello::library
)
```

> **参考内容：**
>
> 1. ttroy50 / cmake-examples，https://github.com/ttroy50/cmake-examples.git
> 2. cmake：target_** 中的 PUBLIC，PRIVATE，INTERFACE，https://zhuanlan.zhihu.com/p/82244559
> 3. cmake 常用变量和常用环境变量查表手册---整理，https://www.cnblogs.com/xianghang123/p/3556425.html

