"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { Download, Scissors, Play, Pause, RotateCcw, X, FileAudio, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTranslations } from './translation-provider'

interface TrimFile {
  id: string
  file: File
  name: string
  duration: number
  audioUrl: string
  audioBuffer: AudioBuffer | null
}

export function AudioTrimmer() {
  const t = useTranslations('trimmer')
  
  const [file, setFile] = useState<TrimFile | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(100)
  const [isTrimming, setIsTrimming] = useState(false)
  const [trimmedUrl, setTrimmedUrl] = useState<string | null>(null)
  const [waveformData, setWaveformData] = useState<number[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationRef = useRef<number | null>(null)
  const waveformContainerRef = useRef<HTMLDivElement>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
  }

  // 从AudioBuffer提取波形数据
  const extractWaveform = (audioBuffer: AudioBuffer, samples = 200) => {
    const channelData = audioBuffer.getChannelData(0)
    const blockSize = Math.floor(channelData.length / samples)
    const waveform: number[] = []

    for (let i = 0; i < samples; i++) {
      const start = blockSize * i
      let sum = 0
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[start + j] || 0)
      }
      waveform.push(sum / blockSize)
    }

    // 归一化
    const max = Math.max(...waveform)
    return waveform.map((v) => v / max)
  }

  const handleFile = useCallback(async (fileList: FileList) => {
    const audioFile = Array.from(fileList).find(
      (f) =>
        f.type.startsWith("audio/") ||
        ["mp3", "wav", "ogg", "flac", "m4a"].includes(f.name.split(".").pop()?.toLowerCase() || ""),
    )

    if (audioFile) {
      const url = URL.createObjectURL(audioFile)

      // 创建AudioContext解析音频
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }

      try {
        const arrayBuffer = await audioFile.arrayBuffer()
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)

        // 提取波形数据
        const waveform = extractWaveform(audioBuffer, 300)
        setWaveformData(waveform)

        setFile({
          id: Math.random().toString(36).substr(2, 9),
          file: audioFile,
          name: audioFile.name,
          duration: audioBuffer.duration,
          audioUrl: url,
          audioBuffer,
        })
        setTrimStart(0)
        setTrimEnd(100)
        setTrimmedUrl(null)
        setCurrentTime(0)
      } catch (error) {
        console.error("Error decoding audio:", error)
      }
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files) {
        handleFile(e.dataTransfer.files)
      }
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const togglePlayback = () => {
    if (!audioRef.current || !file) return

    if (isPlaying) {
      audioRef.current.pause()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    } else {
      const startTime = (trimStart / 100) * file.duration
      audioRef.current.currentTime = startTime
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !file) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      const endTime = (trimEnd / 100) * file.duration
      if (audio.currentTime >= endTime) {
        audio.pause()
        setIsPlaying(false)
      }
    }

    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [file, trimEnd])

  // 绘制真实波形图
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !file || waveformData.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height

    ctx.clearRect(0, 0, width, height)

    // 绘制背景
    ctx.fillStyle = "rgba(139, 92, 246, 0.05)"
    ctx.fillRect(0, 0, width, height)

    // 绘制未选中区域（灰色）
    const startX = (trimStart / 100) * width
    const endX = (trimEnd / 100) * width

    // 绘制波形
    const barWidth = width / waveformData.length
    const centerY = height / 2

    waveformData.forEach((amplitude, i) => {
      const x = i * barWidth
      const barHeight = amplitude * (height * 0.8)

      // 判断是否在选中区域
      const isSelected = x >= startX && x <= endX

      if (isSelected) {
        // 选中区域 - 渐变色
        const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2)
        gradient.addColorStop(0, "rgba(139, 92, 246, 0.9)")
        gradient.addColorStop(0.5, "rgba(236, 72, 153, 0.9)")
        gradient.addColorStop(1, "rgba(139, 92, 246, 0.9)")
        ctx.fillStyle = gradient
      } else {
        // 未选中区域 - 灰色
        ctx.fillStyle = "rgba(156, 163, 175, 0.4)"
      }

      ctx.fillRect(x, centerY - barHeight / 2, Math.max(barWidth - 1, 1), barHeight)
    })

    // 绘制选中区域边界线
    ctx.strokeStyle = "rgba(139, 92, 246, 0.8)"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(startX, 0)
    ctx.lineTo(startX, height)
    ctx.moveTo(endX, 0)
    ctx.lineTo(endX, height)
    ctx.stroke()
    ctx.setLineDash([])

    // 绘制播放进度线
    if (file.duration > 0) {
      const progressX = (currentTime / file.duration) * width
      ctx.strokeStyle = "rgba(16, 185, 129, 1)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(progressX, 0)
      ctx.lineTo(progressX, height)
      ctx.stroke()

      // 绘制进度指示器
      ctx.fillStyle = "rgba(16, 185, 129, 1)"
      ctx.beginPath()
      ctx.arc(progressX, 8, 6, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [file, trimStart, trimEnd, currentTime, waveformData])

  // 处理波形点击定位
  const handleWaveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!file || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100

    if (audioRef.current) {
      const newTime = (percentage / 100) * file.duration
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  // 处理拖动选择区域
  const handleTrimDrag = (e: React.MouseEvent<HTMLDivElement>, type: "start" | "end") => {
    if (!waveformContainerRef.current || !file) return

    const rect = waveformContainerRef.current.getBoundingClientRect()

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const x = moveEvent.clientX - rect.left
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))

      if (type === "start") {
        setTrimStart(Math.min(percentage, trimEnd - 1))
      } else {
        setTrimEnd(Math.max(percentage, trimStart + 1))
      }
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // 真实的音频剪辑功能
  const handleTrim = async () => {
    if (!file || !file.audioBuffer) return

    setIsTrimming(true)

    try {
      const audioBuffer = file.audioBuffer
      const startSample = Math.floor((trimStart / 100) * audioBuffer.length)
      const endSample = Math.floor((trimEnd / 100) * audioBuffer.length)
      const trimmedLength = endSample - startSample

      // 创建新的AudioBuffer
      const trimmedBuffer = new AudioBuffer({
        numberOfChannels: audioBuffer.numberOfChannels,
        length: trimmedLength,
        sampleRate: audioBuffer.sampleRate,
      })

      // 复制剪辑后的数据
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const sourceData = audioBuffer.getChannelData(channel)
        const targetData = trimmedBuffer.getChannelData(channel)
        for (let i = 0; i < trimmedLength; i++) {
          targetData[i] = sourceData[startSample + i]
        }
      }

      // 将AudioBuffer转换为WAV Blob
      const wavBlob = audioBufferToWav(trimmedBuffer)
      const url = URL.createObjectURL(wavBlob)

      setTrimmedUrl(url)
    } catch (error) {
      console.error("Error trimming audio:", error)
    }

    setIsTrimming(false)
  }

  // AudioBuffer转WAV格式
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const format = 1 // PCM
    const bitDepth = 16

    const bytesPerSample = bitDepth / 8
    const blockAlign = numChannels * bytesPerSample

    const dataLength = buffer.length * blockAlign
    const bufferLength = 44 + dataLength

    const arrayBuffer = new ArrayBuffer(bufferLength)
    const view = new DataView(arrayBuffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, "RIFF")
    view.setUint32(4, bufferLength - 8, true)
    writeString(8, "WAVE")
    writeString(12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, format, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)
    writeString(36, "data")
    view.setUint32(40, dataLength, true)

    // Write audio data
    const channels: Float32Array[] = []
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i))
    }

    let offset = 44
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]))
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
        view.setInt16(offset, intSample, true)
        offset += 2
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" })
  }

  const downloadTrimmed = () => {
    if (!trimmedUrl || !file) return

    const link = document.createElement("a")
    link.href = trimmedUrl
    const baseName = file.name.replace(/\.[^/.]+$/, "")
    link.download = `${baseName}_trimmed.wav`
    link.click()
  }

  const clearFile = () => {
    if (file) {
      URL.revokeObjectURL(file.audioUrl)
    }
    if (trimmedUrl) {
      URL.revokeObjectURL(trimmedUrl)
    }
    setFile(null)
    setTrimmedUrl(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setWaveformData([])
  }

  return (
    <Card className="bg-white/60 backdrop-blur-xl border-white/30 shadow-xl shadow-primary/5 overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">{t('title')}</h2>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>

        {!file ? (
          <div
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 cursor-pointer",
              isDragging
                ? "border-accent bg-accent/10 scale-[1.01]"
                : "border-accent/30 hover:border-accent/50 hover:bg-white/50",
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a"
              className="hidden"
              onChange={(e) => e.target.files && handleFile(e.target.files)}
            />
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent to-pink-400 flex items-center justify-center shadow-lg shadow-accent/30">
              <Scissors className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{t('upload.title')}</h3>
            <p className="text-muted-foreground mb-4">{t('upload.description')}</p>
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('upload.supported-formats')}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 文件信息 */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 backdrop-blur border border-white/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-pink-400 flex items-center justify-center">
                  <FileAudio className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{t('total-duration')}: {formatTime(file.duration)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFile}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* 波形图 */}
            <div ref={waveformContainerRef} className="relative">
              <canvas
                ref={canvasRef}
                onClick={handleWaveformClick}
                className="w-full h-32 rounded-xl bg-white/30 backdrop-blur border border-white/30 cursor-crosshair"
                style={{ display: "block" }}
              />

              {/* 拖动手柄 */}
              <div
                className="absolute top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center group"
                style={{ left: `calc(${trimStart}% - 6px)` }}
                onMouseDown={(e) => handleTrimDrag(e, "start")}
              >
                <div className="w-1.5 h-full bg-primary rounded-full group-hover:bg-primary/80 transition-colors" />
              </div>
              <div
                className="absolute top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center group"
                style={{ left: `calc(${trimEnd}% - 6px)` }}
                onMouseDown={(e) => handleTrimDrag(e, "end")}
              >
                <div className="w-1.5 h-full bg-primary rounded-full group-hover:bg-primary/80 transition-colors" />
              </div>

              <audio ref={audioRef} src={file.audioUrl} />
            </div>

            {/* 时间信息 */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl bg-white/50 backdrop-blur border border-white/30">
                <Label className="text-xs text-muted-foreground">{t('start-time')}</Label>
                <p className="font-mono font-medium text-foreground">{formatTime((trimStart / 100) * file.duration)}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 backdrop-blur border border-primary/20">
                <Label className="text-xs text-primary">{t('trim-duration')}</Label>
                <p className="font-mono font-bold text-primary">
                  {formatTime(((trimEnd - trimStart) / 100) * file.duration)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/50 backdrop-blur border border-white/30">
                <Label className="text-xs text-muted-foreground">{t('end-time')}</Label>
                <p className="font-mono font-medium text-foreground">{formatTime((trimEnd / 100) * file.duration)}</p>
              </div>
            </div>

            {/* 提示信息 */}
            <div className="text-center">
              <Badge variant="secondary" className="bg-accent/10 text-accent">
                {t('tip')}
              </Badge>
            </div>

            {/* 控制按钮 */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={togglePlayback}
                className="border-primary/30 text-primary hover:bg-primary/10 bg-white/50 backdrop-blur"
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? t('pause') : t('preview')}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setTrimStart(0)
                  setTrimEnd(100)
                }}
                className="border-muted-foreground/30 text-muted-foreground hover:bg-muted/50 bg-white/50 backdrop-blur"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('reset')}
              </Button>

              <Button
                onClick={handleTrim}
                disabled={isTrimming}
                className="bg-gradient-to-r from-accent to-pink-400 hover:opacity-90 text-white shadow-lg shadow-accent/30"
              >
                {isTrimming ? (
                  <>{t('trimming')}</>
                ) : (
                  <>
                    <Scissors className="w-4 h-4 mr-2" />
                    {t('trim')}
                  </>
                )}
              </Button>

              {trimmedUrl && (
                <Button
                  onClick={downloadTrimmed}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white shadow-lg shadow-green-500/30"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('download')}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
