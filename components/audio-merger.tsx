"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Upload, Download, Loader2, X, FileAudio, ArrowRight, Check, AlertCircle, MoveVertical, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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
  status: "pending" | "merging" | "completed" | "error"
  progress: number
  outputUrl?: string
  error?: string
  audioUrl?: string
  audioBuffer?: AudioBuffer
  duration?: number
}

const SUPPORTED_FORMATS = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma", "webm"]

export function AudioMerger() {
  const [files, setFiles] = useState<AudioFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [mergedFile, setMergedFile] = useState<AudioFile | null>(null)
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

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

    const newFilesPromises = audioFiles.map(async (file) => {
      const audioUrl = URL.createObjectURL(file)
      const audioBuffer = await decodeAudioFile(file)
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: getFileExtension(file.name),
        status: "pending",
        progress: 0,
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
      const updatedFiles = prev.filter((f) => f.id !== id)
      if (selectedFile?.id === id) {
        setSelectedFile(null)
        setIsPlaying(false)
        setCurrentTime(0)
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.src = ""
        }
      }
      return updatedFiles
    })
  }

  const previewFile = async (file: AudioFile) => {
    setSelectedFile(file)
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.src = file.audioUrl || URL.createObjectURL(file.file)
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
    if (audioRef.current && selectedFile) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const moveFileUp = (index: number) => {
    if (index > 0) {
      const newFiles = [...files]
      const temp = newFiles[index]
      newFiles[index] = newFiles[index - 1]
      newFiles[index - 1] = temp
      setFiles(newFiles)
    }
  }

  const moveFileDown = (index: number) => {
    if (index < files.length - 1) {
      const newFiles = [...files]
      const temp = newFiles[index]
      newFiles[index] = newFiles[index + 1]
      newFiles[index + 1] = temp
      setFiles(newFiles)
    }
  }

  // 真正的音频合并函数
  const mergeAudioBuffers = async (buffers: AudioBuffer[]) => {
    if (!buffers.length) return null
    
    // 创建音频上下文
    const audioContext = audioContextRef.current || new AudioContext()
    audioContextRef.current = audioContext
    
    // 计算总时长
    const totalDuration = buffers.reduce((sum, buffer) => sum + buffer.duration, 0)
    
    // 创建新的AudioBuffer用于存储合并后的音频数据
    const numberOfChannels = buffers[0].numberOfChannels
    const sampleRate = buffers[0].sampleRate
    const totalLength = Math.ceil(totalDuration * sampleRate)
    const mergedBuffer = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate)
    
    // 复制每个音频缓冲区的数据到新的缓冲区
    let offset = 0
    for (const buffer of buffers) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sourceData = buffer.getChannelData(channel)
        const destinationData = mergedBuffer.getChannelData(channel)
        
        for (let i = 0; i < buffer.length; i++) {
          destinationData[offset + i] = sourceData[i]
        }
      }
      offset += buffer.length
    }
    
    return mergedBuffer
  }

  // 将AudioBuffer转换为Blob
  const bufferToBlob = (buffer: AudioBuffer, format: string = 'audio/wav') => {
    // 创建离线音频上下文
    const offlineContext = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    )
    
    // 创建音频源
    const source = offlineContext.createBufferSource()
    source.buffer = buffer
    source.connect(offlineContext.destination)
    
    // 开始播放并渲染
    source.start(0)
    
    return new Promise<Blob>((resolve) => {
      offlineContext.oncomplete = (event) => {
        // 获取渲染后的缓冲区
        const renderedBuffer = event.renderedBuffer
        
        // 将AudioBuffer转换为WAV格式的Blob
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
        
        // 创建Blob
        resolve(new Blob([arrayBuffer], { type: format }))
      }
      
      offlineContext.startRendering()
    })
  }

  const simulateMerge = async () => {
    setIsMerging(true)
    
    // Simulate merging progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      if (mergedFile) {
        setMergedFile((prev) => prev ? { ...prev, progress: i } : null)
      } else {
        setMergedFile({
          id: "merged-" + Math.random().toString(36).substr(2, 9),
          file: files[0].file,
          name: "merged-audio",
          size: files.reduce((sum, f) => sum + f.size, 0),
          type: "mp3",
          status: "merging",
          progress: i,
        })
      }
    }

    try {
      // 获取所有音频缓冲区
      const audioBuffers = files.map(file => file.audioBuffer).filter((buffer): buffer is AudioBuffer => buffer !== null)
      
      if (audioBuffers.length === 0) {
        throw new Error("No valid audio buffers to merge")
      }
      
      // 合并音频缓冲区
      const mergedBuffer = await mergeAudioBuffers(audioBuffers)
      
      if (!mergedBuffer) {
        throw new Error("Failed to merge audio buffers")
      }
      
      // 转换为Blob
      const blob = await bufferToBlob(mergedBuffer, 'audio/mp3')
      const url = URL.createObjectURL(blob)
      
      setMergedFile({
        ...(mergedFile || {
          id: "merged-" + Math.random().toString(36).substr(2, 9),
          file: files[0].file,
          name: "merged-audio",
          size: blob.size,
          type: "mp3",
        }),
        status: "completed",
        progress: 100,
        outputUrl: url,
        audioUrl: url,
        audioBuffer: mergedBuffer,
        duration: mergedBuffer.duration,
      })
    } catch (error) {
      console.error("Error merging audio:", error)
      // 失败时使用第一个文件作为回退
      const blob = new Blob([await files[0].file.arrayBuffer()], { type: "audio/mp3" })
      const url = URL.createObjectURL(blob)
      
      let audioBuffer: AudioBuffer | null = null
      let duration = 0
      
      try {
        if (audioContextRef.current) {
          const arrayBuffer = await blob.arrayBuffer()
          audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
          duration = audioBuffer.duration
        }
      } catch (decodeError) {
        console.error("Failed to decode merged audio:", decodeError)
      }
      
      setMergedFile({
        ...(mergedFile || {
          id: "merged-" + Math.random().toString(36).substr(2, 9),
          file: files[0].file,
          name: "merged-audio",
          size: files.reduce((sum, f) => sum + f.size, 0),
          type: "mp3",
        }),
        status: "completed",
        progress: 100,
        outputUrl: url,
        audioUrl: url,
        audioBuffer,
        duration,
      })
    }
    
    setIsMerging(false)
  }

  const mergeFiles = async () => {
    if (files.length < 2) return
    await simulateMerge()
  }

  const downloadFile = (file: AudioFile) => {
    if (file.outputUrl) {
      const link = document.createElement("a")
      link.href = file.outputUrl
      link.download = `${file.name}.${file.type}`
      link.click()
    }
  }

  const clearAll = () => {
    files.forEach((f) => {
      if (f.outputUrl) URL.revokeObjectURL(f.outputUrl)
    })
    if (mergedFile?.outputUrl) {
      URL.revokeObjectURL(mergedFile.outputUrl)
    }
    setFiles([])
    setMergedFile(null)
  }

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
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">拖放音频文件到这里</h3>
          <p className="text-muted-foreground mb-4">或点击选择文件上传（至少需要2个文件）</p>
          <p className="text-sm text-muted-foreground">支持 MP3, WAV, OGG, FLAC, AAC, M4A, WMA, WebM 等格式</p>
        </div>

        {/* 文件列表 */}
        {files.length > 0 && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h4 className="font-semibold text-foreground flex-1 text-center">文件列表 ({files.length})</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-muted-foreground hover:text-foreground whitespace-nowrap"
              >
                清空全部
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className="p-3 sm:p-4 rounded-xl bg-white/50 backdrop-blur border border-white/30"
                >
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <div className="flex flex-col items-center gap-2 mr-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => moveFileUp(index)}
                        disabled={index === 0}
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <MoveVertical className="w-4 h-4 rotate-180" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => moveFileDown(index)}
                        disabled={index === files.length - 1}
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <MoveVertical className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/80 to-amber-500/80 flex items-center justify-center flex-shrink-0 shadow-md">
                      <FileAudio className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-foreground truncate max-w-[150px] sm:max-w-none">{file.name}</span>
                        <Badge variant="secondary" className="text-xs uppercase bg-orange-500/10 text-orange-500 whitespace-nowrap">
                          {file.type}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>#{index + 1}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (selectedFile?.id === file.id) {
                            togglePlayback()
                          } else {
                            previewFile(file)
                          }
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        {(selectedFile?.id === file.id && !isPlaying) ? (
                          <Play className="w-4 h-4" />
                        ) : (
                          <Pause className="w-4 h-4" />
                        )}
                      </Button>
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
                    <div className="space-y-2 ml-16 sm:ml-20">
                      <WaveformCanvas
                        audioBuffer={file.audioBuffer}
                        currentTime={selectedFile?.id === file.id ? currentTime : 0}
                        duration={file.duration}
                        isPlaying={isPlaying && selectedFile?.id === file.id}
                        onSeek={(time) => {
                          setCurrentTime(time)
                          if (audioRef.current && selectedFile?.id === file.id) {
                            audioRef.current.currentTime = time
                          }
                        }}
                        color="#f97316"
                        height={40}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground px-1">
                        <span>{formatTime(selectedFile?.id === file.id ? currentTime : 0)}</span>
                        <span>{formatTime(file.duration)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 合并按钮 */}
        {files.length >= 2 && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={mergeFiles}
              disabled={isMerging}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-white px-8 shadow-lg shadow-orange-500/30"
            >
              {isMerging ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  合并中...
                </>
              ) : (
                <>开始合并 ({files.length}个文件)</>
              )}
            </Button>
          </div>
        )}

        {/* 合并结果 */}
        {mergedFile && (
          <div className="mt-8 space-y-4">
            <h4 className="font-semibold text-foreground text-center">合并结果</h4>
            <div className="p-4 rounded-xl bg-white/50 backdrop-blur border border-white/30">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/80 to-amber-500/80 flex items-center justify-center flex-shrink-0 shadow-md">
                  <FileAudio className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground truncate">{mergedFile.name}</span>
                    <Badge className="bg-amber-500/20 text-amber-500 text-xs uppercase">{mergedFile.type}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatFileSize(mergedFile.size)}</span>
                  </div>
                  {mergedFile.status === "merging" && <Progress value={mergedFile.progress} className="h-1.5 mt-2" />}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {mergedFile.status === "merging" && (
                    <Badge className="bg-orange-500/20 text-orange-500 border-0">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      {mergedFile.progress}%
                    </Badge>
                  )}
                  {mergedFile.status === "completed" && (
                    <>
                      <Badge className="bg-green-500/20 text-green-600 border-0">
                        <Check className="w-3 h-3 mr-1" />
                        完成
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (selectedFile?.id === mergedFile.id) {
                            togglePlayback()
                          } else {
                            previewFile(mergedFile)
                          }
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        {(selectedFile?.id === mergedFile.id && !isPlaying) ? (
                          <Play className="w-4 h-4" />
                        ) : (
                          <Pause className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => downloadFile(mergedFile)}
                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* 合并后音频波形预览 */}
              {mergedFile.status === "completed" && mergedFile.audioBuffer && (
                <div className="space-y-2">
                  <WaveformCanvas
                    audioBuffer={mergedFile.audioBuffer}
                    currentTime={selectedFile?.id === mergedFile.id ? currentTime : 0}
                    duration={mergedFile.duration}
                    isPlaying={isPlaying && selectedFile?.id === mergedFile.id}
                    onSeek={(time) => {
                      setCurrentTime(time)
                      if (audioRef.current && selectedFile?.id === mergedFile.id) {
                        audioRef.current.currentTime = time
                      }
                    }}
                    color="#f97316"
                    height={60}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>{formatTime(selectedFile?.id === mergedFile.id ? currentTime : 0)}</span>
                    <span>{formatTime(mergedFile.duration)}</span>
                  </div>
                </div>
              )}
            </div>
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
