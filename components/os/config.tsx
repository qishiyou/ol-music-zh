'use client';

import { RefreshCw, Scissors, Wand2, Volume2, FileAudio, Video, Mic, Sparkles } from 'lucide-react';
import { AudioConverter } from '@/components/audio-converter';
import { AudioTrimmer } from '@/components/audio-trimmer';
import { AudioEffects } from '@/components/audio-effects';
import { AudioVolume } from '@/components/audio-volume';
import { AudioMerger } from '@/components/audio-merger';
import { VideoSeparator } from '@/components/video-separator';
import { AudioRecorder } from '@/components/audio-recorder';
import { VocalSeparator } from '@/components/vocal-separator';
import { AIAudio } from '@/components/ai-audio';

export const getTools = (t: any) => [
  { 
    id: 'ai-audio', 
    title: t('features.ai-audio.title'), 
    icon: Sparkles, 
    component: <AIAudio />,
    gradient: "from-blue-600 to-cyan-500",
    shadowColor: "shadow-blue-600/30",
  },
  { 
    id: 'converter', 
    title: t('features.converter.title'), 
    icon: RefreshCw, 
    component: <AudioConverter />,
    gradient: "from-primary to-accent",
    shadowColor: "shadow-primary/30",
  },
  { 
    id: 'trimmer', 
    title: t('features.trimmer.title'), 
    icon: Scissors, 
    component: <AudioTrimmer />,
    gradient: "from-accent to-pink-400",
    shadowColor: "shadow-accent/30",
  },
  { 
    id: 'separator', 
    title: t('features.separator.title'), 
    icon: Wand2, 
    component: <VocalSeparator />,
    gradient: "from-purple-500 to-pink-500",
    shadowColor: "shadow-purple-500/30",
  },
  { 
    id: 'effects', 
    title: t('features.effects.title'), 
    icon: Wand2, 
    component: <AudioEffects />,
    gradient: "from-teal-500 to-cyan-500",
    shadowColor: "shadow-teal-500/30",
  },
  { 
    id: 'volume', 
    title: t('features.volume.title'), 
    icon: Volume2, 
    component: <AudioVolume />,
    gradient: "from-blue-500 to-indigo-500",
    shadowColor: "shadow-blue-500/30",
  },
  { 
    id: 'merger', 
    title: t('features.merger.title'), 
    icon: FileAudio, 
    component: <AudioMerger />,
    gradient: "from-orange-500 to-amber-500",
    shadowColor: "shadow-orange-500/30",
  },
  { 
    id: 'video-separator', 
    title: t('features.video-separator.title'), 
    icon: Video, 
    component: <VideoSeparator />,
    gradient: "from-green-500 to-emerald-500",
    shadowColor: "shadow-green-500/30",
  },
  { 
    id: 'recorder', 
    title: t('features.recorder.title'), 
    icon: Mic, 
    component: <AudioRecorder />,
    gradient: "from-violet-500 to-purple-500",
    shadowColor: "shadow-violet-500/30",
  },
];
