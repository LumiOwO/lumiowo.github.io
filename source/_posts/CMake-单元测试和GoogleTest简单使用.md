---
title: CMake - 单元测试和 GoogleTest 简单使用
date: 2021-01-17 20:50:43
tags: [CMake, GoogleTest]
categories: [编程语言学习与理解]
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
D:/example/build> make test
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

一般通过以下两种方式可以比较优雅地将GTest集成到项目中：

<!--More-->

#### 2.1.1 Git Submodule

使用git将GoogleTest原项目作为我们的一个子模块。虽然下面要提到的使用CMake的方案才是GTest官方推荐的办法，但导入子模块这个方案比较通用。

首先，将GTest项目从github克隆到本地。我一般把它放在`thirdparty`文件夹下：

```shell
D:/example> mkdir thirdparty
D:/example> cd thirdparty
D:/example/thirdparty> git clone https://github.com/google/googletest.git
```

这样GTest工程将会拷贝到`thirdparty/googletest`目录下。然后我们将其添加为子模块，格式如下：

```shell
$ git submodule add <仓库地址> <本地路径>
```

即：

```shell
D:/example/thirdparty> git submodule add https://github.com/google/googletest.git googletest
```

最后，在根目录的`CMakeLists.txt`中加入该目录：

```Cmake
add_subdirectory(thirdparty/googletest)
```

这样就成功将GTest集成到项目中了。

#### 2.1.2 CMake脚本

这是GoogleTest官方最推荐的方法。事实上，官方的文档中提供了4种方案：

> - **Download the GoogleTest source code manually and place it at a known location.** This is the least flexible approach and can make it more difficult to use with continuous integration systems, etc.
> - **Embed the GoogleTest source code as a direct copy in the main project's source tree.**This is often the simplest approach, but is also the hardest to keep up to date. Some organizations may not permit this method.
> - **Add GoogleTest as a git submodule or equivalent.** This may not always be possible or appropriate. Git submodules, for example, have their own set of advantages and drawbacks.
> - **Use CMake to download GoogleTest as part of the build's configure step.**This is just a little more complex, but doesn't have the limitations of the other methods.

