"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Play, Pause, Square, Download, Trash2, Volume2, Loader2, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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

export function AudioRecorder() {
  const t = useTranslations('recorder')
  
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [decodedDuration, setDecodedDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(70)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // 解码音频为AudioBuffer
  const decodeAudioBlob = async (blob: Blob): Promise<AudioBuffer | null> => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      const arrayBuffer = await blob.arrayBuffer()
      return await audioContextRef.current.decodeAudioData(arrayBuffer)
    } catch (err) {
      console.error('Failed to decode audio:', err)
      return null
    }
  }
  // 请求麦克风权限
  const requestPermission = async () => {
    // 重置权限状态和错误信息
    setPermissionGranted(null)
    setError(null)
    
    try {
      // 检查可用的音频输入设备
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(device => device.kind === 'audioinput')
      console.log("可用的麦克风设备:", audioInputs)
      
      if (audioInputs.length === 0) {
        // 没有找到麦克风设备
        setPermissionGranted(false)
        setError("未检测到任何麦克风设备，请连接麦克风后重试")
        return
      }
      
      // 请求麦克风访问权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setPermissionGranted(true)
      setError(null)
      // 立即停止流，等待开始录音时再重新获取
      stream.getTracks().forEach(track => track.stop())
    } catch (err) {
      setPermissionGranted(false)
      const error = err as Error
      if (error.name === 'NotFoundError') {
        setError("未找到麦克风设备，请检查设备连接和驱动程序")
      } else if (error.name === 'NotAllowedError') {
        setError("麦克风权限被拒绝，请检查浏览器设置")
      } else if (error.name === 'NotReadableError') {
        setError("麦克风设备被占用或无法访问")
      } else if (error.name === 'OverconstrainedError') {
        setError("无法满足麦克风约束条件")
      } else {
        setError(`无法访问麦克风: ${error.message}`)
      }
      console.error("麦克风权限错误:", err)
    }
  }
  
  // 组件挂载时初始化
  useEffect(() => {
    // 不自动请求权限，让用户主动点击按钮请求
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
    }
  }, [])
  
  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(audioBlob)
        setRecordingUrl(url)
        setDuration(0)
        setCurrentTime(0)
        
        // 更新音频元素的src
        if (audioRef.current) {
          audioRef.current.src = url
        }
        
        // 解码音频为AudioBuffer用于波形显示
        const buffer = await decodeAudioBlob(audioBlob)
        if (buffer) {
          setAudioBuffer(buffer)
          setDecodedDuration(buffer.duration)
        }
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)
      setIsPlaying(false)
      setError(null)
      
      // 开始计时
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
      
    } catch (err) {
      const error = err as Error
      if (error.name === 'NotFoundError') {
        setError("未找到麦克风设备，请检查设备连接")
      } else if (error.name === 'NotAllowedError') {
        setError("麦克风权限被拒绝，请检查浏览器设置")
      } else {
        setError("开始录音失败")
      }
      console.error("录音错误:", err)
    }
  }
  
  // 暂停录音
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }
  
  // 恢复录音
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      // 继续计时
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    }
  }
  
  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      // 停止所有音轨
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }
  
  // 播放录音
  const playRecording = () => {
    if (audioRef.current && recordingUrl) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }
  
  // 暂停播放
  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }
  
  // 停止播放
  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }
  
  // 下载录音
  const downloadRecording = () => {
    if (recordingUrl) {
      const link = document.createElement("a")
      link.href = recordingUrl
      link.download = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.webm`
      link.click()
    }
  }
  
  // 删除录音
  const deleteRecording = () => {
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl)
      setRecordingUrl(null)
      setDuration(0)
      setDecodedDuration(0)
      setCurrentTime(0)
      setIsPlaying(false)
      setAudioBuffer(null)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
    }
  }
  
  // 格式化时间（秒 -> mm:ss）
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  
  // 处理音量变化
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      // 限制音量在0-1之间
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume / 100))
    }
  }
  
  // 处理播放时间更新
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }
  
  // 处理播放结束
  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }
  
  return (
    <Card className="bg-white/60 backdrop-blur-xl border-white/30 shadow-xl shadow-primary/5 overflow-hidden">
      <CardContent className="p-6 md:p-8">
        {/* 权限请求区域 */}
        {permissionGranted === null && (
          <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-blue-50/50 border border-blue-200 mb-6">
            <Mic className="w-12 h-12 text-blue-500" />
            <h3 className="text-xl font-semibold text-blue-600">{t('permission.title')}</h3>
            <p className="text-blue-500 text-center">{t('permission.description')}</p>
            <Button 
              onClick={requestPermission}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {t('permission.button')}
            </Button>
          </div>
        )}
        {permissionGranted === false && error && (
          <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-red-50/50 border border-red-200 mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h3 className="text-xl font-semibold text-red-600">{t('error.title')}</h3>
            <p className="text-red-500 text-center">{error}</p>
            <Button 
              onClick={requestPermission}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {t('error.retry-button')}
            </Button>
          </div>
        )}
        
        {/* 录音状态显示 */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-4">
            {isRecording && (
              <Badge className="bg-red-500/20 text-red-500 border-0 animate-pulse">
                {isPaused ? t('status.paused') : t('status.recording')}
              </Badge>
            )}
            {isPlaying && (
              <Badge className="bg-green-500/20 text-green-500 border-0">
                {t('status.playing')}
              </Badge>
            )}
          </div>
          
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            {isRecording ? (
              <div className="relative">
                <Mic className="w-16 h-16 text-white" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full animate-pulse border-2 border-white" />
              </div>
            ) : (
              <MicOff className="w-16 h-16 text-white" />
            )}
          </div>
          
          <div className="text-3xl font-bold text-foreground mb-2">
            {formatTime(isRecording ? duration : (audioRef.current?.duration || 0))}
          </div>
          <p className="text-muted-foreground">{t('recording-time')}</p>
        </div>
        
        {/* 录音控制按钮 */}
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="flex flex-wrap justify-center gap-4">
            {!isRecording ? (
              <Button
                size="lg"
                onClick={startRecording}
                disabled={!permissionGranted || !!recordingUrl}
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:opacity-90 text-white px-8 py-6 h-auto"
              >
                <Mic className="w-6 h-6 mr-2" />
                {t('buttons.start')}
              </Button>
            ) : isPaused ? (
              <Button
                size="lg"
                onClick={resumeRecording}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white px-8 py-6 h-auto"
              >
                <Play className="w-6 h-6 mr-2" />
                {t('buttons.resume')}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={pauseRecording}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:opacity-90 text-white px-8 py-6 h-auto"
              >
                <Pause className="w-6 h-6 mr-2" />
                {t('buttons.pause')}
              </Button>
            )}
            
            {isRecording && (
              <Button
              size="lg"
              onClick={stopRecording}
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:opacity-90 text-white px-8 py-6 h-auto"
            >
              <Square className="w-6 h-6 mr-2" />
              {t('buttons.stop')}
            </Button>
            )}
          </div>
        </div>
        
        {/* 播放控制区域 */}
        {recordingUrl && (
          <div className="mt-10 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center text-foreground">{t('playback')}</h3>
              
              {/* 波形可视化 */}
              {audioBuffer && (
                <div className="space-y-2">
                  <WaveformCanvas
                    audioBuffer={audioBuffer}
                    currentTime={currentTime}
                    duration={decodedDuration}
                    isPlaying={isPlaying}
                    onSeek={(time) => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = time
                        setCurrentTime(time)
                      }
                    }}
                    color="#a855f7"
                    height={100}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground px-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(decodedDuration)}</span>
                  </div>
                </div>
              )}
              
              {/* 播放控制按钮 */}
              <div className="flex flex-wrap justify-center gap-4">
                {!isPlaying ? (
                  <Button
                    size="lg"
                    onClick={playRecording}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white px-8"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {t('buttons.play')}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={pausePlayback}
                    className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:opacity-90 text-white px-8"
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    {t('buttons.pause-playback')}
                  </Button>
                )}
                
                <Button
                    size="lg"
                    onClick={stopPlayback}
                    className="bg-gradient-to-r from-gray-500 to-slate-500 hover:opacity-90 text-white px-8"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    {t('buttons.stop-playback')}
                  </Button>
              </div>
              
              {/* 音量控制 */}
              <div className="flex items-center gap-4 max-w-md mx-auto px-4">
                <Volume2 className="w-5 h-5 text-muted-foreground" />
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-8 text-right">{volume}%</span>
              </div>
            </div>
            
            {/* 录音管理按钮 */}
            <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-white/30">
              <Button
                onClick={downloadRecording}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 text-white px-6"
              >
                <Download className="w-5 h-5 mr-2" />
                {t('buttons.download')}
              </Button>
              
              <Button
                onClick={deleteRecording}
                variant="outline"
                className="border-red-500/30 text-red-500 hover:bg-red-500/10 px-6"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                {t('buttons.delete')}
              </Button>
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
