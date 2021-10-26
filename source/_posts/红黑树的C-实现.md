---
title: 红黑树的 C++ 实现
date: 2021-01-26 10:48:56
tags: [数据结构, C++]
categories: [数据结构和算法]
---

之前我们分析了红黑树的原理和操作算法，现在我们来用C++语言实现一个基本的红黑树结构。**在后文的插入和删除操作中提到的各种情况，详细描述请参见{% post_link 红黑树的原理和算法分析 上一篇文章 %}。**

> 具体代码可参考https://github.com/LumiOwO/DS-Playground/blob/master/include/tree/RBTree.h

## 1 数据结构定义

首先，为红黑树结点的颜色定义一个枚举：

```cpp
/// Enumeration for node color.
enum RBColor { BLACK, RED };
```
之后定义红黑树结点`RBTreeNode`模板类。这里我额外增加了模板参数`ALLOW_DUP`，该参数表示是否允许结点出现相同的值。具体实现这个类时，我考虑了以下几点：

* 在这个类中，指向左右子树的指针使用的是C++11标准提供的智能指针，这样就不需要在程序结束后手动释放申请的结点内存了；
* 由于在插入和删除过程中都需要根据当前结点找到父结点的位置，因此在结点中加入指向父结点的指针；
* 为了避免`shared_ptr`循环引用，指向父结点的指针应该使用`weak_ptr`；
* 将指向`RBTreeNode`类的智能指针重命名为`RBTree`

```cpp
template <typename T, bool ALLOW_DUP = false>
class RBTreeNode {
public:
    /// 重命名shared_ptr智能指针
    using RBTree = std::shared_ptr<RBTreeNode<T, ALLOW_DUP>>;
    
    /// 结点颜色
    RBColor _color;
    /// 结点值
    T _value;
    /// 指向父结点的指针，应使用weak_ptr
    std::weak_ptr<RBTreeNode<T, ALLOW_DUP>> _parent;
    /// 左子树
    RBTree _left;
    /// 右子树
    RBTree _right;

    /// 构造函数
    /* ...省略... */

    /// 析构函数
    virtual ~RBTreeNode() { }

    bool IsRoot() const { return !_parent.lock(); }
    bool IsLeaf() const { return !_left && !_right; }

}; ///< class RBTreeNode

// 在类的外面需要再次重命名指向结点的智能指针
// 否则只能通过RBTreeNode::RBTree访问这个指针类的名字
template <typename T, bool ALLOW_DUP = false>
using RBTree = std::shared_ptr<RBTreeNode<T, ALLOW_DUP>>;
```

## 2 Inline函数

主要有两个Inline函数：`IsBlack()`和`IsRed()`，用来判断结点的颜色。之所以不把这两个函数写成结点的成员函数，是因为**空的NIL结点将被看做黑色的结点**，而访问空指针的成员函数将会报错。换句话说，如果在代码中用`IsRed()`函数判断出一个结点为红色，则该指针必不为空指针。

```cpp
template <typename T, bool ALLOW_DUP>
inline bool IsBlack(RBTree<T, ALLOW_DUP> p) {
    return !p || p->_color == BLACK;
}
template <typename T, bool ALLOW_DUP>
inline bool IsRed(RBTree<T, ALLOW_DUP> p) {
    return !IsBlack(p);
}
```

## 3 搜索

搜索过程和在二叉搜索树中查找目标值的过程相同。这里给出非递归的搜索代码：

```cpp
template <typename T, bool ALLOW_DUP>
RBTree<T, ALLOW_DUP> Search(const RBTree<T, ALLOW_DUP> &root, T value) {
    RBTree<T, ALLOW_DUP> cur = root;
    while (cur) {
        if (value == cur->_value) {
            break;
        } else if (value < cur->_value) {
            cur = cur->_left;
        } else {
            cur = cur->_right;
        }
    }
    return cur;
}
```

## 4 旋转

旋转操作分为左旋和右旋。这里以左旋为例。

<!--More-->

首先声明左旋函数。因为旋转后顶部的结点发生了变化，因此应该传入的指针`top`应该是一个引用，然后在函数的最后将`top`的值修改为旋转后的顶部结点位置。

```cpp
template <typename T, bool ALLOW_DUP>
void LeftRotate(RBTree<T, ALLOW_DUP> &top);
```

第一步应该找到旋转过程的关键结点，即当前结点`self`和右子树`that`。同时别忘了我们的结点还要维护指向父结点的指针。

