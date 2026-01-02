"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Upload, Download, Loader2, X, FileAudio, Play, Pause, Volume2, ArrowRight, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useTranslations } from './translation-provider'

interface WaveformCanvasProps {
  audioBuffer: AudioBuffer
  currentTime: number
  duration: number
  isPlaying: boolean
  onSeek: (time: number) => void
  color: string
  height?: number
}

function WaveformCanvas({
  audioBuffer,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  color,
  height = 80,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !audioBuffer) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${height}px`

    ctx.scale(dpr, dpr)

    const width = rect.width
    const channelData = audioBuffer.getChannelData(0)
    const step = Math.ceil(channelData.length / width)

    ctx.clearRect(0, 0, width, height)

    // Calculate progress position
    const progressX = (currentTime / duration) * width

    // Draw waveform
    const centerY = height / 2
    const amplitude = height / 2 - 4

    for (let i = 0; i < width; i++) {
      let min = 1.0
      let max = -1.0

      for (let j = 0; j < step; j++) {
        const idx = i * step + j
        if (idx < channelData.length) {
          const datum = channelData[idx]
          if (datum < min) min = datum
          if (datum > max) max = datum
        }
      }

      const x = i
      const isPast = i < progressX

      // Set color based on progress
      if (isPast) {
        ctx.fillStyle = color
      } else {
        ctx.fillStyle = `${color}40`
      }

      const barHeight = Math.max(2, (max - min) * amplitude)
      ctx.fillRect(x, centerY - barHeight / 2, 1, barHeight)
    }

    // Draw playhead
    if (currentTime > 0) {
      ctx.fillStyle = color
      ctx.fillRect(progressX - 1, 0, 2, height)
    }
  }, [audioBuffer, currentTime, duration, color, height])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const progress = x / rect.width
    const seekTime = progress * duration
    onSeek(seekTime)
  }

  return (
    <div ref={containerRef} className="w-full cursor-pointer">
      <canvas ref={canvasRef} onClick={handleClick} className="w-full rounded-lg" style={{ height }} />
    </div>
  )
}

interface AudioFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  outputUrl?: string
  volumeLevel: number
  error?: string
  audioUrl?: string
  audioBuffer: AudioBuffer | null
  duration?: number
}

const SUPPORTED_FORMATS = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma", "webm"]

export function AudioVolume() {
  const t = useTranslations('volume')
  
  const [files, setFiles] = useState<AudioFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationRef = useRef<number | null>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toLowerCase() || "unknown"
  }

  const decodeAudioFile = async (audioFile: File): Promise<AudioBuffer | null> => {
    try {
      const arrayBuffer = await audioFile.arrayBuffer()
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      return await audioContextRef.current.decodeAudioData(arrayBuffer)
    } catch (error) {
      console.error("Failed to decode audio:", error)
      return null
    }
  }

  const handleFiles = useCallback(async (fileList: FileList) => {
    const audioFiles = Array.from(fileList).filter(
      (file) =>
        file.type.startsWith("audio/") ||
        SUPPORTED_FORMATS.includes(getFileExtension(file.name))
    )

    const newFilesPromises = audioFiles.map(async (file): Promise<AudioFile> => {
      const audioUrl = URL.createObjectURL(file)
      const audioBuffer = await decodeAudioFile(file)
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: getFileExtension(file.name),
        status: "pending" as const,
        progress: 0,
        volumeLevel: 100,
        audioUrl,
        audioBuffer,
        duration: audioBuffer?.duration || 0,
      }
    })

    const newFiles = await Promise.all(newFilesPromises)
    setFiles((prev) => [...prev, ...newFiles])
  }, [decodeAudioFile])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files) {
        await handleFiles(e.dataTransfer.files)
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
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id)
      if (selectedFile?.id === id) {
        setSelectedFile(null)
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.src = ""
        }
      }
      return updated
    })
  }

  const updateVolume = (id: string, newVolume: number) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, volumeLevel: newVolume } : f
      )
    )
    
    if (selectedFile?.id === id) {
      setSelectedFile((prev) => prev ? { ...prev, volumeLevel: newVolume } : null)
      if (audioRef.current) {
        // 限制音量在0-1之间
        audioRef.current.volume = Math.max(0, Math.min(1, newVolume / 100))
      }
    }
  }

  const simulateVolumeAdjustment = async (file: AudioFile) => {
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "processing", progress: 0 } : f)))

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, progress: i } : f)))
    }

    // Create a simple blob for demonstration
    const blob = new Blob([await file.file.arrayBuffer()], { type: file.file.type })
    const url = URL.createObjectURL(blob)

    setFiles((prev) =>
      prev.map((f) =>
        f.id === file.id
          ? {
              ...f,
              status: "completed",
              progress: 100,
              outputUrl: url,
            }
          : f,
      ),
    )
  }

  const processAll = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending")
    for (const file of pendingFiles) {
      await simulateVolumeAdjustment(file)
    }
  }

  const downloadFile = (file: AudioFile) => {
    if (file.outputUrl) {
      const link = document.createElement("a")
      link.href = file.outputUrl
      link.download = `${file.name.replace(/\.[^/.]+$/, ``)}-volume-${file.volumeLevel}.${file.type}`
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
    setSelectedFile(null)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }
  }

  const previewFile = async (file: AudioFile) => {
    setSelectedFile(file)
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.src = file.audioUrl || URL.createObjectURL(file.file)
      // 限制音量在0-1之间
      audioRef.current.volume = Math.max(0, Math.min(1, file.volumeLevel / 100))
      await audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const togglePlayback = () => {
    if (audioRef.current && selectedFile) {
      if (audioRef.current.paused) {
        audioRef.current.play()
        setIsPlaying(true)
      } else {
        audioRef.current.pause()
        setIsPlaying(false)
      }
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const pendingCount = files.filter((f) => f.status === "pending").length
  const completedCount = files.filter((f) => f.status === "completed").length
  const isProcessing = files.some((f) => f.status === "processing")

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
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">{t('upload.title')}</h3>
          <p className="text-muted-foreground mb-4">{t('upload.description')}</p>
          <p className="text-sm text-muted-foreground">{t('upload.supported-formats')}</p>
        </div>

        {/* 文件列表 */}
        {files.length > 0 && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground flex-1 text-center">{t('file-list', { count: files.length })}</h4>
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
                  className={cn(
                    "flex flex-col gap-3 p-4 rounded-xl transition-all duration-200",
                    selectedFile?.id === file.id
                      ? "bg-primary/5 border-primary/30"
                      : "bg-white/50 backdrop-blur border border-white/30"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/80 to-indigo-500/80 flex items-center justify-center flex-shrink-0 shadow-md">
                      <FileAudio className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground truncate">{file.name}</span>
                        <Badge variant="secondary" className="text-xs uppercase bg-blue-500/10 text-blue-500">
                          {file.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        {file.status === "completed" && (
                          <>
                            <ArrowRight className="w-3 h-3" />
                            <Badge className="bg-accent/20 text-accent text-xs uppercase">{t('status.completed')}</Badge>
                          </>
                        )}
                      </div>
                      {file.status === "processing" && <Progress value={file.progress} className="h-1.5 mt-2" />}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {file.status === "pending" && (
                        <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                          {t('status.pending')}
                        </Badge>
                      )}
                      {file.status === "processing" && (
                        <Badge className="bg-blue-500/20 text-blue-500 border-0">
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

                  {/* 波形预览 */}
                  {file.audioBuffer && (
                    <div className="space-y-2 pl-14">
                      <WaveformCanvas
                        audioBuffer={file.audioBuffer}
                        currentTime={selectedFile?.id === file.id ? currentTime : 0}
                        duration={file.duration || 0}
                        isPlaying={isPlaying && selectedFile?.id === file.id}
                        onSeek={(time) => {
                          setCurrentTime(time)
                          if (audioRef.current && selectedFile?.id === file.id) {
                            audioRef.current.currentTime = time
                          }
                        }}
                        color="#3b82f6"
                        height={60}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground px-1">
                        <span>{formatTime(selectedFile?.id === file.id ? currentTime : 0)}</span>
                        <span>{formatTime(file.duration || 0)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* 音量调节滑块 */}
                  <div className="space-y-2 pl-14">
                    <div className="flex items-center gap-2 justify-between">
                      <Label className="text-foreground font-medium">
                        {t('volume-level', { level: file.volumeLevel })}
                      </Label>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => previewFile(file)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        {(audioRef.current?.paused || selectedFile?.id !== file.id) ? (
                          <Play className="w-4 h-4" />
                        ) : (
                          <Pause className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <Slider
                        value={[file.volumeLevel]}
                        onValueChange={([val]) => updateVolume(file.id, val)}
                        min={0}
                        max={200}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-8 text-right">{file.volumeLevel}%</span>
                    </div>
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
              onClick={processAll}
              disabled={pendingCount === 0 || isProcessing}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 text-white px-8 shadow-lg shadow-blue-500/30"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('status.processing')}
                </>
              ) : (
                <> {t('process-all')} {pendingCount > 0 && `(${pendingCount})`}</>
              )}
            </Button>

            {completedCount > 0 && (
              <Button
                size="lg"
                variant="outline"
                onClick={downloadAll}
                className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10 px-8 bg-white/50 backdrop-blur"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('download-all', { count: completedCount })}
              </Button>
            )}
          </div>
        )}

        {/* 隐藏的音频元素 */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      </CardContent>
    </Card>
  )
}
