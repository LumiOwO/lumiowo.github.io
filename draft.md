---
title: 【C++11】类型别名和类型推断：typedef、using、auto、decltype
date: 
tags: [C++]
categories: [C++11]
---

最近在读第5版的《C++ Primer》，发现C++11标准中有很多非常实用的新特性。这里简单总结下C++11标准中处理变量类型的一些特性。

## 1 

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



### 1.2 `using`

## 2 类型推断

### 2.1 `auto`

### 2.2 `decltype`

> **参考资料：**
>
> 1. C++ Primer 中文版（第 5 版）