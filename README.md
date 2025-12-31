# 音频处理应用

一个功能强大的音频处理应用，基于现代Web技术栈构建，提供多种音频处理功能。

## ✨ 功能特性

### 🎵 音频处理
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

- **Next.js 16** - 基于React的全栈框架
- **React 19** - 用于构建用户界面的JavaScript库
- **Tailwind CSS 4** - 实用优先的CSS框架
- **Radix UI** - 可访问、可定制的UI组件库
- **Web Audio API** - 用于音频处理和分析
- **MediaRecorder API** - 用于音频录制
- **TypeScript** - 类型安全的JavaScript

## 🚀 快速开始

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 运行开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
# 或
yarn build
# 或
pnpm build
```

### 运行生产服务器

```bash
npm start
# 或
yarn start
# 或
pnpm start
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

## 📖 使用指南

### 音量调节
1. 上传音频文件
2. 调整音量滑块
3. 预览效果
4. 下载处理后的音频

### 音频合并
1. 上传多个音频文件
2. 调整文件顺序
3. 点击合并按钮
4. 下载合并后的音频

### 视频分离
1. 上传视频文件
2. 等待提取完成
3. 预览提取的音频
4. 下载音频文件

### 录音室
1. 点击"请求麦克风权限"
2. 授予浏览器麦克风权限
3. 点击"开始录音"
4. 录音完成后点击"停止录音"
5. 预览和下载录音文件

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

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 联系方式

如有问题或建议，欢迎通过GitHub Issues反馈。
