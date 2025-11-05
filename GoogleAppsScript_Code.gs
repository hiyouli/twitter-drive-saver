// --- 常量设置 ---
const FOLDER_NAME = "X"; // 您的推文总文件夹名称
const CSV_FILE_NAME = "tweets.csv"; // 您的推文Excel(CSV)文件名称
// --- ---

/**
 * 当插件发送POST请求时，此函数会被触发
 */
function doPost(e) {
  try {
    // 1. 解析从插件发送过来的数据
    const data = JSON.parse(e.postData.contents);
    const tweetText = data.text || "（无文字）";
    const imageUrls = data.imageUrls || [];
    const videoUrls = data.videoUrls || [];

    // 2. 找到或创建总文件夹 "X"
    const folder = findOrCreateFolder(FOLDER_NAME);
    
    // 3. 找到或创建 CSV 文件，并追加文本内容 (v0.3 修复版)
    const csvFile = findOrCreateCsvFile(folder, CSV_FILE_NAME);
    appendToCsv(csvFile, tweetText);

    // 4. “异步”下载媒体文件
    // 启动图片下载
    imageUrls.forEach(url => {
      try {
        downloadMedia(folder, url, "image");
      } catch (imgErr) {
        Logger.log(`下载图片失败: ${url}, 错误: ${imgErr.message}`);
      }
    });
    
    // 启动视频下载
    videoUrls.forEach(url => {
      try {
        downloadMedia(folder, url, "video");
      } catch (vidErr) {
        Logger.log(`下载视频失败: ${url}, 错误: ${vidErr.message}`);
      }
    });

    // 5. 立即返回成功响应给插件
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "文本已保存，媒体正在后台处理" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // 如果发生错误，记录日志并返回错误信息
    Logger.log(err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- 辅助函数 ---

/**
 * 查找或创建指定的文件夹
 */
function findOrCreateFolder(name) {
  const folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) {
    // 找到了
    return folders.next();
  } else {
    // 没找到，创建新的
    return DriveApp.createFolder(name);
  }
}

/**
 * 查找或创建 CSV 文件
 */
function findOrCreateCsvFile(folder, fileName) {
  const files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    // 找到了
    return files.next();
  } else {
    // 没找到，创建新的并写入表头
    const headers = "保存时间,推文内容\n";
    return folder.createFile(fileName, headers, MimeType.CSV);
  }
}

/**
 * 向 CSV 文件追加一行新内容 (v0.3 修复版)
 */
function appendToCsv(csvFile, tweetText) {
  const timestamp = new Date().toISOString();
  // 清理推文内容，防止破坏CSV格式
  const cleanedText = '"' + tweetText.replace(/"/g, '""') + '"';
  const newRow = `${timestamp},${cleanedText}\n`;
  
  try {
    // 1. 获取 CSV 文件中所有的旧内容
    const currentContent = csvFile.getBlob().getDataAsString("UTF-8");
    
    // 2. 将旧内容和新一行数据组合起来
    const newContent = currentContent + newRow;
    
    // 3. 用“组合后”的全部内容，一次性覆盖写回文件
    csvFile.setContent(newContent);
    
  } catch (e) {
    Logger.log(`向 CSV 追加内容时失败: ${e.message}`);
    // 抛出错误，让 doPost 知道发生了问题
    throw new Error(`Failed to append to CSV: ${e.message}`);
  }
}


/**
 * 下载媒体文件并保存到文件夹
 */
function downloadMedia(folder, url, type) {
  try {
    // 1. 使用 Google 的服务器下载文件
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true // 即使失败也不抛出异常，而是返回响应
    });
    
    if (response.getResponseCode() == 200) {
      const blob = response.getBlob();
      
      // 2. 从 URL 中解析一个可能的文件名
      const fileName = getFileNameFromUrl(url, type);
      
      // 3. 保存到 Drive
      folder.createFile(blob).setName(fileName);
      Logger.log(`成功下载并保存: ${fileName}`);
    } else {
      Logger.log(`下载失败 (Code ${response.getResponseCode()}): ${url}`);
    }
  } catch (e) {
    Logger.log(`下载媒体时发生严重错误: ${url}, 错误: ${e.message}`);
  }
}

/**
 * 从 URL 中猜测文件名 (一个简单的实现)
 */
function getFileNameFromUrl(url, defaultType) {
  try {
    const urlObj = new URL(url);
    let path = urlObj.pathname;
    let name = path.substring(path.lastIndexOf('/') + 1);
    
    // 如果文件名太短或没有扩展名，就自己造一个
    if (name.length < 5 || name.indexOf('.') === -1) {
      const ext = (defaultType === 'video') ? 'mp4' : 'jpg';
      name = `${defaultType}_${new Date().getTime()}.${ext}`;
    }
    return name;
  } catch (e) {
    // 如果 URL 解析失败，返回一个基于时间戳的默认名称
    const ext = (defaultType === 'video') ? 'mp4' : 'jpg';
    return `${defaultType}_${new Date().getTime()}.${ext}`;
  }
}
