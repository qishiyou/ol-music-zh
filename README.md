# 在线音乐工具箱

一个功能强大、易用的在线音频处理工具，支持格式转换、音频剪辑、音效处理、人声分离等多种功能。

## ✨ 功能特性

### 🎵 音频处理
- **格式转换** - 支持 MP3、WAV、OGG、FLAC、AAC 等多种音频格式互转
- **音频剪辑** - 可视化波形编辑，精准裁剪音频片段
- **音效处理** - 混响、回声、降噪、音量调整、均衡器
- **人声分离** - AI 智能分离人声和伴奏
- **音量调节** - 精确调节音频音量，实时波形可视化
- **音频合并** - 合并多个音频文件，支持多种格式
- **视频分离** - 从视频中提取音频
- **录音室** - 高质量录音功能，支持波形预览

### 📊 可视化
- 实时音频波形显示
- 进度条和播放控制
- 直观的用户界面

### 🎨 设计
- 现代化的UI设计
- 响应式布局
- 流畅的动画效果

## 🛠️ 技术栈

- **框架**: Next.js 16
- **前端**: React 19
- **样式**: Tailwind CSS 4
- **组件库**: Radix UI
- **图标**: lucide-react
- **构建工具**: TypeScript
- **音频处理**: Web Audio API
- **录音功能**: MediaRecorder API

## 🚀 快速开始

### 前提条件

- Node.js 18.0 或更高版本
- pnpm 或 npm 包管理器

### 安装依赖

```bash
pnpm install
# 或
npm install
# 或
yarn install
```

### 启动开发服务器

```bash
pnpm dev
# 或
npm run dev
# 或
yarn dev
```

应用将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
pnpm build
# 或
npm run build
# 或
yarn build
```

### 启动生产服务器

```bash
pnpm start
# 或
npm start
# 或
yarn start
```

## 📁 项目结构

```
├── app/                  # 应用路由
│   ├── converter/        # 音频转换
│   ├── effects/          # 音频效果
│   ├── merger/           # 音频合并
│   ├── recorder/         # 录音室
│   ├── separator/        # 人声分离
│   ├── trimmer/          # 音频裁剪
│   ├── video-separator/  # 视频分离
│   └── volume/           # 音量调节
├── components/           # React组件
│   ├── ui/               # UI组件
│   ├── audio-effects.tsx # 音频效果组件
│   ├── audio-merger.tsx  # 音频合并组件
│   ├── audio-recorder.tsx # 录音组件
│   ├── audio-volume.tsx  # 音量调节组件
│   └── video-separator.tsx # 视频分离组件
├── lib/                  # 工具函数
├── public/               # 静态资源
├── next.config.mjs       # Next.js配置
├── package.json          # 项目依赖
├── tailwind.config.js    # Tailwind配置
└── tsconfig.json         # TypeScript配置
```

## 📖 使用说明

### 1. 音频格式转换

1. 点击导航栏的「格式转换」
2. 上传您的音频文件
3. 选择目标格式
4. 调整输出参数（可选）
5. 点击「转换」按钮
6. 下载转换后的文件

### 2. 音频剪辑

1. 点击导航栏的「音频剪辑」
2. 上传您的音频文件
3. 使用波形编辑器选择需要的片段
4. 添加淡入淡出效果（可选）
5. 点击「剪辑」按钮
6. 下载剪辑后的文件

### 3. 音效处理

1. 点击导航栏的「音效处理」
2. 上传您的音频文件
3. 选择需要的音效
4. 调整音效参数
5. 实时预览效果
6. 点击「应用」按钮
7. 下载处理后的文件

### 4. 人声分离

1. 点击导航栏的「人声分离」
2. 上传您的音频文件
3. 等待 AI 处理完成
4. 分别预览人声和伴奏
5. 下载需要的轨道

### 5. 音量调节
1. 上传音频文件
2. 调整音量滑块
3. 预览效果
4. 下载处理后的音频

### 6. 音频合并
1. 上传多个音频文件
2. 调整文件顺序
3. 点击合并按钮
4. 下载合并后的音频

### 7. 视频分离
1. 上传视频文件
2. 等待提取完成
3. 预览提取的音频
4. 下载音频文件

### 8. 录音室
1. 点击"请求麦克风权限"
2. 授予浏览器麦克风权限
3. 点击"开始录音"
4. 录音完成后点击"停止录音"
5. 预览和下载录音文件

## 📱 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 🔒 隐私与安全

- 所有音频处理均在浏览器内完成，无需上传到服务器
- 您的文件不会被保存或分享
- 处理完成后，文件将自动从浏览器内存中清除

## 🔧 开发

### 代码规范

项目使用ESLint和Prettier进行代码规范检查：

```bash
npm run lint
# 或
npm run format
```

### 类型检查

```bash
npm run typecheck
```

## 🤝 贡献指南

欢迎贡献代码！请按照以下步骤进行：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目链接: [https://github.com/qishiyou/ol-music-zh](https://github.com/qishiyou/ol-music-zh)
- 报告问题: [Issues](https://github.com/qishiyou/ol-music-zh/issues)

## 🙏 致谢

- 感谢所有开源项目的贡献者
- 感谢您的使用和支持

---

**在线音乐工具箱** - 让音频处理变得简单高效！ 🎧