// content.js (v0.2 - 修复了媒体抓取规则)

console.log("推特保存助手 content.js (v0.2) 已加载");

// 注入按钮到推文
function addSaveButton(tweetArticle) {
  // 1. 检查是否为有效推文 (例如，不是广告或 "Who to follow" 模块)
  if (!tweetArticle.querySelector('[data-testid="tweetText"]')) {
    return; 
  }
  // 检查是否已经添加过按钮
  if (tweetArticle.querySelector('.save-to-drive-btn')) {
    return; 
  }

  // 2. 创建按钮
  const saveButton = document.createElement('button');
  saveButton.className = 'save-to-drive-btn';
  saveButton.innerHTML = '💾 保存'; // 使用 Emoji 增加辨识度

  // 3. 添加点击事件
  saveButton.addEventListener('click', (e) => {
    e.preventDefault(); // 阻止点击事件冒泡 (例如点开推文详情)
    e.stopPropagation();

    // 立即更改按钮状态，防止重复点击
    saveButton.innerHTML = '...保存中';
    saveButton.disabled = true;

    // --- 开始抓取数据 (v0.2 更新) ---
    let tweetText = '';
    const textElement = tweetArticle.querySelector('[data-testid="tweetText"]');
    if (textElement) {
      tweetText = textElement.innerText;
    }

    // 抓取图片 URL (v0.2 修复: 使用 data-testid="tweetPhoto" )
    const imageUrls = [];
    const images = tweetArticle.querySelectorAll('div[data-testid="tweetPhoto"] img');
    images.forEach(img => {
      // 确保是有效的 pbs.twimg.com 链接
      if (img.src && img.src.includes('pbs.twimg.com')) {
        imageUrls.push(img.src);
      }
    });

    // 抓取视频 URL (v0.2 修复: 使用 data-testid="videoPlayer" )
    const videoUrls = [];
    // 推特的视频播放器通常内嵌 <video> 标签
    const videos = tweetArticle.querySelectorAll('div[data-testid="videoPlayer"] video');
    videos.forEach(video => {
      // 视频链接可能在 src 属性或 source 标签里
      // 但通常 <video> 标签本身的 src 就有效
      if (video.src && video.src.includes('video.twimg.com')) {
        videoUrls.push(video.src);
      }
    });
    // --- 抓取结束 ---

    const tweetData = {
      text: tweetText,
      imageUrls: imageUrls,
      videoUrls: videoUrls
    };

    console.log("抓取到推文数据:", tweetData);

    // 4. 发送数据到 background.js
    chrome.runtime.sendMessage({ action: "saveTweet", data: tweetData }, (response) => {
      if (response && response.status === "success") {
        console.log("保存成功:", response.message);
        saveButton.innerHTML = '✔ 已保存';
        saveButton.disabled = true; // 保持禁用状态
      } else {
        console.error("保存失败:", (response ? response.message : "无响应"));
        saveButton.innerHTML = '❌ 失败';
        saveButton.disabled = false; // 允许重试
        setTimeout(() => {
          saveButton.innerHTML = '💾 保存';
        }, 2000); // 2秒后恢复
      }
    });
  });

  // 5. 找到工具栏并插入按钮 (div[role="group"] 是目前推特的工具栏选择器)
  const toolbar = tweetArticle.querySelector('div[role="group"]');
  if (toolbar) {
    toolbar.appendChild(saveButton); 
  } else {
    // 备用方案：如果找不到工具栏，插在文章末尾
    tweetArticle.appendChild(saveButton);
  }
}

// 查找页面上所有已存在的推文
function scanInitialTweets() {
  document.querySelectorAll('article').forEach(addSaveButton);
}

// 使用 MutationObserver 侦听新加载的推文 (当您向下滚动时)
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // 确保是元素节点
        // 1. 如果添加的节点本身是 article
        if (node.tagName === 'ARTICLE') {
          addSaveButton(node);
        }
        // 2. 检查添加的节点内部是否包含 article
        const articles = node.querySelectorAll('article');
        if (articles.length > 0) {
          articles.forEach(addSaveButton);
        }
      }
    });
  });
});

// 启动 Observer
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// 页面加载后先扫描一次
setTimeout(scanInitialTweets, 1000);