---
title: 【C++11】类型别名和类型推断：typedef、using、auto、decltype
date: 2021-01-19 16:58:04
tags: [C++]
categories: [编程语言学习与理解]
---

最近在读第5版的《C++ Primer》，发现C++11标准中有很多非常实用的新特性。这里简单总结下C++11标准中处理变量类型的一些特性。

## 1 类型别名

### 1.1 `typedef`

`typedef`关键字在C++11之前就可以使用，作用是定义一个类型的别名，换句话说，它是某种类型的同义词。例如：

```cpp
typedef double wages;  // wages是double的同义词
```

这样`wages`就成为了`double`的一个别名。只要是类型名能出现的地方，就能够使用类型的别名：

```cpp
double a = 1.2;
wages b = 2.3;
```

`typedef`在给指针起别名的时候会遇到一些容易混淆的地方。

#### 1.1.1 与宏定义的区别

下面的代码将`pstring`作为`char*`类型的别名，并定义一个常指针变量`cstr`：

```cpp
typedef char *pstring;
const pstring cstr = nullptr;
```

因此变量`cstr`的数据类型为`const pstring`，意味着该指针是常量，不能修改指针所指的位置，但是可以通过该指针修改指针指向的字符内容。

类似地，如果使用宏定义来声明`pstring`，即：

```cpp
#define pstring char*
const pstring cstr = nullptr;
```

由于在编译预处理过程中，代码中的`pstring`文本会被替换为`char*`，因此这段代码等价于：

```cpp
const char* cstr = nullptr;
```

也就是说，这样定义出来的变量`cstr`为指向`const char`数据类型的指针，即指针所指的位置可以修改，但是不可以通过该指针修改指向的字符内容。

#### 1.1.2 函数指针的别名

`typedef`最容易用错的时候是在给复杂的数据类型命名时，比如函数指针。例如我们要为下面这个函数的函数指针起一个别名`pfunc`：

<!--More-->

```cpp
int foo(char a, double b);
```

我们可以把`typedef`语句写成：

```cpp
typedef int (*pfunc)(char, double);
```

这样我们就可以用`pfunc`这个类型表示该类函数的指针：

```cpp
pfunc pf = foo;
```

<mark>个人建议：</mark>当你想不明白`typedef`的语法究竟该怎么写时，想一想你是如何定义一个变量的。`typedef`定义类型名的语法和定义一个变量名的语法其实是一样的！

例如，我现在要定义一个`char*`类型的变量`str`：

```cpp
char* str = nullptr;
```

如果在前面加上`typedef`，变成：

```cpp
typedef char* str;
```

这样`str`就变成了一个新的类型，与`char*`等价。

按照这个思路，函数指针也是同理。如果我们要定义一个参数为`(char, double)`、返回为`int`的函数指针变量`pfunc`，需要写成：

```cpp
int (*pfunc)(char, double) = nullptr;
```

同理，我们在前面加上`typedef`，将`pfunc`定义成一个新类型名：

```cpp
typedef int (*pfunc)(char, double);
```

这样我们就可以使用`pfunc`这个类型来简化代码了。

### 1.2 `using`

C++11中提出了`using`关键字来解决`typedef`语句定义的别名不够直观的问题。`using`使用起来很简单，它看上去就像赋值语句：

```cpp
using wages = double;
using uint = unsigned int;
```

使用`using`语句可以使复杂的数据类型的重命名变得更加直观，更容易理解。例如上面的`pstring`类型和函数指针类型，用`using`语句可以写成：

```cpp
using pstring = char*;
using pfunc = int (*)(char, double);
```

## 2 类型推断

### 2.1 `auto`

C++11标准中引入了`auto`类型说明符，可以让编译器替我们分析表达式的数据类型。`auto`的类型推导发生在编译时期。显而易见，`auto`类型的变量必须被初始化，否则无法推导变量的类型。例如：

```cpp
auto item = val1 + val2;
```

这里的`item`变量的类型将由加法的结果决定。如果`val1`和`val2`都是`int`类型，那么`item`也会是`int`类型；如果`val1`和`val2`都是`double`类型，那么`item`就会是`double`类型。

注意`auto`一般会忽略掉`const`属性。如果需要定义常量，需要额外声明为`const`。例如：

```cpp
const int c = 1;    // 常量

auto a = c;         // 变量a，可以修改a的值
a = 3;              // 正确

const auto b = c;   // 常量b，不能修改b的值
b = 3;              // 错误
```

<mark>个人建议：</mark>不要滥用`auto`！！！变量类型还是显式声明出来比较好。

我一般只在这种情况下使用`auto`：非常明确地知道该变量是什么类型，但是类型名写出来太长了，例如使用迭代器访问STL容器的时候。使用迭代器的循环应该写成：

```cpp
std::vector<int> v(10);
for(std::vector<int>::iterator it = v.begin(); it != v.end(); it++) {
    /* Do something */
}
```

这里我们很明确的知道迭代器`it`的数据类型应该为`std::vector<int>::iterator`，但写出来太冗余了，因此在这里使用`auto`类型：

```cpp
std::vector<int> v(10);
for(auto it = v.begin(); it != v.end(); it++) {
    /* Do something */
}
```

### 2.2 `decltype()`

有时我们还会遇到这种情况：我们希望从表达式的类型推断出要定义的变量的类型，但是我们并不希望该表达式被计算或被执行。C++11引入了`decltype()`类型说明符，用于选择并返回操作数的数据类型。`decltype()`的类型推导在编译时期进行。例子如下：

```cpp
decltype(f()) sum = x;
```

这里变量`sum`的类型由函数`f()`返回的类型决定，但是编译器并不会实际调用函数`f()`。也就是说，在这一条语句中，程序并没有执行过函数`f()`。

<mark>题外话：</mark>与此类似的还有`sizeof()`语句，也是在编译时就能确定一个表达式所占的字节大小，并且表达式不会被执行。

需要注意的是，`decltype()`返回的类型和表达式结果的数据类型完全等价，包括引用类型。例如：

```cpp
const int c = 0;        // 类型为const int
const int &ref = c;     // 类型为const int&，是c的引用

decltype(c) x = 0;      // x的类型是const int
decltype(ref) y = x;    // y的类型是const int&，绑定到x
decltype(ref) z;        // 错误，z是一个引用，必须初始化
```

使用`decltype()`时有两个特殊情况需要特别注意：

#### 2.2.1 `decltype(*p)`

如果表达式的内容为解引用操作，例如：

```cpp
int a;
int *p = &a;
decltype(*p) b;
```

这样定义出来的变量`b`的类型为`int&`，而不是`int`。因为`*p`是一个表达式，该表达式可以作为左值，得到该指针指向的对象并给该对象赋值，所以这里的`decltype(*p)`返回的是一个引用类型。

#### 2.2.2 `decltype((var))`

如果变量名再加上一对括号，编译器就会把该变量看做一个表达式。而单独的变量名作为表达式，可以作为一个左值在赋值语句中使用。因此，该表达式返回的是一个引用类型。

例子如下：

```cpp
int i;
decltype((i)) a;     // 错误，a是int&，必须初始化
decltype(i) b;       // 正确
```

也就是说，`decltype((var))`的结果永远是引用！



> **参考资料：**
>
> 1. C++ Primer 中文版（第 5 版）