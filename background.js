// background.js

// ！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！
// ！！！！！！ 您的 Google Apps Script 网址 ！！！！！！
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx6r_8HIk6GUhSGlWB_Mx6m0232emPKHvbZM5G14TDut4NBSRYG4sIjJ3bcbKUeRPd8/exec";
// ！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！
// ！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！


// 监听来自 content.js 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveTweet") {
    console.log("后台收到保存请求:", request.data);

    // 异步处理 fetch
    (async () => {
      try {
        const response = await fetch(GAS_WEB_APP_URL, {
          method: "POST",
          mode: "cors", // 必须
          headers: {
            // 确保 GAS 能正确解析
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify(request.data) // 将 JS 对象转为 JSON 字符串
        });

        const result = await response.json();
        console.log("GAS 返回结果:", result);

        if (result.status === "success") {
          // 发送成功响应
          sendResponse({ status: "success", message: result.message });
        } else {
          // 发送失败响应
          sendResponse({ status: "error", message: result.message || "GAS 脚本返回错误" });
        }
      } catch (error) {
        console.error("发送到 GAS 失败:", error);
        // 发送网络错误响应
        sendResponse({ status: "error", message: `网络请求失败: ${error.message}` });
      }
    })();

    // 关键：返回 true 告诉 Chrome 我们将异步地调用 sendResponse
    return true;
  }
});