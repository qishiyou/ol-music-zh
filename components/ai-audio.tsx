"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Upload, FileText, Download, Loader2, Play, Pause, X, Languages, Settings2, Wand2, Mic2, Sparkles, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from './translation-provider'
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function AIAudio() {
  const t = useTranslations('ai-audio')
  
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [result, setResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("transcribe")
  
  // ASR Settings
  const [language, setLanguage] = useState("auto")
  const [asrModel, setAsrModel] = useState("Xenova/whisper-tiny")
  
  // Enhancement Settings
  const [enhanceModel, setEnhanceModel] = useState("Xenova/resemble-enhance") // Example, check availability
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((fileList: FileList) => {
    const audioFile = Array.from(fileList).find(
      (f) => f.type.startsWith("audio/") || f.type.startsWith("video/") ||
      ["mp3", "wav", "ogg", "flac", "m4a", "mp4", "mkv"].includes(f.name.split(".").pop()?.toLowerCase() || ""),
    )

    if (audioFile) {
      setFile(audioFile)
      setResult(null)
      setProgress(0)
      setStatus("")
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFile(e.dataTransfer.files)
    }
  }, [handleFile])

  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    return audioContextRef.current;
  };

  const processTranscribe = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress(0)
    setStatus(t('status.loading-model'))

    try {
      console.log("Starting ASR process...");
      
      // Force process.env to exist for Transformers.js compatibility in some environments
      if (typeof window !== 'undefined' && !(window as any).process) {
        (window as any).process = { env: {} };
      }

      // Pre-configure ONNX Runtime for browser environment if possible
      // but let Transformers.js handle its own dependencies
      
      // Use the pre-bundled dist version of Transformers.js for better compatibility with Next.js/Turbopack
      // @ts-ignore
      const Transformers = await import('@xenova/transformers/dist/transformers.js');
      const { pipeline, env } = Transformers;
      console.log("Transformers loaded successfully");
      
      // Basic configuration for Transformers.js v2
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      env.useBrowserCache = true;
      
      // ORT 1.14.0 doesn't have the same backends structure as 1.23.2
      // so we should be careful when accessing it.
      try {
        if (env.backends && env.backends.onnx) {
          env.backends.onnx.wasm.numThreads = 1;
        }
      } catch (e) {
        console.warn("Failed to set WASM threads:", e);
      }

      setStatus(t('status.loading-model'))
      console.log("Loading model:", asrModel);
      
      const transcriber = await pipeline('automatic-speech-recognition', asrModel, {
        progress_callback: (data: any) => {
          if (!data) return;
          if (data.status === 'progress') setProgress(data.progress)
          else if (data.status === 'ready') setStatus(t('status.processing'))
        }
      });
      console.log("Transcriber ready");

      setStatus(t('status.decoding'))
      const audioContext = getAudioContext();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log("Audio decoded", audioBuffer.duration);
      
      const OfflineContext = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
      const offlineContext = new OfflineContext(1, Math.ceil(audioBuffer.duration * 16000), 16000);
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();
      const resampledBuffer = await offlineContext.startRendering();
      const audioData = resampledBuffer.getChannelData(0);
      console.log("Audio resampled", audioData.length);

      setStatus(t('status.transcribing'))
      console.log("Starting transcription...");
      
      const options: any = {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
      };
      
      if (language !== 'auto') {
        options.language = language;
      }
      
      const output = await transcriber(audioData, options);
      console.log("Transcription finished", output);

      if (!output || typeof output !== 'object') {
        throw new Error("Invalid output from transcriber");
      }

      setResult({ type: 'text', data: output })
      setStatus(t('status.completed'))
      setProgress(100)
      toast.success(t('messages.success'))
    } catch (error: any) {
      console.error("ASR Error full:", error);
      setStatus(t('status.error'))
      toast.error(`${t('messages.error')}: ${error.message || 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const processEnhance = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress(0)
    setStatus(t('status.processing'))
    
    try {
      // Simulating process for UI demonstration
      for (let i = 0; i <= 100; i += 20) {
        setProgress(i)
        await new Promise(r => setTimeout(r, 400))
      }
      
      // For demonstration, we'll "use" the original file as the result
      // In a real scenario, this would be a processed Blob
      setResult({ 
        type: 'audio', 
        url: URL.createObjectURL(file),
        name: `${file.name.split('.')[0]}_enhanced.mp3`
      })
      
      setStatus(t('status.completed'))
      toast.success(t('messages.success'))
      toast.info(t('messages.enhance-not-ready'))
    } catch (error) {
      console.error("Enhance Error:", error)
      setStatus(t('status.error'))
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadAudio = () => {
    if (!result || result.type !== 'audio') return
    const a = document.createElement('a')
    a.href = result.url
    a.download = result.name
    a.click()
  }

  const downloadText = () => {
    if (!result || result.type !== 'text') return
    const blob = new Blob([result.data.text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file?.name.split('.')[0]}_transcription.txt`
    a.click()
  }

  const downloadSRT = () => {
    if (!result || result.type !== 'text' || !result.data.chunks) return
    const formatTime = (s: number) => {
      const date = new Date(0)
      date.setSeconds(s)
      const ms = Math.floor((s % 1) * 1000)
      return date.toISOString().substr(11, 8) + ',' + ms.toString().padStart(3, '0')
    }
    const srt = result.data.chunks.map((chunk: any, i: number) => {
      return `${i + 1}\n${formatTime(chunk.timestamp[0])} --> ${formatTime(chunk.timestamp[1])}\n${chunk.text.trim()}\n`
    }).join('\n')
    const blob = new Blob([srt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file?.name.split('.')[0]}.srt`
    a.click()
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
          <TabsTrigger value="transcribe" className="space-x-2">
            <FileText className="w-4 h-4" />
            <span>{t('tabs.transcribe')}</span>
          </TabsTrigger>
          <TabsTrigger value="enhance" className="space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>{t('tabs.enhance')}</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "h-[300px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all cursor-pointer",
                isDragging ? "border-primary bg-primary/5 scale-[0.99]" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files && handleFile(e.target.files)}
                className="hidden"
                accept="audio/*,video/*"
              />
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <p className="text-lg font-medium">{t('upload.title')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('upload.description')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="bg-muted/30">
                <CardContent className="p-4 flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Mic2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              <TabsContent value="transcribe" className="m-0 space-y-4">
                <div className="flex items-center space-x-4">
                  <Select value={asrModel} onValueChange={setAsrModel}>
                    <SelectTrigger className="w-[180px]">
                      <Settings2 className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Xenova/whisper-tiny">{t('models.tiny')}</SelectItem>
                      <SelectItem value="Xenova/whisper-base">{t('models.base')}</SelectItem>
                      <SelectItem value="Xenova/whisper-small">{t('models.small')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-[140px]">
                      <Languages className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">{t('languages.auto')}</SelectItem>
                      <SelectItem value="chinese">{t('languages.chinese')}</SelectItem>
                      <SelectItem value="english">{t('languages.english')}</SelectItem>
                      <SelectItem value="japanese">{t('languages.japanese')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button className="flex-1" onClick={processTranscribe} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                    {t('buttons.start-transcribe')}
                  </Button>
                </div>

                {isProcessing && (
                  <div className="space-y-4 py-8 text-center">
                    <Progress value={progress} className="h-2" />
                    <p className="font-medium">{status}</p>
                    <p className="text-sm text-muted-foreground">{t('messages.ai-processing-hint')}</p>
                  </div>
                )}

                {result && result.type === 'text' && (
                  <Card className="border-primary/20 bg-primary/5 overflow-hidden">
                    <div className="p-3 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{t('labels.transcription')}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={downloadText}>
                          <Download className="w-3 h-3 mr-1" />
                          TXT
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={downloadSRT}>
                          <Download className="w-3 h-3 mr-1" />
                          SRT
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="h-[200px] overflow-y-auto font-sans text-sm leading-relaxed whitespace-pre-wrap pr-2 custom-scrollbar">
                        {result.data.text}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="enhance" className="m-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card 
                    className={cn(
                      "bg-primary/5 border-primary/20 p-4 cursor-pointer hover:bg-primary/10 transition-colors group",
                      isProcessing && "opacity-50 cursor-not-allowed"
                    )} 
                    onClick={() => !isProcessing && processEnhance()}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Sparkles className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                      <span className="font-medium text-sm">{t('enhance-types.enhance.title')}</span>
                      <span className="text-xs text-muted-foreground text-center">{t('enhance-types.enhance.description')}</span>
                    </div>
                  </Card>
                  <Card 
                    className={cn(
                      "bg-primary/5 border-primary/20 p-4 cursor-pointer hover:bg-primary/10 transition-colors group",
                      isProcessing && "opacity-50 cursor-not-allowed"
                    )} 
                    onClick={() => !isProcessing && processEnhance()}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Volume2 className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                      <span className="font-medium text-sm">{t('enhance-types.denoise.title')}</span>
                      <span className="text-xs text-muted-foreground text-center">{t('enhance-types.denoise.description')}</span>
                    </div>
                  </Card>
                </div>

                {isProcessing && activeTab === 'enhance' && (
                  <div className="space-y-4 py-8 text-center">
                    <Progress value={progress} className="h-2" />
                    <p className="font-medium">{status}</p>
                    <p className="text-sm text-muted-foreground">{t('messages.ai-processing-hint')}</p>
                  </div>
                )}

                {result && result.type === 'audio' && (
                  <Card className="border-primary/20 bg-primary/5 overflow-hidden">
                    <div className="p-3 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Play className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{t('labels.preview')}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={downloadAudio}>
                        <Download className="w-3 h-3 mr-1" />
                        {t('buttons.download')}
                      </Button>
                    </div>
                    <CardContent className="p-6">
                      <audio controls className="w-full h-10" src={result.url}>
                        {t('player.not-supported')}
                      </audio>
                      <p className="text-xs text-muted-foreground mt-4 text-center italic">
                        {t('player.ai-preview')}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  )
}
