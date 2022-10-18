---
title: C++11 - STL中的有序结构
date: 2021-12-11 22:56:04
tags: [C++]
categories: [编程语言学习]
---

最近做课程的大作业时频繁用到 C++ STL 的有序容器，在此记录一下各种结构的用法与摸索出来的小技巧。

## 1 `std::vector` 的排序和搜索

`std::vector` 是比较常用的 STL 容器。假设我们现在有这样一个 `arr`：

```c++
auto arr = std::vector<int>{4, -3, 1, 5, 2};
```

我们可以使用 `std::sort()` 函数对该数组进行排序，使用该函数需要引用头文件 `<algorithm>`。我们只需将 `arr` 开始和结束位置的 iterator 传递给 `std::sort()` 函数，即可对其进行排序。

```c++
#include <algorithm>

std::sort(arr.begin(), arr.end());
// result: -3 1 2 4 5
```

我们还可以通过 lambda 表达式定义不同的排序方式，只需要将用于比较的 lambda 表达式当成第三个参数传递给 `std::sort()` 函数即可。默认情况下，该比较函数为 `operator<` 函数，将 `arr` 从小到大进行排序。

如果我们想将 `arr` 按照从大到小的顺序排序，则将比较函数改为大于即可。

```c++
std::sort(arr.begin(), arr.end(),
          [](const int& a, const int& b) { return a > b; });
// result: 5 4 2 1 -3
```

又例如，我们想将 `arr` 按照平方的值从小到大进行排序：

```c++
std::sort(arr.begin(), arr.end(),
          [](const int& a, const int& b) { return a * a < b * b; });
// result: 1 2 -3 4 5
```

另外，很多时候我们需要在 `arr` 中搜索满足条件的值。C++ 提供了 `std::find_if()` 函数，通过 lambda 表达式给定查找规则，返回一个 iterator。若查找成功，该 iterator 指向的是第一个符合查找规则的元素；否则，该 iterator 指向的是 `arr` 的末尾。

例如，我们想要找到 `arr` 中第一个小于 0 的数：

```c++
auto it = std::find_if(arr.begin(), arr.end(),
                       [](const int& val) { return val < 0; });
std::cout << *it; // result: -3
```

## 2 有序结构

### 2.1 堆 —— `std::priority_queue`

为了方便说明，我们先对 `int` 类型进行操作。有关自定义结构体的内容详见<a href="{% post_path 'C-11-STL中的有序结构' %}#3-对自定义结构进行排序">第3节</a>。

我们可以使用 STL 提供的 `std::priority_queue` 结构来表示一个堆。如果我们想要有一个最大堆 `maxHeap`，可以用下面的方式定义：

<!--More-->

```c++
#include <queue>

auto maxHeap = std::priority_queue<int>();
```

这里我们只用到了一个模板参数。其实，可用的模板参数总共有三个。下面定义的 `maxHeap` 与之前的完全等价。

```c++
auto maxHeap = std::priority_queue<int, std::vector<int>, std::less<int>>();
```

这三个模板参数分别有如下含义：

- `int` ：元素类型
- `std::vector<int>` ：用来存储堆中元素的容器类型，默认为 `std::vector`
- `std::less<int>` ：该类型用于对两个元素的大小进行比较，默认为 `std::less`
    - 在 `std::less` 内部，会去调用元素类型的 `operator<` 函数进行比较

需要注意的是，使用 `std::less` 参数得到的是最大堆。因此，如果我们想要得到一个最小堆 `minHeap` ，可以使用 `std::greater` 参数。

```c++
auto minHeap = std::priority_queue<int, std::vector<int>, std::greater<int>>();
```


> **Tips:** less 定义最大堆，greater 定义最小堆。

堆的常用操作如下：

- `push(val)` ：将 `val` 插入堆中
- `top()` ：查看堆顶元素
- `pop()` ：删除堆顶元素，注意没有返回值

下面给出了一个最小堆的使用例子。

```c++
auto minHeap = std::priority_queue<int, std::vector<int>, std::greater<int>>();
minHeap.push(4);
minHeap.push(-3);
minHeap.push(1);
minHeap.push(5);
minHeap.push(2);

while (!minHeap.empty()) {
    std::cout << minHeap.top() << ' ';
    minHeap.pop();
}
// result: -3 1 2 4 5  
```

### 2.2 有序列表 —— `std::set` 和 `std::map`