文档中详细介绍了最后一种方案，需要用到CMake脚本来获取GTest项目到本地。该脚本在[GTest项目的Readme文档](https://github.com/google/googletest/blob/master/googletest/README.md)中已给出，如果感兴趣可以研究一下~

### 2.2 在CMake中链接GTest库

GTest提供了四个库文件：`gtest`、`gtest_main`、`gmock`、`gmock_main`。目前我们不讨论GMock，因此我们只需要用到前两个库。

很容易发现，GTest测试框架是提供了`main()`函数的。因此我们需要将待测试的功能代码添加为库文件，并把使用GTest框架的测试代码添加为可执行文件，最后将我们的库和`gtest`、`gtest_main`两个库链接到该可执行文件中去即可。

类似下面这样：

```cmake
# 待测试的功能代码
add_library(myLib src/myLib.cpp)
# 测试用例
add_executable(testBin test/test.cpp)
# 链接
target_link_libraries(testBin
    myLib
    gtest 
    gtest_main
)
```

### 2.3 基本用法

#### 2.3.1 `TEST()`

首先，大部分情况下我们不需要自己写`main()`函数。我们利用GTest提供的`TEST()`宏来完成我们的测试代码，用法如下：

```cpp
TEST(TestSuiteName, TestName) {
  ... test body ...
}
```

这里的两个参数分别是该项测试的分类名称和测试名称。这样我们在输出结果中就能根据测试的分类和名称方便地找到某一项测试的结果。

一个简单的测试样例如下：

```cpp
// test.cpp
#include "gtest/gtest.h"

TEST(hello_GTest, test1) {
    ASSERT_EQ(1, 3 - 2);
    ASSERT_EQ(3 * 2, 6);
} // pass

TEST(hello_GTest, test2) {
    ASSERT_EQ(1, -1);
} // fail
```
编译运行该测试代码，我们会得到下面的输出：

```shell
Running main() from D:\example\thirdparty\googletest\googletest\src\gtest_main.cc
[==========] Running 2 tests from 1 test suite.
[----------] Global test environment set-up.
[----------] 2 tests from hello_GTest
[ RUN      ] hello_GTest.test1
[       OK ] hello_GTest.test1 (0 ms)
[ RUN      ] hello_GTest.test2
D:\example\test\test.cpp:77: Failure
Expected equality of these values:
  1
  -1
[  FAILED  ] hello_GTest.test2 (19 ms)
[----------] 2 tests from hello_GTest (38 ms total)

[----------] Global test environment tear-down
[==========] 2 tests from 1 test suite ran. (81 ms total)
[  PASSED  ] 1 test.
[  FAILED  ] 1 test, listed below:
[  FAILED  ] hello_GTest.test2

 1 FAILED TEST
```

> **Tips:** GTest的测试结果只有文本输出，需要引入第三方软件才能有比较好看的可视化结果。官方推荐的是[GTest Runner](https://github.com/nholthaus/gtest-runner)和[GoogleTest UI](https://github.com/ospector/gtest-gbar).
>
> 这里我推荐一个VS Code里的可视化插件：[C++ TestMate](https://marketplace.visualstudio.com/items?itemName=matepek.vscode-catch2-test-adapter)，使用该插件运行上面的测试样例，可以得到下面的可视化结果：
>
> ![image-20210117205156858](CMake-%E5%8D%95%E5%85%83%E6%B5%8B%E8%AF%95%E5%92%8CGoogleTest%E7%AE%80%E5%8D%95%E4%BD%BF%E7%94%A8/image-20210117205156858.png)

#### 2.3.2 `ASSERT_*()`和`EXPECT_*()`

GTest提供了一系列用于测试执行结果是否正确的宏定义，主要有两类：`ASSERT_*()`和`EXPECT_*()`。这两个宏的区别在于，当断言失败时，`ASSERT_*()`产生一个fatal error并从当前执行的位置返回，而`EXPECT_*()`产生一个nonfatal error并运行函数继续执行。

如果你想在断言失败的时候输出一些额外的信息，使用`<<`操作符即可，例如：

```cpp
ASSERT_EQ(x.size(), y.size()) << "Vectors x and y are of unequal length";
```

下面给出若干常用的宏定义用法。

* 布尔量

|          Fatal           |         Nonfatal         |   说明   |
| :----------------------: | :----------------------: | :------: |
| ASSERT_TRUE(condition);  | EXPECT_TRUE(condition);  | 条件为真 |
| ASSERT_FALSE(condition); | EXPECT_FALSE(condition); | 条件为假 |

* 二元比较

|         Fatal          |        Nonfatal        |     说明     |
| :--------------------: | :--------------------: | :----------: |
| ASSERT_EQ(val1, val2); | EXPECT_EQ(val1, val2); | val1 == val2 |
| ASSERT_NE(val1, val2); | EXPECT_NE(val1, val2); | val1 != val2 |
| ASSERT_LT(val1, val2); | EXPECT_LT(val1, val2); | val1 < val2  |
| ASSERT_LE(val1, val2); | EXPECT_LE(val1, val2); | val1 <= val2 |
| ASSERT_GT(val1, val2); | EXPECT_GT(val1, val2); | val1 > val2  |
| ASSERT_GE(val1, val2); | EXPECT_GE(val1, val2); | val1 >= val2 |

* 字符串比较

参数为C字符串，即以`\0`字符结尾的一维字符数组。

|            Fatal             |           Nonfatal           |         说明         |
| :--------------------------: | :--------------------------: | :------------------: |
|   ASSERT_STREQ(str1,str2);   |   EXPECT_STREQ(str1,str2);   |       内容相同       |
|   ASSERT_STRNE(str1,str2);   |   EXPECT_STRNE(str1,str2);   |       内容不同       |
| ASSERT_STRCASEEQ(str1,str2); | EXPECT_STRCASEEQ(str1,str2); | 无视大小写，内容相同 |
| ASSERT_STRCASENE(str1,str2); | EXPECT_STRCASENE(str1,str2); | 无视大小写，内容不同 |

#### 2.3.3 `TEST_F()`

在构建测试样例时，我们需要在`TEST()`函数体内构建待测的数据对象。但很多时候，我们可能需要对同一组数据在多个不同的`TEST()`里进行不同的测试。这时，如果每次都手动构造同一份数据，代码会显得重复且繁杂。

GTest提供了`TEST_F()`宏和一个基类来为我们解决这个问题。为构造重复使用的数据，我们需要继承`::testing::Test`类，然后在这个新的类中构造我们的数据。例子如下：

```cpp
class QueueTest : public ::testing::Test {
protected:
    // 成员变量
    Queue<int> q0_;
    Queue<int> q1_;
    Queue<int> q2_;
    
    // 可以看做构造函数
    void SetUp() override {
        q1_.Enqueue(1);
        q2_.Enqueue(2);
        q2_.Enqueue(3);
    }

    // 可以看做析构函数，这里不需要
    // void TearDown() override {}
};
```

首先，我们需要把访问属性设为`protected`，然后继承父类的`SetUp()`和`TearDown()`函数。这两个函数相当于这个类的构造函数和析构函数。我们在`SetUp()`函数里初始化我们的数据，之后我们就可以用`TEST_F()`函数来访问这些数据了。

> **Tips:** `SetUp()`函数很容易拼成`Setup()`，导致没有覆盖父类的对应函数。因此建议使用C++11标准的`override`关键字，让编译器帮你检查拼写问题。

`TEST_F()`的使用如下所示：

```cpp
TEST_F(TestFixtureName, TestName) {
  ... test body ...
}
```

它的参数和`TEST()`类似，但在第一个参数上有所区别。`TestFixtureName`必须是我们新继承的测试类的类名。测试部分的例子如下：

```cpp
TEST_F(QueueTest, IsEmptyInitially) {
    EXPECT_EQ(q0_.size(), 0);
}

TEST_F(QueueTest, DequeueWorks) {
    int* n = q0_.Dequeue();
    EXPECT_EQ(n, nullptr);

    n = q1_.Dequeue();
    ASSERT_NE(n, nullptr);
    EXPECT_EQ(*n, 1);
    EXPECT_EQ(q1_.size(), 0);
    delete n;

    n = q2_.Dequeue();
    ASSERT_NE(n, nullptr);
    EXPECT_EQ(*n, 2);
    EXPECT_EQ(q2_.size(), 1);
    delete n;
}
```

上面这段测试代码运行时的流程是这样的：

1. GTest构建一个`QueueTest`对象，不妨称为`t1`；
2. `t1.SetUp()`申请内存并初始化数据；
3. `IsEmptyInitially`在`t1`的数据上运行；
4. 测试结束后，`t1.TearDown()`释放之前申请的内存空间；
5. `t1`对象被析构；
6. 回到第1步并运行`DequeueWorks`测试。



> **参考内容：**
>
> 1. GoogleTest - Generic Build Instructions，https://github.com/google/googletest/blob/master/googletest/README.md
> 2. Googletest Primer，https://github.com/google/googletest/blob/master/docs/primer.md
