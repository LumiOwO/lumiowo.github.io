---
title: LumiEngine开发笔记 - Vertex and Index buffer
date: 2021-10-12 23:44:41
tags: [Engine, Vulkan]
categories: [LumiEngine开发笔记]
---

> LumiEngine on Github: https://github.com/LumiOwO/LumiEngine 

## 1 Vertex Buffer 和 Index Buffer

之前的三角形顶点数据是在 shader 里写死的，接下来引入 Vertex buffer 和 Index Buffer 来描述顶点数据。

- Vertex Buffer：描述模型的顶点数据，包括顶点的位置、颜色数据、法线等
- Index Buffer：复用顶点数据，以表示三角形面。Index buffer 里存的是 Vertex buffer 对应顶点的索引值

在之前的 Vulkan Tutorial 中引入这两个buffer，需要以下几个步骤：

### 1.1 构建顶点描述数据结构

我们需要构建如下的数据结构，以传入Vertex buffer：

```c++
struct Vertex {
    glm::vec2 pos;
    glm::vec3 color;
};
```

另外需要构建两个描述结构：

- VkVertexInputBindingDescription 
    - Binding 描述，给 Vertex buffer 绑定一个 id
    - 之后在Command buffer中通过指定绑定的 id 来选择使用哪个Vertex buffer
- VkVertexInputAttributeDescription
    - 对结构体的每个字段进行描述
    - 描述传给 shader 的 location、数据格式、在结构体中的偏移 offset

### 1.2 创建 Vertex buffer 和 Index buffer

一个 buffer 对应一个 VkBuffer + 一个 VkDeviceMemory

- 首先，根据不同的 buffer 填入对应的 createInfo，创建一个VkBuffer 
- 需要将CPU内存中的顶点数据传给buffer，所以需要创建VkDeviceMemory结构

这里有一个常用的优化方案：`VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT`类型的 buffer 有最优的访问效率，然而这种 buffer 在大多数平台的 CPU 端是无法直接访问的。因此额外创建一个 staging buffer，首先将 CPU 端的顶点数据传给 staging buffer，再从 staging buffer 传给 vertex buffer。

### 1.3 在 Command buffer 中绑定

在绑定Pipeline之后绑定这两个 buffer 即可。

## 2 Assimp

把手动给出的顶点数组画在屏幕上后，有点不过瘾，于是想着先不管材质出来，直接读取模型顶点画在屏幕上试试。由于不想在读取模型文件上重新造轮子（这不是引擎的重点），于是引入 Assimp 库来读取模型文件。

Assimp 的场景组织结构如下图所示：

<!--More-->

![img](LumiEngine%E5%BC%80%E5%8F%91%E7%AC%94%E8%AE%B0-Vertex-and-Index-buffer/assimp_structure.png)

可以看到，该结构还是比较直观的。首先，Assimp 对模型的管理与Vertex buffer & Index buffer类似，在场景根结点的位置存下所有的 Mesh 数据，并在 node 中通过 index 来访问对应的模型。

之后我打算在自己的引擎里参考也这个结构。首先，我们需要一个资源管理模块 AssetManager，用来加载场景所有的模型数据，以及之后可能需要的纹理数据加载。另外，我们需要一个场景管理模块 SceneManager，组织成树形结构，非叶结点用于分组，叶结点中放实际的模型、相机、光源等数据。

另外，高级的渲染/游戏引擎中，并不会把场景的所有模型数据都提交给渲染管线，而是利用一些高级的场景组织算法，例如八叉树、BVH、BSP算法等。需要注意的是，这些高级算法其实可以看做对场景渲染的优化算法，而不是非实现不可的算法。同时，需要将这些优化结构与上面的 SceneNode 区分开来。SceneNode 应该是用户可编辑的，目的是让用户便于管理场景中模型的层次结构，而优化算法对于引擎用户而言应该是不可见的。

既然目前是展示效果为驱动进行开发，这部分优化算法先往后放一放，现在引擎会将场景中所有的模型都提交给渲染模块。

## 3 导入模型

- 设计 AssetManager
    - 导入配置文件中所有的模型，存放在 Mesh 数组里
- 设计 SceneManager
    - 根据配置文件的描述，构建场景的树形结构
    - 每个结点中存的是对 Mesh 数组的索引
    - 在 CommitScene() 函数中，将树形的场景结构解析为 Vulkan 能用的数组结构，传给渲染模块
    - 由于没有材质信息，每个顶点处的颜色数据设为白色(1, 1, 1)

测试使用的模型文件是[这个](https://vulkan-tutorial.com/resources/viking_room.obj)，渲染出来的结果如下：

![image-20211012234931771](LumiEngine%E5%BC%80%E5%8F%91%E7%AC%94%E8%AE%B0-Vertex-and-Index-buffer/image-20211012234931771.png)

一开始我觉得这个结果应该是哪里有 bug，但后来想了想，由于每个顶点颜色相同，而且没有设置视场的变换矩阵，可显示的矩形范围内应该都会被填充为白色，从而显示为一块白色矩形，应该是没有什么问题的。毕竟跳过了矩阵变换和材质的部分直接跳到模型加载，没能得到理想结果也是正常的233

之后先把 Tutorial 后面的部分过了，让自己的引擎能够正常的绘制模型，之后再考虑优化问题。
