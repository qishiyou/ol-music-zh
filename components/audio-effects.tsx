"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { Download, Wand2, Play, Pause, X, FileAudio, Volume2, Waves, Zap, Wind, Music, Mic, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useTranslations } from "./translation-provider"

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

interface EffectFile {
  id: string
  file: File
  name: string
  duration: number
  audioUrl: string
  audioBuffer: AudioBuffer | null
}

interface AudioEffect {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  enabled: boolean
  value: number
}

function createImpulseResponse(
  audioContext: AudioContext | OfflineAudioContext,
  duration: number,
  decay: number,
): AudioBuffer {
  const sampleRate = audioContext.sampleRate
  const length = sampleRate * duration
  const impulse = audioContext.createBuffer(2, length, sampleRate)

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
    }
  }

  return impulse
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
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
  view.setUint32(4, 36 + dataLength, true)
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

  // Interleave channels and write samples
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

export function AudioEffects() {
  const [file, setFile] = useState<EffectFile | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [processedBuffer, setProcessedBuffer] = useState<AudioBuffer | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [playingSource, setPlayingSource] = useState<"original" | "processed">("original")
  const [currentTime, setCurrentTime] = useState(0)
  const [originalTime, setOriginalTime] = useState(0)
  const [processedTime, setProcessedTime] = useState(0)
  const t = useTranslations('effects')

  const [effects, setEffects] = useState([
    {
      id: "reverb",
      icon: <Waves className="w-5 h-5" />,
      enabled: false,
      value: 50,
    },
    {
      id: "echo",
      icon: <Volume2 className="w-5 h-5" />,
      enabled: false,
      value: 30,
    },
    {
      id: "bass",
      icon: <Music className="w-5 h-5" />,
      enabled: false,
      value: 50,
    },
    {
      id: "treble",
      icon: <Zap className="w-5 h-5" />,
      enabled: false,
      value: 50,
    },
    {
      id: "noise",
      icon: <Wind className="w-5 h-5" />,
      enabled: false,
      value: 70,
    },
    {
      id: "vocal",
      icon: <Mic className="w-5 h-5" />,
      enabled: false,
      value: 50,
    },
  ])

  // Computed effects with translations
  const translatedEffects = useMemo(() => {
    return effects.map(effect => ({
      ...effect,
      name: t(`${effect.id}.name`),
      description: t(`${effect.id}.description`)
    }));
  }, [effects, t]);

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const startTimeRef = useRef<number>(0)
  const pauseTimeRef = useRef<number>(0)
  const animationRef = useRef<number | null>(null)
  const originalPauseTimeRef = useRef<number>(0)
  const processedPauseTimeRef = useRef<number>(0)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const decodeAudioFile = async (audioFile: File): Promise<AudioBuffer> => {
    const arrayBuffer = await audioFile.arrayBuffer()
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    return await audioContextRef.current.decodeAudioData(arrayBuffer)
  }

  const handleFile = useCallback(async (fileList: FileList) => {
    const audioFile = Array.from(fileList).find(
      (f) =>
        f.type.startsWith("audio/") ||
        ["mp3", "wav", "ogg", "flac", "m4a"].includes(f.name.split(".").pop()?.toLowerCase() || ""),
    )

    if (audioFile) {
      const url = URL.createObjectURL(audioFile)

      try {
        const audioBuffer = await decodeAudioFile(audioFile)
        setFile({
          id: Math.random().toString(36).substr(2, 9),
          file: audioFile,
          name: audioFile.name,
          duration: audioBuffer.duration,
          audioUrl: url,
          audioBuffer,
        })
        setProcessedUrl(null)
        setProcessedBuffer(null)
        setCurrentTime(0)
        setOriginalTime(0)
        setProcessedTime(0)
        originalPauseTimeRef.current = 0
        processedPauseTimeRef.current = 0
      } catch (error) {
        console.error("Failed to decode audio:", error)
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

  const toggleEffect = (id: string) => {
    setEffects((prev) => prev.map((effect) => (effect.id === id ? { ...effect, enabled: !effect.enabled } : effect)))
  }

  const updateEffectValue = (id: string, value: number) => {
    setEffects((prev) => prev.map((effect) => (effect.id === id ? { ...effect, value } : effect)))
  }

  const playAudio = (buffer: AudioBuffer, source: "original" | "processed") => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }

    const ctx = audioContextRef.current

    // Stop any existing playback
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop()
      sourceNodeRef.current.disconnect()
    }

    const sourceNode = ctx.createBufferSource()
    sourceNode.buffer = buffer
    sourceNode.connect(ctx.destination)

    const pauseTimeToUse = source === "original" ? originalPauseTimeRef.current : processedPauseTimeRef.current
    const offset = pauseTimeToUse

    sourceNode.start(0, offset)
    startTimeRef.current = ctx.currentTime - offset
    sourceNodeRef.current = sourceNode

    sourceNode.onended = () => {
      setIsPlaying(false)
      if (source === "original") {
        originalPauseTimeRef.current = 0
        setOriginalTime(0)
      } else {
        processedPauseTimeRef.current = 0
        setProcessedTime(0)
      }
    }
  }

  const stopAudio = (source: "original" | "processed") => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop()
      sourceNodeRef.current.disconnect()
      sourceNodeRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    if (audioContextRef.current) {
      const elapsed = audioContextRef.current.currentTime - startTimeRef.current
      if (source === "original") {
        originalPauseTimeRef.current = elapsed
      } else {
        processedPauseTimeRef.current = elapsed
      }
    }
  }

  const togglePlayback = (source: "original" | "processed") => {
    const buffer = source === "original" ? file?.audioBuffer : processedBuffer
    if (!buffer) return

    if (isPlaying && playingSource === source) {
      // Pause
      stopAudio(source)
      setIsPlaying(false)
    } else {
      // Play or switch source
      if (isPlaying) {
        stopAudio(playingSource)
      }
      setPlayingSource(source)
      setIsPlaying(true)
      playAudio(buffer, source)
    }
  }

  const seekTo = (time: number, source: "original" | "processed") => {
    const buffer = source === "original" ? file?.audioBuffer : processedBuffer
    if (!buffer) return

    if (source === "original") {
      originalPauseTimeRef.current = time
      setOriginalTime(time)
    } else {
      processedPauseTimeRef.current = time
      setProcessedTime(time)
    }

    if (isPlaying && playingSource === source) {
      // If currently playing this source, restart from new position
      stopAudio(source)
      playAudio(buffer, source)
    }
  }

  useEffect(() => {
    if (isPlaying) {
      const buffer = playingSource === "original" ? file?.audioBuffer : processedBuffer
      if (buffer) {
        const updateTime = () => {
          if (audioContextRef.current && sourceNodeRef.current) {
            const time = audioContextRef.current.currentTime - startTimeRef.current
            if (time <= buffer.duration) {
              if (playingSource === "original") {
                setOriginalTime(time)
              } else {
                setProcessedTime(time)
              }
              setCurrentTime(time)
              animationRef.current = requestAnimationFrame(updateTime)
            } else {
              setIsPlaying(false)
              if (playingSource === "original") {
                originalPauseTimeRef.current = 0
                setOriginalTime(0)
              } else {
                processedPauseTimeRef.current = 0
                setProcessedTime(0)
              }
            }
          }
        }
        animationRef.current = requestAnimationFrame(updateTime)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, playingSource, file?.audioBuffer, processedBuffer])

  const applyEffects = async () => {
    if (!file?.audioBuffer) return

    setIsProcessing(true)
    setProcessProgress(0)

    try {
      const inputBuffer = file.audioBuffer
      const sampleRate = inputBuffer.sampleRate
      const duration = inputBuffer.duration
      const numberOfChannels = inputBuffer.numberOfChannels

      // Get enabled effects
      const enabledEffects = effects.filter((e) => e.enabled)

      // Calculate extra duration for reverb/echo tails
      let extraDuration = 0
      const reverbEffect = enabledEffects.find((e) => e.id === "reverb")
      const echoEffect = enabledEffects.find((e) => e.id === "echo")
      if (reverbEffect) extraDuration = Math.max(extraDuration, 3 * (reverbEffect.value / 100))
      if (echoEffect) extraDuration = Math.max(extraDuration, 2 * (echoEffect.value / 100))

      const totalDuration = duration + extraDuration

      // Create offline context for rendering
      const offlineCtx = new OfflineAudioContext(numberOfChannels, Math.ceil(totalDuration * sampleRate), sampleRate)

      setProcessProgress(10)

      // Create source
      const source = offlineCtx.createBufferSource()
      source.buffer = inputBuffer

      let currentNode: AudioNode = source

      // Apply effects chain
      for (const effect of enabledEffects) {
        const intensity = effect.value / 100

        switch (effect.id) {
          case "reverb": {
            const convolver = offlineCtx.createConvolver()
            const reverbDuration = 1 + intensity * 3
            const decay = 2 + intensity * 3
            convolver.buffer = createImpulseResponse(offlineCtx, reverbDuration, decay)

            const dryGain = offlineCtx.createGain()
            const wetGain = offlineCtx.createGain()
            dryGain.gain.value = 1 - intensity * 0.5
            wetGain.gain.value = intensity * 0.7

            currentNode.connect(dryGain)
            currentNode.connect(convolver)
            convolver.connect(wetGain)

            const merger = offlineCtx.createGain()
            dryGain.connect(merger)
            wetGain.connect(merger)
            currentNode = merger
            break
          }

          case "echo": {
            const delay = offlineCtx.createDelay(2)
            delay.delayTime.value = 0.2 + intensity * 0.5

            const feedback = offlineCtx.createGain()
            feedback.gain.value = intensity * 0.6

            const dryGain = offlineCtx.createGain()
            dryGain.gain.value = 1

            const wetGain = offlineCtx.createGain()
            wetGain.gain.value = intensity * 0.5

            currentNode.connect(dryGain)
            currentNode.connect(delay)
            delay.connect(feedback)
            feedback.connect(delay)
            delay.connect(wetGain)

            const merger = offlineCtx.createGain()
            dryGain.connect(merger)
            wetGain.connect(merger)
            currentNode = merger
            break
          }

          case "bass": {
            const bassFilter = offlineCtx.createBiquadFilter()
            bassFilter.type = "lowshelf"
            bassFilter.frequency.value = 200
            bassFilter.gain.value = intensity * 15

            currentNode.connect(bassFilter)
            currentNode = bassFilter
            break
          }

          case "treble": {
            const trebleFilter = offlineCtx.createBiquadFilter()
            trebleFilter.type = "highshelf"
            trebleFilter.frequency.value = 3000
            trebleFilter.gain.value = intensity * 12

            currentNode.connect(trebleFilter)
            currentNode = trebleFilter
            break
          }

          case "noise": {
            const highpass = offlineCtx.createBiquadFilter()
            highpass.type = "highpass"
            highpass.frequency.value = 20 + intensity * 100
            highpass.Q.value = 0.7

            const lowpass = offlineCtx.createBiquadFilter()
            lowpass.type = "lowpass"
            lowpass.frequency.value = 16000 - intensity * 4000
            lowpass.Q.value = 0.7

            currentNode.connect(highpass)
            highpass.connect(lowpass)
            currentNode = lowpass
            break
          }

          case "vocal": {
            const vocalFilter = offlineCtx.createBiquadFilter()
            vocalFilter.type = "peaking"
            vocalFilter.frequency.value = 2500
            vocalFilter.Q.value = 1
            vocalFilter.gain.value = intensity * 10

            const presenceFilter = offlineCtx.createBiquadFilter()
            presenceFilter.type = "peaking"
            presenceFilter.frequency.value = 4000
            presenceFilter.Q.value = 2
            presenceFilter.gain.value = intensity * 6

            currentNode.connect(vocalFilter)
            vocalFilter.connect(presenceFilter)
            currentNode = presenceFilter
            break
          }
        }

        setProcessProgress(10 + ((enabledEffects.indexOf(effect) + 1) / enabledEffects.length) * 60)
      }

      // Final limiter to prevent clipping
      const limiter = offlineCtx.createDynamicsCompressor()
      limiter.threshold.value = -3
      limiter.knee.value = 0
      limiter.ratio.value = 20
      limiter.attack.value = 0.001
      limiter.release.value = 0.1

      currentNode.connect(limiter)
      limiter.connect(offlineCtx.destination)

      setProcessProgress(75)

      // Start source and render
      source.start(0)
      const renderedBuffer = await offlineCtx.startRendering()

      setProcessProgress(90)

      // Create blob URL for download
      const wavBlob = audioBufferToWav(renderedBuffer)
      const url = URL.createObjectURL(wavBlob)

      setProcessedBuffer(renderedBuffer)
      setProcessedUrl(url)
      setProcessedTime(0)
      processedPauseTimeRef.current = 0
      setProcessProgress(100)
    } catch (error) {
      console.error("Error processing audio:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadProcessed = () => {
    if (!processedUrl || !file) return

    const link = document.createElement("a")
    link.href = processedUrl
    link.download = t('download-filename', { name: file.name.replace(/\.[^/.]+$/, "") })
    link.click()
  }

  const clearFile = () => {
    if (isPlaying) {
      stopAudio(playingSource)
    }
    if (file) {
      URL.revokeObjectURL(file.audioUrl)
    }
    if (processedUrl) {
      URL.revokeObjectURL(processedUrl)
    }
    setFile(null)
    setProcessedUrl(null)
    setProcessedBuffer(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setOriginalTime(0)
    setProcessedTime(0)
    originalPauseTimeRef.current = 0
    processedPauseTimeRef.current = 0
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop()
        sourceNodeRef.current.disconnect()
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const enabledEffectsCount = effects.filter((e) => e.enabled).length

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
                ? "border-chart-3 bg-chart-3/10 scale-[1.01]"
                : "border-chart-3/30 hover:border-chart-3/50 hover:bg-white/50",
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
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Wand2 className="w-10 h-10 text-white" />
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
            <div className="space-y-4">
              {/* 原始音频轨道 */}
              <div className="p-4 rounded-xl bg-white/50 backdrop-blur border border-white/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                      <FileAudio className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{t('original-audio')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePlayback("original")}
                      className="border-primary/30 text-primary hover:bg-primary/10 bg-white/50"
                    >
                      {isPlaying && playingSource === "original" ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearFile}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Waveform for original audio */}
                {file.audioBuffer && (
                  <div className="space-y-2">
                    <WaveformCanvas
                      audioBuffer={file.audioBuffer}
                      currentTime={originalTime}
                      duration={file.duration}
                      isPlaying={isPlaying && playingSource === "original"}
                      onSeek={(time) => seekTo(time, "original")}
                      color="#14b8a6"
                      height={60}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground px-1">
                      <span>{formatTime(originalTime)}</span>
                      <span>{formatTime(file.duration)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 处理后音频轨道 */}
              {processedBuffer && (
                <div className="p-4 rounded-xl bg-green-50/50 backdrop-blur border border-green-200/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <Wand2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{t('processed-audio')}</p>
                        <p className="text-sm text-muted-foreground">{t('applied-effects', { count: enabledEffectsCount })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePlayback("processed")}
                        className="border-green-500/30 text-green-600 hover:bg-green-500/10 bg-white/50"
                      >
                        {isPlaying && playingSource === "processed" ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadProcessed}
                        className="border-green-500/30 text-green-600 hover:bg-green-500/10 bg-white/50"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Waveform for processed audio */}
                  <div className="space-y-2">
                    <WaveformCanvas
                      audioBuffer={processedBuffer}
                      currentTime={processedTime}
                      duration={processedBuffer.duration}
                      isPlaying={isPlaying && playingSource === "processed"}
                      onSeek={(time) => seekTo(time, "processed")}
                      color="#22c55e"
                      height={60}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground px-1">
                      <span>{formatTime(processedTime)}</span>
                      <span>{formatTime(processedBuffer.duration)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 音效列表 */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {translatedEffects.map((effect) => (
                <div
                  key={effect.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-300",
                    effect.enabled
                      ? "bg-primary/10 border-primary/30 shadow-md"
                      : "bg-white/30 border-white/30 hover:bg-white/50",
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          effect.enabled ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {effect.icon}
                      </div>
                      <span className="font-medium text-foreground">{effect.name}</span>
                    </div>
                    <Switch checked={effect.enabled} onCheckedChange={() => toggleEffect(effect.id)} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{effect.description}</p>
                  {effect.enabled && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('intensity')}</span>
                        <span>{effect.value}%</span>
                      </div>
                      <Slider
                        value={[effect.value]}
                        onValueChange={([val]) => updateEffectValue(effect.id, val)}
                        min={0}
                        max={100}
                        step={1}
                        className="py-1"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 处理进度 */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t('processing-audio')}</span>
                  <span>{Math.round(processProgress)}%</span>
                </div>
                <Progress value={processProgress} className="h-2" />
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-wrap justify-center gap-3">
                  <Badge variant="secondary" className="bg-primary/10 text-primary py-2 px-4">
                    {t('enabled-effects-count', { count: enabledEffectsCount })}
                  </Badge>
                </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button
                    onClick={applyEffects}
                    disabled={isProcessing || enabledEffectsCount === 0}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:opacity-90 text-white shadow-lg shadow-teal-500/30"
                  >
                    {isProcessing ? (
                      <>{t('processing')}</>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        {t('apply-effects')}
                      </>
                    )}
                  </Button>

                  {processedUrl && (
                    <Button
                      onClick={downloadProcessed}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white shadow-lg shadow-green-500/30"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t('download-processed')}
                    </Button>
                  )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
