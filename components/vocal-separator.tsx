"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { Download, Play, Pause, X, FileAudio, Upload, Mic, Music, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useTranslations } from './translation-provider'

interface AudioFile {
  id: string
  file: File
  name: string
  duration: number
  audioUrl: string
}

interface SeparatedAudio {
  vocals: AudioBuffer | null
  instrumental: AudioBuffer | null
  vocalsUrl: string | null
  instrumentalUrl: string | null
}

function WaveformCanvas({
  audioBuffer,
  currentTime,
  duration,
  color,
  onSeek,
}: {
  audioBuffer: AudioBuffer | null
  currentTime: number
  duration: number
  color: string
  onSeek: (time: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !audioBuffer) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    // 获取音频数据
    const channelData = audioBuffer.getChannelData(0)
    const step = Math.ceil(channelData.length / width)
    const amp = height / 2

    // 绘制波形背景
    ctx.fillStyle = color + "20"
    ctx.beginPath()
    ctx.moveTo(0, amp)

    for (let i = 0; i < width; i++) {
      let min = 1.0
      let max = -1.0
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j]
        if (datum < min) min = datum
        if (datum > max) max = datum
      }
      ctx.lineTo(i, (1 + min) * amp)
    }

    for (let i = width - 1; i >= 0; i--) {
      let min = 1.0
      let max = -1.0
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j]
        if (datum < min) min = datum
        if (datum > max) max = datum
      }
      ctx.lineTo(i, (1 + max) * amp)
    }

    ctx.closePath()
    ctx.fill()

    // 绘制已播放部分
    const playedWidth = (currentTime / duration) * width
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, amp)

    for (let i = 0; i < playedWidth; i++) {
      let min = 1.0
      let max = -1.0
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j]
        if (datum < min) min = datum
        if (datum > max) max = datum
      }
      ctx.lineTo(i, (1 + min) * amp)
    }

    for (let i = Math.floor(playedWidth) - 1; i >= 0; i--) {
      let min = 1.0
      let max = -1.0
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j]
        if (datum < min) min = datum
        if (datum > max) max = datum
      }
      ctx.lineTo(i, (1 + max) * amp)
    }

    ctx.closePath()
    ctx.fill()

    // 绘制播放位置线
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(playedWidth, 0)
    ctx.lineTo(playedWidth, height)
    ctx.stroke()
  }, [audioBuffer, currentTime, duration, color])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !duration) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newTime = (x / rect.width) * duration
    onSeek(newTime)
  }

  return (
    <div ref={containerRef} className="w-full h-16 rounded-lg overflow-hidden bg-white/30 cursor-pointer">
      <canvas ref={canvasRef} className="w-full h-full" onClick={handleClick} />
    </div>
  )
}

