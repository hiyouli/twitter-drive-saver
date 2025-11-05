# twitter-drive-saver
## 一键保存推文到 Google Drive 的浏览器插件
通过浏览器插件，在推特页面点击想要保存的推文下方的【保存】按钮，实现一键以CSV文件保存到Google drive中。
同时推文中的图片也将一并保存。

## 快速开始
1、打开 https://script.google.com 登录并创建自己的web应用。

2、进入创建的应用后，删除code.gs中的所有代码，复制本项目GoogleAppsScript_Code.gs的代码，粘贴。然后部署。

3、下载另外4个文件，到本地一个新建文件夹，比如 my-twitter-saver 。

4、打开 Chrome 或 Edge 浏览器，在地址栏输入 chrome://extensions (Edge 用户输入 edge://extensions)，然后按回车。

5、在页面右上角，找到并打开 “开发者模式” (Developer mode) 的开关。

6、点击 “加载已解压的扩展程序” (Load unpacked)。

7、在弹出的文件选择框中，选择您刚才创建的 my-twitter-saver 文件夹 (是选择整个文件夹，而不是里面的文件)。

8、点击“选择文件夹”。

9、可以开始使用了，刷新推特页面，就可以看到推文的右下角有【保存】按钮。


## 接下来的改进
- [x] 整理Google drive的数据储存。
- [x] 将Google drive链接到CF的pages发布保存的推文方便查看。
