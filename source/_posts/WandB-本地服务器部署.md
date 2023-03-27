---
title: WandB 本地服务器部署
tags: [WandB, 神经网络, docker]
categories: [未归档]
hide: false
top: false
date: 2023-03-27 10:52:08
---

最近在跑 NeRF 的实验，使用了 WandB 记录实验数据以及可视化模型训练过程。但我不太想把数据上传到 WandB 官方的服务器，于是决定在自己的服务器上搭建一个 WandB 服务，在此记录一下。

## 1 安装docker
我的服务器操作系统是 Ubuntu 22.04 LTS.

首先添加使用 HTTPS 传输的软件包以及 CA 证书。
```bash
sudo apt-get update
sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release
```

再添加软件源的 GPG 密钥，这里使用的国内源。
```bash
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

然后向 `sources.list` 中添加 Docker 软件源。

```bash
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

更新 apt 软件包缓存，并安装 `docker-ce`.

```bash
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io
```

之后便可以启动 docker.

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

<!--More-->


然后需要把当前用户添加到 docker 用户组，否则测试 docker 时会提示 `docker: permission denied`.

```bash
sudo groupadd docker
sudo usermod -aG docker $USER
```

之后需要更新一下用户组，否则上面的设置不生效！

```bash
newgrp docker
```

最后可以跑一个 hello-world，测试 docker 是否安装成功。

```bash
docker run --rm hello-world
```

## 2 启动 WandB 服务

新版本的 WandB 本地部署流程简化了很多，只要服务器上安装了 docker 和 python，就可以一键启动 WandB 服务。


```shell
pip install wandb
wandb server start -p 8080
```
这样 WandB 就会在 8080 端口上提供服务。如果提示 `Command 'wandb' not found` 之类的错误，重新打开一个终端再开启 wandb server 即可。之后用浏览器打开` http://<host_ip>:8080/`，注册一个账户并登录，复制 API key 并粘贴到命令行中，WandB 服务就配置完成了。

虽然网页的最上面会提示 `You need a license for this instance of W&B Local`，但貌似不申请 license 也可以正常使用。



> 参考内容
> - https://yeasy.gitbook.io/docker_practice/install/ubuntu
> - https://docs.wandb.ai/guides/hosting
> - https://www.runoob.com/note/51562