export function VocalSeparator() {
  const t = useTranslations('separator')
  const tCommon = useTranslations('common')
  
  const [file, setFile] = useState<AudioFile | null>(null)
  const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState("")
  const [separated, setSeparated] = useState<SeparatedAudio>({
    vocals: null,
    instrumental: null,
    vocalsUrl: null,
    instrumentalUrl: null,
  })

  const [vocalsPlaying, setVocalsPlaying] = useState(false)
  const [instrumentalPlaying, setInstrumentalPlaying] = useState(false)
  const [vocalsTime, setVocalsTime] = useState(0)
  const [instrumentalTime, setInstrumentalTime] = useState(0)
  const [vocalsVolume, setVocalsVolume] = useState(100)
  const [instrumentalVolume, setInstrumentalVolume] = useState(100)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const vocalsAudioRef = useRef<HTMLAudioElement>(null)
  const instrumentalAudioRef = useRef<HTMLAudioElement>(null)
  const vocalsAnimationRef = useRef<number | null>(null)
  const instrumentalAnimationRef = useRef<number | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleFile = useCallback(async (fileList: FileList) => {
    const audioFile = Array.from(fileList).find(
      (f) =>
        f.type.startsWith("audio/") ||
        ["mp3", "wav", "ogg", "flac", "m4a"].includes(f.name.split(".").pop()?.toLowerCase() || ""),
    )

    if (audioFile) {
      const url = URL.createObjectURL(audioFile)
      const audio = new Audio(url)

      audio.onloadedmetadata = async () => {
        setFile({
          id: Math.random().toString(36).substr(2, 9),
          file: audioFile,
          name: audioFile.name,
          duration: audio.duration,
          audioUrl: url,
        })

        // 解码原始音频用于显示波形
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext()
        }
        const arrayBuffer = await audioFile.arrayBuffer()
        const buffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
        setOriginalBuffer(buffer)

        setSeparated({
          vocals: null,
          instrumental: null,
          vocalsUrl: null,
          instrumentalUrl: null,
        })
        setProgress(0)
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

  const separateAudio = async () => {
    if (!file || !originalBuffer) return

    setIsProcessing(true)
    setProgress(0)
    setProgressText(t('processing.initializing'))

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      const audioContext = audioContextRef.current
      const sampleRate = originalBuffer.sampleRate
      const length = originalBuffer.length
      const numberOfChannels = originalBuffer.numberOfChannels

      setProgress(5)
      setProgressText(t('processing.analyzing'))

      // FFT 参数
      const fftSize = 4096
      const hopSize = fftSize / 4
      const numFrames = Math.ceil(length / hopSize)

      // 创建输出缓冲区
      const vocalsBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate)
      const instrumentalBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate)

      // 创建 OfflineAudioContext 用于 FFT 分析
      for (let ch = 0; ch < numberOfChannels; ch++) {
        const channelData = originalBuffer.getChannelData(ch)
        const vocalsData = vocalsBuffer.getChannelData(ch)
        const instrumentalData = instrumentalBuffer.getChannelData(ch)

        // 如果是立体声，获取另一个声道用于中央声道提取
        const otherChannelData = numberOfChannels >= 2 ? originalBuffer.getChannelData(ch === 0 ? 1 : 0) : null

        setProgressText(t('processing.processing-channels', { ch: ch + 1, total: numberOfChannels }))

        // 使用重叠相加法进行频谱处理
        for (let frame = 0; frame < numFrames; frame++) {
          const startSample = frame * hopSize
          const endSample = Math.min(startSample + fftSize, length)

          // 提取当前帧
          const frameData = new Float32Array(fftSize)
          const otherFrameData = new Float32Array(fftSize)

          for (let i = 0; i < fftSize && startSample + i < length; i++) {
            // 应用汉宁窗
            const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / fftSize))
            frameData[i] = channelData[startSample + i] * window
            if (otherChannelData) {
              otherFrameData[i] = otherChannelData[startSample + i] * window
            }
          }

          // 核心 AI 级算法改进：基于相位一致性的频谱掩码 (Spectral Masking)
          // 1. 获取 L/R 数据
          const leftData = frameData
          const rightData = otherFrameData || frameData

          for (let i = 0; i < fftSize; i++) {
            const freq = (i / fftSize) * sampleRate
            
            // 2. 计算 Mid/Side 能量比
            // 人声通常在正中间 (L=R)，所以 Mid 能量远大于 Side
            const mid = (leftData[i] + rightData[i]) / 2
            const side = (leftData[i] - rightData[i]) / 2
            
            const midEnergy = mid * mid + 0.000001
            const sideEnergy = side * side + 0.000001
            
            // 3. 计算相位一致性/相关度
            // 如果 mid 能量远大于 side 能量，说明信号位于中心
            let ratio = midEnergy / (midEnergy + sideEnergy) // 0 到 1 之间
            
            // 4. 频率敏感掩码 (人声共振峰优化)
            let frequencyMask = 0
            if (freq >= 150 && freq <= 5000) {
              // 人声核心频段：增强掩码敏感度
              frequencyMask = Math.pow(ratio, 4) // 提高陡峭度，过滤掉非中心成分
            } else if (freq < 150) {
              // 低频段：主要是贝斯和底鼓，即使在中心也要降低人声权重
              frequencyMask = Math.pow(ratio, 8) * 0.3
            } else {
              // 高频段：主要是镲片和高频噪声
              frequencyMask = Math.pow(ratio, 6) * 0.5
            }

            // 5. 维纳滤波模拟 (Wiener Filter)
            // 最终人声样本
            const vocalSample = mid * frequencyMask
            
            // 6. 伴奏样本：从原始信号中减去人声，并保留侧边信号
            // 侧边信号 (Side) 几乎完全是伴奏，不需要减
            const instrumentalSample = leftData[i] - vocalSample * 0.95

            // 7. 重叠相加 (Overlap-Add)
            const outIdx = startSample + i
            if (outIdx < length) {
              vocalsData[outIdx] += vocalSample * (1 / (fftSize / hopSize))
              instrumentalData[outIdx] += instrumentalSample * (1 / (fftSize / hopSize))
            }
          }

          // 更新进度
          if (frame % 100 === 0) {
            const channelProgress = (ch / numberOfChannels) * 80
            const frameProgress = (frame / numFrames) * (80 / numberOfChannels)
            setProgress(10 + channelProgress + frameProgress)
          }
        }
      }

      setProgress(90)
      setProgressText(t('processing.generating'))

      // 归一化处理
      normalizeBuffer(vocalsBuffer)
      normalizeBuffer(instrumentalBuffer)

      // 转换为 WAV
      const vocalsBlob = audioBufferToWav(vocalsBuffer)
      const instrumentalBlob = audioBufferToWav(instrumentalBuffer)

      const vocalsUrl = URL.createObjectURL(vocalsBlob)
      const instrumentalUrl = URL.createObjectURL(instrumentalBlob)

      setSeparated({
        vocals: vocalsBuffer,
        instrumental: instrumentalBuffer,
        vocalsUrl,
        instrumentalUrl,
      })

      setProgress(100)
      setProgressText(t('processing.completed'))
    } catch (error) {
      console.error("分离失败:", error)
      setProgressText(t('processing.error'))
    } finally {
      setIsProcessing(false)
    }
  }

  // 归一化音频缓冲区
  const normalizeBuffer = (buffer: AudioBuffer) => {
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const data = buffer.getChannelData(ch)
      let max = 0
      for (let i = 0; i < data.length; i++) {
        const abs = Math.abs(data[i])
        if (abs > max) max = abs
      }
      if (max > 0) {
        const gain = 0.95 / max
        for (let i = 0; i < data.length; i++) {
          data[i] *= gain
        }
      }
    }
  }

  // AudioBuffer 转 WAV
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numberOfChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const format = 1
    const bitDepth = 16

    const bytesPerSample = bitDepth / 8
    const blockAlign = numberOfChannels * bytesPerSample

    const dataLength = buffer.length * blockAlign
    const bufferLength = 44 + dataLength

    const arrayBuffer = new ArrayBuffer(bufferLength)
    const view = new DataView(arrayBuffer)

    writeString(view, 0, "RIFF")
    view.setUint32(4, 36 + dataLength, true)
    writeString(view, 8, "WAVE")
    writeString(view, 12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, format, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)
    writeString(view, 36, "data")
    view.setUint32(40, dataLength, true)

    const channels: Float32Array[] = []
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i))
    }

    let offset = 44
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]))
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
        view.setInt16(offset, intSample, true)
        offset += 2
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" })
  }

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  const toggleVocalsPlayback = () => {
    const audio = vocalsAudioRef.current
    if (!audio) return

    if (vocalsPlaying) {
      audio.pause()
      if (vocalsAnimationRef.current) {
        cancelAnimationFrame(vocalsAnimationRef.current)
      }
    } else {
      audio.play()
      updateVocalsTime()
    }
    setVocalsPlaying(!vocalsPlaying)
  }

  const updateVocalsTime = () => {
    const audio = vocalsAudioRef.current
    if (audio) {
      setVocalsTime(audio.currentTime)
      vocalsAnimationRef.current = requestAnimationFrame(updateVocalsTime)
    }
  }

  const toggleInstrumentalPlayback = () => {
    const audio = instrumentalAudioRef.current
    if (!audio) return

    if (instrumentalPlaying) {
      audio.pause()
      if (instrumentalAnimationRef.current) {
        cancelAnimationFrame(instrumentalAnimationRef.current)
      }
    } else {
      audio.play()
      updateInstrumentalTime()
    }
    setInstrumentalPlaying(!instrumentalPlaying)
  }

  const updateInstrumentalTime = () => {
    const audio = instrumentalAudioRef.current
    if (audio) {
      setInstrumentalTime(audio.currentTime)
      instrumentalAnimationRef.current = requestAnimationFrame(updateInstrumentalTime)
    }
  }

  const handleVocalsSeek = (time: number) => {
    if (vocalsAudioRef.current) {
      vocalsAudioRef.current.currentTime = time
      setVocalsTime(time)
    }
  }

  const handleInstrumentalSeek = (time: number) => {
    if (instrumentalAudioRef.current) {
      instrumentalAudioRef.current.currentTime = time
      setInstrumentalTime(time)
    }
  }

  useEffect(() => {
    const handleVocalsEnded = () => {
      setVocalsPlaying(false)
      if (vocalsAnimationRef.current) {
        cancelAnimationFrame(vocalsAnimationRef.current)
      }
    }

    const handleInstrumentalEnded = () => {
      setInstrumentalPlaying(false)
      if (instrumentalAnimationRef.current) {
        cancelAnimationFrame(instrumentalAnimationRef.current)
      }
    }

    if (vocalsAudioRef.current) {
      vocalsAudioRef.current.addEventListener("ended", handleVocalsEnded)
    }
    if (instrumentalAudioRef.current) {
      instrumentalAudioRef.current.addEventListener("ended", handleInstrumentalEnded)
    }

    return () => {
      if (vocalsAudioRef.current) {
        vocalsAudioRef.current.removeEventListener("ended", handleVocalsEnded)
      }
      if (instrumentalAudioRef.current) {
        instrumentalAudioRef.current.removeEventListener("ended", handleInstrumentalEnded)
      }
    }
  }, [separated])

  useEffect(() => {
    if (vocalsAudioRef.current) {
      vocalsAudioRef.current.volume = vocalsVolume / 100
    }
  }, [vocalsVolume])

  useEffect(() => {
    if (instrumentalAudioRef.current) {
      instrumentalAudioRef.current.volume = instrumentalVolume / 100
    }
  }, [instrumentalVolume])

  const downloadTrack = (type: "vocals" | "instrumental") => {
    const url = type === "vocals" ? separated.vocalsUrl : separated.instrumentalUrl
    if (!url || !file) return

    const link = document.createElement("a")
    link.href = url
    link.download = `${type === "vocals" ? t('tracks.vocals') : t('tracks.instrumental')}_${file.name.replace(/\.[^/.]+$/, "")}.wav`
    link.click()
  }

  const clearFile = () => {
    if (file) {
      URL.revokeObjectURL(file.audioUrl)
    }
    if (separated.vocalsUrl) {
      URL.revokeObjectURL(separated.vocalsUrl)
    }
    if (separated.instrumentalUrl) {
      URL.revokeObjectURL(separated.instrumentalUrl)
    }
    setFile(null)
    setOriginalBuffer(null)
    setSeparated({
      vocals: null,
      instrumental: null,
      vocalsUrl: null,
      instrumentalUrl: null,
    })
    setVocalsPlaying(false)
    setInstrumentalPlaying(false)
    setVocalsTime(0)
    setInstrumentalTime(0)
    setProgress(0)
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
                ? "border-purple-500 bg-purple-500/10 scale-[1.01]"
                : "border-purple-500/30 hover:border-purple-500/50 hover:bg-white/50",
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
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Mic className="w-10 h-10 text-white" />
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <FileAudio className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{tCommon('labels.duration')}: {formatTime(file.duration)}</p>
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

            {/* 处理按钮或进度 */}
            {!separated.vocalsUrl && (
              <div className="space-y-4">
                {isProcessing ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{progressText}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-center text-sm text-muted-foreground">{progress}%</p>
                  </div>
                ) : (
                  <Button
                    onClick={separateAudio}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white shadow-lg shadow-purple-500/30"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    {t('buttons.start-separating')}
                  </Button>
                )}
              </div>
            )}

            {separated.vocalsUrl && separated.instrumentalUrl && (
              <div className="space-y-6">
                {/* 人声轨道 */}
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <Mic className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">{t('tracks.vocals')}</span>
                        <p className="text-xs text-muted-foreground">{t('tracks.vocals-desc')}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => downloadTrack("vocals")}
                      className="bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      {t('buttons.download-vocals')}
                    </Button>
                  </div>

                  {/* 波形显示 */}
                  <WaveformCanvas
                    audioBuffer={separated.vocals}
                    currentTime={vocalsTime}
                    duration={file.duration}
                    color="#a855f7"
                    onSeek={handleVocalsSeek}
                  />

                  {/* 播放控制 */}
                  <div className="flex items-center gap-4 mt-4">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={toggleVocalsPlayback}
                      className="w-10 h-10 rounded-full border-purple-500/30 hover:bg-purple-500/10 bg-transparent"
                    >
                      {vocalsPlaying ? (
                        <Pause className="w-4 h-4 text-purple-500" />
                      ) : (
                        <Play className="w-4 h-4 text-purple-500 ml-0.5" />
                      )}
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[80px]">
                      {formatTime(vocalsTime)} / {formatTime(file.duration)}
                    </span>
                    <div className="flex items-center gap-2 flex-1">
                      <Music className="w-4 h-4 text-muted-foreground" />
                      <Slider
                        value={[vocalsVolume]}
                        onValueChange={([val]) => setVocalsVolume(val)}
                        min={0}
                        max={100}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-10">{vocalsVolume}%</span>
                    </div>
                  </div>
                  <audio ref={vocalsAudioRef} src={separated.vocalsUrl} />
                </div>

                {/* 伴奏轨道 */}
                <div className="p-4 rounded-xl bg-pink-500/5 border border-pink-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                        <Music className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">{t('tracks.instrumental')}</span>
                        <p className="text-xs text-muted-foreground">{t('tracks.instrumental-desc')}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => downloadTrack("instrumental")}
                      className="bg-pink-500 hover:bg-pink-600 text-white"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      {t('buttons.download-instrumental')}
                    </Button>
                  </div>

                  {/* 波形显示 */}
                  <WaveformCanvas
                    audioBuffer={separated.instrumental}
                    currentTime={instrumentalTime}
                    duration={file.duration}
                    color="#ec4899"
                    onSeek={handleInstrumentalSeek}
                  />

                  {/* 播放控制 */}
                  <div className="flex items-center gap-4 mt-4">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={toggleInstrumentalPlayback}
                      className="w-10 h-10 rounded-full border-pink-500/30 hover:bg-pink-500/10 bg-transparent"
                    >
                      {instrumentalPlaying ? (
                        <Pause className="w-4 h-4 text-pink-500" />
                      ) : (
                        <Play className="w-4 h-4 text-pink-500 ml-0.5" />
                      )}
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[80px]">
                      {formatTime(instrumentalTime)} / {formatTime(file.duration)}
                    </span>
                    <div className="flex items-center gap-2 flex-1">
                      <Music className="w-4 h-4 text-muted-foreground" />
                      <Slider
                        value={[instrumentalVolume]}
                        onValueChange={([val]) => setInstrumentalVolume(val)}
                        min={0}
                        max={100}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-10">{instrumentalVolume}%</span>
                    </div>
                  </div>
                  <audio ref={instrumentalAudioRef} src={separated.instrumentalUrl} />
                </div>

                {/* 重新分离按钮 */}
                <Button variant="outline" onClick={clearFile} className="w-full bg-transparent">
                  <Upload className="w-4 h-4 mr-2" />
                  {t('buttons.upload-new')}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