```cpp
RBTree<T, ALLOW_DUP> self = top;
RBTree<T, ALLOW_DUP> that = top->_right;
RBTree<T, ALLOW_DUP> parent =
    top->_parent.lock();  ///< _parent是weak_ptr
```

之后改变关键结点`self`和`that`的相对位置：

```cpp
self->_parent = that;
self->_right = that->_left;
that->_left = self;
that->_parent = parent;
```

最后，调整这两个结点相关的其他结点指针：

```cpp
// 调整子树
if (self->_right) {
    self->_right->_parent = self;
}
// 调整父指针
if (parent) {
    if (parent->_left == self) {
        parent->_left = that;
    } else {
        parent->_right = that;
    }
}
// 修改传入的top指针引用
top = that;
```

右旋的操作类似，镜像地考虑即可。

> **Tips:** 按照镜像的情况重新思考一遍能加深对算法的理解。但如果实在想不清楚，直接将代码中的`left`和`right`两个单词互换即可得到正确结果。之后提到的左右镜像操作都可以按照这样的思路去考虑。

## 5 插入

插入操作的函数声明如下：

```cpp
template <typename T, bool ALLOW_DUP>
bool Insert(RBTree<T, ALLOW_DUP> &root, T value);
```

该函数传入一棵红黑树的根结点指针引用`root`，将目标值`value`插入树中，并返回一个布尔量表明是否插入成功。如果模板参数`ALLOW_DUP`为`false`，那么插入一个已在树中的值时，函数将不会为插入的值新建结点，而是直接返回`false`。

插入函数实现的原则是：**先插入后调整**。

### 5.1 插入

按照二叉搜索树的插入思路，首先找到待插入的结点位置：

```cpp
RBTree<T, ALLOW_DUP> parent = nullptr;
RBTree<T, ALLOW_DUP> cur = root;
while (cur) {
    // 是否允许重复值
    if (!ALLOW_DUP && value == cur->_value) {
        return false;
    }
    parent = cur;
    if (value <= cur->_value) {
        cur = cur->_left;
    } else {
        cur = cur->_right;
    }
}
```

找到插入位置后，新建一个<b style="color: red">红色</b>结点并插入树中：

```cpp
cur = std::make_shared<RBTreeNode<T, ALLOW_DUP>>(RED, value);
cur->_parent = parent;
if(value <= parent->_value) {
    parent->_left = cur;
} else {
    parent->_right = cur;
}
```

插入完成后，对当前结点进行调整，使红黑树平衡：

```cpp
__Insert_Adjust(cur, root);
```

### 5.2 调整

插入操作的调整函数声明如下：

```cpp
template <typename T, bool ALLOW_DUP>
void __Insert_Adjust(RBTree<T, ALLOW_DUP> &cur, RBTree<T, ALLOW_DUP> &root)
```

该函数传入当前指向的结点指针引用`cur`和整棵树的根结点引用`root`。

首先，找到`cur`结点的父结点`parent`，并考虑情况1：父结点为<b style="color: black">黑色</b>

```cpp
RBTree<T, ALLOW_DUP> parent = cur->_parent.lock();
// 如果没有父结点，说明当前为根结点
if (!parent) {
    assert(cur == root);
    cur->_color = BLACK;
    return;
}
// 情况1
if (parent->_color == BLACK) {
    return;
}
```

之后找到祖父结点`grand`：

```cpp
RBTree<T, ALLOW_DUP> grand = parent->_parent.lock();
// 如果没有祖父结点，说明父结点为根结点，
// 那么父结点必定为黑色，因此会被之前的情况1捕获，
// 也就是说，这里的祖父结点必不为空
assert(grand != nullptr);
```

下面考虑父结点为祖父结点的左子树的情况，即`parent == grand->_left`。

首先找到叔叔结点`uncle`，并考虑情况2：父结点为<b style="color: red">红色</b>，且叔叔结点为<b style="color: red">红色</b>。这种情况下，将父结点和叔叔结点置为<b style="color: black">黑色</b>，并将祖父结点置为<b style="color: red">红色</b>，之后向上递归地调整。

```cpp
RBTree<T, ALLOW_DUP> uncle = grand->_right;
// 情况2
if (IsRed(uncle)) {
    parent->_color = uncle->_color = BLACK;
    grand->_color = RED;
    __Insert_Adjust(grand, root);
}
```

