# AI Debate Web

这是一个基于AI的辩论平台，支持多角色AI辩论。

## 功能特性

- 多角色AI辩论（正方、反方、主裁判、副裁判）
- 完整的辩论流程控制
- 高级配置选项（温度、top_p、最大token数等）
- 辩论结果展示与导出

## 环境要求

- Node.js 16+
- npm 或 yarn

## 安装步骤

1. 克隆项目代码：
   ```
   git clone <repository-url>
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 配置环境变量：
   - 复制 `.env.example` 文件并重命名为 `.env`
   - 在 `.env` 文件中填写您的API密钥：
     ```
     VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
     VITE_KIMI_API_KEY=your_kimi_api_key_here
     VITE_DOUBAO_API_KEY=your_doubao_api_key_here
     ```

4. 启动开发服务器：
   ```
   npm run dev
   ```

5. 访问应用：
   打开浏览器访问 http://localhost:5173

## 构建部署

构建生产版本：
```
npm run build
```

预览生产版本：
```
npm run preview
```

## 技术栈

- React 18
- TypeScript
- Vite
- React Router v7
- Tailwind CSS
- Radix UI
- Framer Motion

## 项目结构

```
src/
├── components/     # UI组件
├── hooks/          # 自定义Hooks
├── lib/            # 工具函数
├── pages/          # 页面组件
└── routes.tsx      # 路由配置
```

## 开源协议

本项目采用 MIT 协议开源。