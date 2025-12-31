"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Upload, Download, Loader2, X, FileAudio, ArrowRight, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface AudioFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: "pending" | "converting" | "completed" | "error"
  progress: number
  outputUrl?: string
  outputFormat?: string
  error?: string
}

const SUPPORTED_FORMATS = [
  { value: "mp3", label: "MP3", description: "最常用的音频格式" },
  { value: "wav", label: "WAV", description: "无损音频格式" },
  { value: "ogg", label: "OGG", description: "开源音频格式" },
  { value: "flac", label: "FLAC", description: "无损压缩格式" },
  { value: "aac", label: "AAC", description: "高效音频编码" },
  { value: "m4a", label: "M4A", description: "Apple音频格式" },
  { value: "wma", label: "WMA", description: "Windows媒体音频" },
  { value: "webm", label: "WebM", description: "网页音频格式" },
]

const BITRATE_OPTIONS = [
  { value: 128, label: "128 kbps", description: "标准质量" },
  { value: 192, label: "192 kbps", description: "较高质量" },
  { value: 256, label: "256 kbps", description: "高质量" },
  { value: 320, label: "320 kbps", description: "最高质量" },
]

export function AudioConverter() {
  const [files, setFiles] = useState<AudioFile[]>([])
  const [outputFormat, setOutputFormat] = useState("mp3")
  const [bitrate, setBitrate] = useState(192)
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
    const audioFiles = Array.from(fileList).filter(
      (file) =>
        file.type.startsWith("audio/") ||
        ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma", "webm"].includes(getFileExtension(file.name)),
    )

    const newFiles: AudioFile[] = audioFiles.map((file) => ({
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
    [handleFiles],
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

  const simulateConversion = async (file: AudioFile) => {
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "converting", progress: 0 } : f)))

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, progress: i } : f)))
    }

    const blob = new Blob([await file.file.arrayBuffer()], { type: `audio/${outputFormat}` })
    const url = URL.createObjectURL(blob)

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
  }

  const convertAll = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending")
    for (const file of pendingFiles) {
      await simulateConversion(file)
    }
  }

  const downloadFile = (file: AudioFile) => {
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
  const isConverting = files.some((f) => f.status === "converting")

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
            accept="audio/*,.mp3,.wav,.ogg,.flac,.aac,.m4a,.wma,.webm"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">拖放音频文件到这里</h3>
          <p className="text-muted-foreground mb-4">或点击选择文件上传</p>
          <p className="text-sm text-muted-foreground">支持 MP3, WAV, OGG, FLAC, AAC, M4A, WMA, WebM 等格式</p>
        </div>

        {/* 转换设置 */}
        {files.length > 0 && (
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-foreground font-medium block text-center">输出格式</Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="bg-white/70 backdrop-blur border-white/30 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/90 backdrop-blur-xl border-white/30">
                  {SUPPORTED_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value} className="text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{format.label}</span>
                        <span className="text-muted-foreground text-sm">- {format.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-foreground font-medium block text-center">比特率: {bitrate} kbps</Label>
              <Slider
                value={[bitrate]}
                onValueChange={([val]) => setBitrate(val)}
                min={128}
                max={320}
                step={64}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                {BITRATE_OPTIONS.map((opt) => (
                  <span key={opt.value}>{opt.label}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 文件列表 */}
        {files.length > 0 && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground flex-1 text-center">文件列表 ({files.length})</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-muted-foreground hover:text-foreground"
              >
                清空全部
              </Button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/50 backdrop-blur border border-white/30"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center flex-shrink-0 shadow-md">
                    <FileAudio className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground truncate">{file.name}</span>
                      <Badge variant="secondary" className="text-xs uppercase bg-primary/10 text-primary">
                        {file.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      {file.status === "completed" && (
                        <>
                          <ArrowRight className="w-3 h-3" />
                          <Badge className="bg-accent/20 text-accent text-xs uppercase">{file.outputFormat}</Badge>
                        </>
                      )}
                    </div>
                    {file.status === "converting" && <Progress value={file.progress} className="h-1.5 mt-2" />}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {file.status === "pending" && (
                      <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                        等待中
                      </Badge>
                    )}
                    {file.status === "converting" && (
                      <Badge className="bg-primary/20 text-primary border-0">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        {file.progress}%
                      </Badge>
                    )}
                    {file.status === "completed" && (
                      <>
                        <Badge className="bg-green-500/20 text-green-600 border-0">
                          <Check className="w-3 h-3 mr-1" />
                          完成
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
                        错误
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
              onClick={convertAll}
              disabled={pendingCount === 0 || isConverting}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white px-8 shadow-lg shadow-primary/30"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  转换中...
                </>
              ) : (
                <>开始转换 {pendingCount > 0 && `(${pendingCount})`}</>
              )}
            </Button>

            {completedCount > 0 && (
              <Button
                size="lg"
                variant="outline"
                onClick={downloadAll}
                className="border-primary/30 text-primary hover:bg-primary/10 px-8 bg-white/50 backdrop-blur"
              >
                <Download className="w-4 h-4 mr-2" />
                下载全部 ({completedCount})
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