接着考虑情况3：父结点为<b style="color: red">红色</b>，且叔叔结点为<b style="color: black">黑色</b>。如果此时当前结点为父结点的右子树（即情况3.1），应该通过左旋操作转化为当前在父结点左子树的情况（即情况3.2）。对于情况3.2，将父结点颜色置为<b style="color: black">黑色</b>，并将祖父结点置为<b style="color: red">红色</b>，随后将祖父结点右旋即可。注意祖父结点有可能会是整棵树的根结点，因此要注意更新根结点指针`root`。

```cpp
// 情况3
else {
    // 情况3.1
    // 转化为情况3.2
    if(cur == parent->_right) {
        LeftRotate(parent);
        cur = parent->_left;
    }
    // 情况3.2
    parent->_color = BLACK;
    grand->_color = RED;
    // 注意：根结点可能变化
    bool change = (grand == root);
    RightRotate(grand);
    if (change) {
        root = grand;
    }
}
```

父结点为祖父结点的右子树时，可以镜像地考虑。

## 6 删除

删除操作的函数声明如下：

```cpp
template <typename T, bool ALLOW_DUP>
RBTree<T, ALLOW_DUP> Remove(RBTree<T, ALLOW_DUP> &root, T value);
```

该函数传入一棵红黑树的根结点指针引用`root`，将目标值`value`从树中删除，并返回包含删除值`value`的结点指针。如果该值不在树中，则返回空指针。

首先，我们需要找到包含`value`值的结点。这里直接使用之前的`Search`函数即可。

```cpp
RBTree<T, ALLOW_DUP> cur = Search(root, value);
if (!cur) {
    return nullptr;
}
```

找到对应结点后，需要判断该结点的度。如果度为2，即有两个子树，我们找到右子树中的最小结点，将当前结点值`value`和这个最小结点的值交换，并改为在右子树中删除`value`值。这样就能保证删除结点的度是小于等于1的，即最多只有一棵子树。

```cpp
if (cur->_left && cur->_right) {
    RBTree<T, ALLOW_DUP> minNode = cur->_right;
    while (minNode->_left) {
        minNode = minNode->_left;
    }
    std::swap(cur->_value, minNode->_value);
    cur = minNode;
}
```

删除函数实现的原则是：**先调整后插入**。

### 6.1 调整

注意只有在删除黑色结点时才需要调整：

```cpp
if (IsBlack(cur)) {
    __Remove_Adjust(cur, root);
}
```

删除操作的调整函数声明如下：

```cpp
template <typename T, bool ALLOW_DUP>
void __Remove_Adjust(const RBTree<T, ALLOW_DUP> &cur,
                     RBTree<T, ALLOW_DUP> &root);
```

该函数传入当前指向的结点指针常引用`cur`和整棵树的根结点引用`root`。

首先仍然是找到父结点`parent`。如果父结点为空，说明当前为根结点，直接退出函数。

```cpp
RBTree<T, ALLOW_DUP> parent = cur->_parent.lock();
if (!parent) {
    assert(cur == root);
    return;
}
```

下面考虑当前结点为父结点的左子树的情况，即`cur == parent->_left`。

首先获得兄弟结点`sib`，并考虑情况1：兄弟结点为<b style="color: red">红色</b>。这时需要将其转化为兄弟结点为<b style="color: black">黑色</b>的情况。因此将父结点置为<b style="color: red">红色</b>，兄弟结点置为<b style="color: black">黑色</b>，然后将父结点左旋即可。注意父结点有可能会是整棵树的根结点，因此要注意更新根结点指针`root`。旋转结束后，更新当前的父结点指针`parent`和兄弟结点指针`sib`。

需要注意的是，由于当前结点是<b style="color: black">黑色</b>的，所以兄弟结点的路径上必须要有<b style="color: black">黑色</b>结点。这也就意味着兄弟结点一定不为空指针。

```cpp
RBTree<T, ALLOW_DUP> sib = parent->_right;
// 情况1
// 转化为黑色兄弟的情况
if (IsRed(sib)) {
    parent->_color = RED;
    sib->_color = BLACK;
    bool change = (parent == root);
    LeftRotate(parent);
    if (change) {
        root = parent;
    }
    // 更新父结点和兄弟结点
    parent = cur->_parent.lock();
    sib = parent->_right;
}
// 兄弟结点必不为空
assert(sib != nullptr);
```

