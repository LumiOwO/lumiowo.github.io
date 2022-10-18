---
title: Win11 若干疑难杂症的解决方法
tags: []
categories: []
hide: false
top: false
date: 2022-10-18 21:41:48
---

最近换了新电脑，预装了 win11，踩了各种奇奇怪怪的坑，在此记录一下。

## 1 开机输入密码后长时间等待

搜出来一堆 csdn 告诉我是硬盘坏了，我这刚买的新电脑啊喂 =_=

最后终于搜到了一些和我的情况相同的帖子。

> - https://answers.microsoft.com/zh-hans/windows/forum/all/win11%E6%9B%B4%E6%96%B0%E8%87%B322000527%E5%90%8E/7dfbd75e-ab78-4406-967a-655871093ed1
> - https://answers.microsoft.com/zh-hans/windows/forum/all/win11%E5%BC%80%E6%9C%BA%E5%90%8E%E9%A6%96%E6%AC%A1/cb2f845c-c503-4a9d-909e-3364965c8329
> - https://answers.microsoft.com/zh-hans/windows/forum/all/win11%E5%BC%80%E6%9C%BA%E4%B9%8B%E5%90%8E%E7%99%BD/44016f9c-ae09-4f86-a34b-b307b9d5fb2e

试了一下，把网线拔了以后确实能秒登录。。但每次开机都要拔网线也太麻烦了，因此写了一个脚本，每次开机时断网再联网，具体的实现办法是将对应的网络适配器先禁用再启用。脚本代码贴在下面，该脚本需要以管理员身份运行。

```bash
@echo off

if "%1" == "on" (
    call:enable_network
    echo network enabled.

) else if "%1" == "off" (
    call:disable_network
    echo network disabled.

) else if "%1" == "reset" (
    call:disable_network
    call:enable_network
    echo network reset.

) else (
    echo Invalid operation!

)
goto:eof

@REM ============= functions ==============

:enable_network
netsh interface set interface name="以太网" admin=ENABLED
netsh interface set interface name="WLAN" admin=ENABLED
goto:eof

:disable_network
netsh interface set interface name="以太网" admin=DISABLED
netsh interface set interface name="WLAN" admin=DISABLED
goto:eof

```

最后再到任务计划程序中创建一个任务，并进行以下设置：

- 常规：注意需要勾选「使用最高权限运行」。测试时发现选择「只在用户登录时运行」无法执行脚本，而选择「不管用户是否登录都要运行」后成功执行。
- 触发器：新建一项，「开始任务」选择「登录时」。
- 操作：新建一项，「操作」选择「启动程序」，「程序与脚本」填写脚本文件的路径，「添加参数（可选）」填写「reset」

<!--More-->

## 2 任务栏图标无法合并

推荐工具：[ExplorerPatcher](https://github.com/valinet/ExplorerPatcher)

## 3 右键菜单管理

推荐工具：[ContextMenuManager](https://github.com/BluePointLilac/ContextMenuManager)