同样，这里我们先对 `int` 类型进行操作。有关自定义结构体的内容详见[第3节](#3-对自定义结构进行排序)。

STL 中的 `std::set` 和 `std::map` 结构的底层是用红黑树实现的，因此除了 set 和 map 本身的功能，我们还可以把这两个结构当做有序列表来看待。我们只需要使用其本身的插入和删除函数对元素进行操作，就能得到一个有序队列，并通过 iterator 进行遍历。当然，STL 仍然提供了基于 hash 的 set 和 map，分别为 `std::unordered_set` 和 `std::unordered_map`。

首先讨论 set。下面用两种方式定义了一个从小到大排列的有序列表，这两种定义方式是等价的。

```c++
auto incList = std::set<int>();
auto incList = std::set<int, std::less<int>>();
```

可以看到，参数模板的第二个参数是比较函数，并且默认为 `std::less`。因此，我们只需要将该参数改为 `std::greater` 即可定义一个从大到小排列的有序列表。

```c++
auto decList = std::set<int, std::greater<int>>();
```

需要注意的是，`std::set` 是不允许重复元素的。如果想要我们的有序列表支持重复元素，可以使用 `std::multiset`。

我们可以用 iterator 来遍历有序列表。下面给出了一个遍历的例子：

```c++
auto incList = std::set<int, std::less<int>>{4, -3, 1, 5, 2};

for (auto it = incList.begin(); it != incList.end(); ++it) {
    std::cout << *it << ' ';
}
// result: -3 1 2 4 5 
```

map 的定义与 set 类似，区别在于 `std::map` 需要分别给出 key 和 value 的类型。另外，在排序时，**`std::map` 只会根据 key 的值进行排序，不会考虑 value 的值。**下面给出一些基于 `std::map` 的有序队列的定义。

```c++
auto incList = std::map<int, double>();                 // 递增序列
auto incList = std::map<int, double, std::less<int>>(); // 等价的定义

auto decList = std::map<int, double, std::greater<int>>(); // 递减序列
```

同样的，`std::map` 不允许重复元素。如果想要有序列表支持重复元素，可以使用 `std::multimap`。

## 3 对自定义结构进行排序

上面只是简单的介绍了一下这些结构的基本定义。然而，很多实际应用场景下，我们需要利用这些结构对我们自定义的结构体进行排序。

例如，我们现在需要对这样一个结构体构建一个有序列表：

```c++
struct A {
    int val;
};
```

### 3.1 重载 `operator<`

由上文可知，C++ 提供的`std::less` 内部调用了元素的 `operator<` 进行比较。因此，我们只需要重载 `opeartor<`，就可以使用 `std::less` 对自定义的结构体进行排序。

```c++
struct A {
    int val;
};

bool operator<(const A& a, const A& b) {
    return a.val < b.val;
}

int main() {
    auto incList = std::set<A, std::less<A>>{{4}, {-3}, {1}, {5}, {2}};

    for (auto it = incList.begin(); it != incList.end(); ++it) {
        std::cout << it->val << ' ';
    }
    // result: -3 1 2 4 5 
}
```

- 优点

    - 使用 std 自带的比较类，不需要定义额外的数据结构。

- 缺点

    - 需要重载自定义结构的比较运算符；
    - 当该自定义结构已经定义了自己的比较运算符，而我们希望用另一种比较方式对其排序时，会出现无法对比较运算符进行重定义的情况。

### 3.2 定义用于 compare 的类

我们也可以不使用 `std::less`，而是使用自定义的比较类。自定义的比较类必须提供一个 `operator()` 的运算符重载，并在该函数内进行比较。

```c++
struct A {
    int val;

    struct Less {
        bool operator()(const A& a, const A& b) const {
            return a.val < b.val;
        }
    };
};

int main() {
    auto incList = std::set<A, A::Less>{{4}, {-3}, {1}, {5}, {2}};

    for (auto it = incList.begin(); it != incList.end(); ++it) {
        std::cout << it->val << ' ';
    }
    // result: -3 1 2 4 5 
}
```

- 优点

    - 避免了对 `operator< `的重定义；
    - 可以为同一个自定义结构体定义多个不同的比较规则。
- 缺点
    - 需要定义额外的数据结构，容易在如何给类命名、在何处定义该类等问题上带来麻烦，不便于代码整理。

### 3.3 （推荐）使用 lambda 表达式

我们还可以使用 lambda 表达式来指定比较函数。

在我们定义了一个 lambda 表达式后，编译器会为该 lambda 表达式定义一个新的类型。我们可以用 `decltype()` 操作符来获取该类型，并将该类型作为函数模板参数中比较类的类型。

需要注意的是，模板参数只是声明了比较类的类型，我们还需要将这个 lambda 表达式的变量作为初始化参数传给构造函数。下面是一个例子：

```c++
auto cmp = [](const A& a, const A& b){ return a.val < b.val; };
auto incList = std::set<A, decltype(cmp)>(cmp);
```

在上例中，如果不将 `cmp` 传递给构造函数，则在编译时会报错：

```c++
auto cmp = [](const A& a, const A& b){ return a.val < b.val; };
auto incList = std::set<A, decltype(cmp)>(); // 错误

// a.cpp:14:17: note: a lambda closure type has a deleted default constructor
//     auto cmp = [](const A& a, const A& b){ return a.val < b.val; };
```

如果我们使用 `std::initializer_list` 对该列表进行初始化，只需要在列表的后面将 lambda 表达式传递给构造函数即可。

```c++
auto cmp = [](const A& a, const A& b){ return a.val < b.val; };
auto incList = std::set<A, decltype(cmp)>({{4}, {-3}, {1}, {5}, {2}}, cmp);
```

为了与上面保持一致，这里给出完整的示例。

```c++
struct A {
    int val;
};

int main() {
    auto cmp = [](const A& a, const A& b){ return a.val < b.val; };
    auto incList = std::set<A, decltype(cmp)>({{4}, {-3}, {1}, {5}, {2}}, cmp);

    for (auto it = incList.begin(); it != incList.end(); ++it) {
        std::cout << it->val << ' ';
    }
    // result: -3 1 2 4 5 
}
```

- 优点
    - 非常灵活，不需要重定义 `opeartor<`，也不需要额外定义新的比较类；
    - 在写代码时，我们可以将 lambda 表达式定义在有序列表的正上方，这样在检查代码时可以很方便地看到这个结构的排序规则是怎么样的；
    - 在函数内定义的 lambda 表达式是临时的，因此这样定义的比较规则不会影响到该结构体在外部已定义的比较规则。

- 缺点
    - 暂时没想到233，欢迎补充~





> 参考内容
>
> 1. Lambda expressions as class template parameters, https://stackoverflow.com/questions/5849059/lambda-expressions-as-class-template-parameters
> 2. C++11 std::set lambda comparison function, https://stackoverflow.com/questions/14896032/c11-stdset-lambda-comparison-function