接下来，我们先考虑情况3：兄弟为<b style="color: black">黑色</b>，右侄子为<b style="color: black">黑色</b>，左侄子为<b style="color: red">红色</b>，因为这种情况可以转化为后面的情况2。这里我们将左侄子置为<b style="color: black">黑色</b>，兄弟结点置为<b style="color: red">红色</b>，然后将兄弟结点右旋即可。

```cpp
// 情况3
// 转化为情况2
if (IsBlack(sib->_right) && IsRed(sib->_left)) {
    sib->_left->_color = BLACK;
    sib->_color = RED;
    RightRotate(sib);
}
```

对于情况2：兄弟为<b style="color: black">黑色</b>，右侄子为<b style="color: red">红色</b>，左侄子任意，我们将右侄子置为<b style="color: black">黑色</b>，然后将兄弟结点和父结点的颜色互换，最后将父结点左旋即可。同样注意，这里的父结点可能为树的根结点。

```cpp
// 情况2
if (IsRed(sib->_right)) {
    sib->_right->_color = BLACK;
    sib->_color = parent->_color;
    parent->_color = BLACK;
    bool change = (parent == root);
    LeftRotate(parent);
    if (change) {
        root = parent;
    }
}
```

最后考虑情况4：兄弟为<b style="color: black">黑色</b>，右侄子为<b style="color: black">黑色</b>，左侄子为<b style="color: black">黑色</b>。这里又分为两种子情况：如果父结点为<b style="color: red">红色</b>，即情况4.1，将兄弟置为<b style="color: red">红色</b>、父结点置为<b style="color: black">黑色</b>即可；如果父结点为<b style="color: black">黑色</b>，即情况4.2，将兄弟置为<b style="color: red">红色</b>，并对父结点递归地向上调整。

```cpp
// 情况4
else {
    // 情况4.1
    if (IsRed(parent)) {
        sib->_color = RED;
        parent->_color = BLACK;
    }
    // 情况4.2
    else {
        sib->_color = RED;
        __Remove_Adjust(parent, root);
    }
}
```

当前结点为父结点的右子树时，可以镜像地考虑。

### 6.2 删除

由于之前的操作已经将树的结构调整为待删除结点处的路径上多出了一个<b style="color: black">黑色</b>结点，并且该结点最多只有一棵子树，因此我们直接将当前的`cur`结点从树上删除即可。

这里有一个特殊情况需要优先处理：当前结点`cur`为根结点。由于我们已经保证了当前结点最多只有一棵子树，因此`cur`为根结点时只会有以下三种情况：1. 根结点为叶结点；2. 根结点只有一个左儿子，左儿子为<b style="color: red">红色</b>的叶结点；3. 根结点只有一个右儿子，右儿子为<b style="color: red">红色</b>的叶结点。

```cpp
if (!parent) {
    if (cur->IsLeaf()) {
        // 没有子树
        root = nullptr;
    } else {
        // 只有一棵子树，子树必为叶结点
        RBTree<T, ALLOW_DUP> that = cur->_left ? cur->_left : cur->_right;
        assert(that->IsLeaf());
        that->_color = BLACK;
        that->_parent = std::weak_ptr<RBTreeNode<T, ALLOW_DUP>>();
        root = that;
    }
    cur->_left = cur->_right = nullptr;
    return cur;
}
```

最后，对于一般的情况，将当前结点的子树接到父结点对应的位置上即可。

```cpp
// 父结点子树指针的引用
RBTree<T, ALLOW_DUP> &child =
    parent->_left == cur ? parent->_left : parent->_right;

// 无子树
if (cur->IsLeaf()) {
    child = nullptr;
} 
// 只有一棵子树
else if (cur->_left) {
    child = cur->_left;
    cur->_left->_parent = cur->_parent;
} else {
    child = cur->_right;
    cur->_right->_parent = cur->_parent;
}

cur->_parent = cur->_left = cur->_right = nullptr;
return cur;
```

## 7\* 测试

为了使测试结果更直观，我采用的测试办法是：手动设计几个测试样例，将每次操作结束的红黑树结构用可视化的方式输出，观察其和手动模拟的结果是否相同。

我使用了Graghviz工具进行红黑树的可视化。操作流程为：

* 安装Graghviz程序，并添加到环境变量
* 将红黑树输出为.dot文本文档
* 使用命令`dot -Tpng 文档名.dot -o 图片名.png`输出为png格式的图片

文档的具体格式和其他使用细节在此不展开讨论，可参考[我的红黑树测试代码](https://github.com/LumiOwO/DS-Playground/blob/master/test/test_RBTree.cpp)。