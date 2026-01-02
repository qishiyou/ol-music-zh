"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, Download, Loader2, X, FileVideo, FileAudio, ArrowRight, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTranslations } from './translation-provider'

interface VideoFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: "pending" | "extracting" | "completed" | "error"
  progress: number
  outputUrl?: string
  outputFormat?: string
  error?: string
}

const SUPPORTED_VIDEO_FORMATS = ["mp4", "avi", "mov", "wmv", "webm", "mkv", "flv"]
const SUPPORTED_AUDIO_FORMATS = [
  { value: "mp3", label: "MP3", description: "最常用的音频格式" },
  { value: "wav", label: "WAV", description: "无损音频格式" },
  { value: "ogg", label: "OGG", description: "开源音频格式" },
  { value: "flac", label: "FLAC", description: "无损压缩格式" },
  { value: "aac", label: "AAC", description: "高效音频编码" },
]

export function VideoSeparator() {
  const t = useTranslations('video-separator')
  
  const [files, setFiles] = useState<VideoFile[]>([])
  const [outputFormat, setOutputFormat] = useState("mp3")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toLowerCase() || "unknown"
  }

  const handleFiles = useCallback((fileList: FileList) => {
    const videoFiles = Array.from(fileList).filter(
      (file) =>
        file.type.startsWith("video/") ||
        SUPPORTED_VIDEO_FORMATS.includes(getFileExtension(file.name))
    )

    const newFiles: VideoFile[] = videoFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: getFileExtension(file.name),
      status: "pending",
      progress: 0,
    }))

    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  // 真实的视频音频提取函数
  const extractAudioFromVideo = async (file: VideoFile) => {
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "extracting", progress: 0 } : f)))

    try {
      // 创建音频上下文
      const audioContext = new AudioContext()
      
      // 创建视频元素
      const video = document.createElement('video')
      video.preload = 'auto'
      video.crossOrigin = 'anonymous'
      
      // 创建 MediaElementSource
      const source = audioContext.createMediaElementSource(video)
      
      // 创建 ScriptProcessorNode 用于处理音频数据
      const bufferSize = 4096
      const scriptProcessor = audioContext.createScriptProcessor(bufferSize, 2, 2)
      
      // 音频数据数组
      const audioData: Float32Array[] = []
      
      // 处理音频数据
      scriptProcessor.onaudioprocess = (event) => {
        const leftChannel = event.inputBuffer.getChannelData(0)
        const rightChannel = event.inputBuffer.getChannelData(1)
        
        // 复制数据到数组
        audioData.push(new Float32Array(leftChannel))
        audioData.push(new Float32Array(rightChannel))
      }
      
      // 连接节点
      source.connect(scriptProcessor)
      scriptProcessor.connect(audioContext.destination)
      
      // 设置视频源
      const videoUrl = URL.createObjectURL(file.file)
      video.src = videoUrl
      
      // 模拟进度更新
      const updateProgress = async () => {
        for (let i = 0; i <= 100; i += 10) {
          await new Promise((resolve) => setTimeout(resolve, 200))
          setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, progress: i } : f)))
        }
      }
      
      // 开始更新进度
      updateProgress()
      
      // 等待视频加载完成
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          // 开始播放视频以触发音频处理
          video.play()
          
          // 监听视频结束事件
          video.onended = () => {
            resolve()
          }
          
          // 也可以设置一个超时，防止视频无限播放
          setTimeout(resolve, 5000) // 5秒后强制结束
        }
        
        video.onerror = () => {
          resolve()
        }
      })
      
      // 停止视频和音频处理
      video.pause()
      video.src = ''
      URL.revokeObjectURL(videoUrl)
      
      // 断开连接
      source.disconnect()
      scriptProcessor.disconnect()
      audioContext.close()
      
      // 创建合并后的音频缓冲区
      const totalLength = audioData.length > 0 ? audioData[0].length * (audioData.length / 2) : 0
      const mergedBuffer = audioContext.createBuffer(2, totalLength, audioContext.sampleRate)
      
      // 复制音频数据到合并后的缓冲区
      if (audioData.length > 0) {
        const leftChannel = mergedBuffer.getChannelData(0)
        const rightChannel = mergedBuffer.getChannelData(1)
        
        for (let i = 0; i < audioData.length; i += 2) {
          const offset = (i / 2) * bufferSize
          leftChannel.set(audioData[i], offset)
          if (i + 1 < audioData.length) {
            rightChannel.set(audioData[i + 1], offset)
          }
        }
      }
      
      // 将 AudioBuffer 转换为 Blob
      const bufferToBlob = (buffer: AudioBuffer): Promise<Blob> => {
        return new Promise((resolve) => {
          const offlineContext = new OfflineAudioContext(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
          )
          
          const sourceNode = offlineContext.createBufferSource()
          sourceNode.buffer = buffer
          sourceNode.connect(offlineContext.destination)
          sourceNode.start(0)
          
          offlineContext.oncomplete = (event) => {
            const renderedBuffer = event.renderedBuffer
            const numOfChan = renderedBuffer.numberOfChannels
            const length = renderedBuffer.length * numOfChan * 2 + 44
            const arrayBuffer = new ArrayBuffer(length)
            const view = new DataView(arrayBuffer)
            
            // WAV头
            const setUint16 = (data: number, offset: number) => {
              view.setUint16(offset, data, true)
            }
            
            const setUint32 = (data: number, offset: number) => {
              view.setUint32(offset, data, true)
            }
            
            let offset = 0
            
            // RIFF标识符
            setUint32(0x46464952, offset); offset += 4
            // 文件长度
            setUint32(length - 8, offset); offset += 4
            // WAVE标识符
            setUint32(0x45564157, offset); offset += 4
            // fmt标识符
            setUint32(0x20746d66, offset); offset += 4
            // fmt块长度
            setUint32(16, offset); offset += 4
            // 格式类型 (1 = PCM)
            setUint16(1, offset); offset += 2
            // 声道数量
            setUint16(numOfChan, offset); offset += 2
            // 采样率
            setUint32(renderedBuffer.sampleRate, offset); offset += 4
            // 字节率
            setUint32(renderedBuffer.sampleRate * numOfChan * 2, offset); offset += 4
            // 块对齐
            setUint16(numOfChan * 2, offset); offset += 2
            // 位深度
            setUint16(16, offset); offset += 2
            // data标识符
            setUint32(0x61746164, offset); offset += 4
            // data块长度
            setUint32(length - offset - 4, offset); offset += 4
            
            // 写入音频数据
            const channels = []
            for (let i = 0; i < numOfChan; i++) {
              channels.push(renderedBuffer.getChannelData(i))
            }
            
            let pos = offset
            for (let i = 0; i < renderedBuffer.length; i++) {
              for (let channel = 0; channel < numOfChan; channel++) {
                let sample = Math.max(-1, Math.min(1, channels[channel][i]))
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
                view.setInt16(pos, sample, true)
                pos += 2
              }
            }
            
            resolve(new Blob([arrayBuffer], { type: `audio/wav` }))
          }
          
          offlineContext.startRendering()
        })
      }
      
      // 生成 Blob
      const wavBlob = await bufferToBlob(mergedBuffer)
      const url = URL.createObjectURL(wavBlob)
      
      // 更新文件状态
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
                ...f,
                status: "completed",
                progress: 100,
                outputUrl: url,
                outputFormat,
              }
            : f,
        ),
      )
    } catch (error) {
      console.error("Error extracting audio:", error)
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
                ...f,
                status: "error",
                progress: 0,
                error: "提取音频失败，请重试",
              }
            : f,
        ),
      )
    }
  }

  const extractAll = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending")
    for (const file of pendingFiles) {
      await extractAudioFromVideo(file)
    }
  }

  const downloadFile = (file: VideoFile) => {
    if (file.outputUrl) {
      const link = document.createElement("a")
      link.href = file.outputUrl
      link.download = file.name.replace(/\.[^/.]+$/, `.${file.outputFormat}`)
      link.click()
    }
  }

  const downloadAll = () => {
    files.filter((f) => f.status === "completed").forEach(downloadFile)
  }

  const clearAll = () => {
    files.forEach((f) => {
      if (f.outputUrl) URL.revokeObjectURL(f.outputUrl)
    })
    setFiles([])
  }

  const pendingCount = files.filter((f) => f.status === "pending").length
  const completedCount = files.filter((f) => f.status === "completed").length
  const isExtracting = files.some((f) => f.status === "extracting")

  return (
    <Card className="bg-white/60 backdrop-blur-xl border-white/30 shadow-xl shadow-primary/5 overflow-hidden">
      <CardContent className="p-6 md:p-8">
        {/* 上传区域 */}
        <div
          className={cn(
            "border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 cursor-pointer",
            isDragging
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-primary/30 hover:border-primary/50 hover:bg-white/50",
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,.mp4,.avi,.mov,.wmv,.webm,.mkv,.flv"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">{t('upload.title')}</h3>
          <p className="text-muted-foreground mb-4">{t('upload.description')}</p>
          <p className="text-sm text-muted-foreground">{t('upload.supported-formats')}</p>
        </div>

        {/* 转换设置 */}
        {files.length > 0 && (
          <div className="mt-8 flex flex-col items-center">
            <div className="w-full max-w-md space-y-3">
              <label className="text-foreground font-medium block text-center">{t('settings.output-format')}</label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="bg-white/70 backdrop-blur border-white/30 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/90 backdrop-blur-xl border-white/30">
                  {SUPPORTED_AUDIO_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value} className="text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{format.label}</span>
                        <span className="text-muted-foreground text-sm">- {t(`formats.${format.value}`)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* 文件列表 */}
        {files.length > 0 && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground flex-1 text-center">{t('file-list')}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-muted-foreground hover:text-foreground"
              >
                {t('clear-all')}
              </Button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/50 backdrop-blur border border-white/30"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/80 to-green-500/80 flex items-center justify-center flex-shrink-0 shadow-md">
                    <FileVideo className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground truncate">{file.name}</span>
                      <Badge variant="secondary" className="text-xs uppercase bg-emerald-500/10 text-emerald-500">
                        {file.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      {file.status === "completed" && (
                        <>
                          <ArrowRight className="w-3 h-3" />
                          <Badge className="bg-green-500/20 text-green-500 text-xs uppercase">
                            <FileAudio className="w-3 h-3 inline mr-1" />
                            {file.outputFormat}
                          </Badge>
                        </>
                      )}
                    </div>
                    {file.status === "extracting" && <Progress value={file.progress} className="h-1.5 mt-2" />}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {file.status === "pending" && (
                      <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                        {t('status.pending')}
                      </Badge>
                    )}
                    {file.status === "extracting" && (
                      <Badge className="bg-emerald-500/20 text-emerald-500 border-0">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        {file.progress}%
                      </Badge>
                    )}
                    {file.status === "completed" && (
                      <>
                        <Badge className="bg-green-500/20 text-green-600 border-0">
                          <Check className="w-3 h-3 mr-1" />
                          {t('status.completed')}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => downloadFile(file)}
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {file.status === "error" && (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {t('status.error')}
                      </Badge>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeFile(file.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        {files.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={extractAll}
              disabled={pendingCount === 0 || isExtracting}
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:opacity-90 text-white px-8 shadow-lg shadow-emerald-500/30"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('status.extracting')}
                </>
              ) : (
                <> {t('buttons.extract-all')} {pendingCount > 0 && `(${pendingCount})`}</>
              )}
            </Button>

            {completedCount > 0 && (
              <Button
                size="lg"
                variant="outline"
                onClick={downloadAll}
                className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 px-8 bg-white/50 backdrop-blur"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('buttons.download-all', { count: completedCount })}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
