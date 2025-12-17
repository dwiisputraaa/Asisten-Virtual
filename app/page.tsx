"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, Mic, MicOff, Youtube, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function VirtualAssistant() {
  const [query, setQuery] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [searchHistory, setSearchHistory] = useState<Array<{ query: string; platform: string; timestamp: Date }>>([])
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check if browser supports Speech Recognition
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "id-ID" // Indonesian language

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setQuery(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    // Load search history from localStorage
    const savedHistory = localStorage.getItem("searchHistory")
    if (savedHistory) {
      setSearchHistory(
        JSON.parse(savedHistory, (key, value) => {
          if (key === "timestamp") return new Date(value)
          return value
        }),
      )
    }
  }, [])

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Maaf, browser Anda tidak mendukung pengenalan suara. Silakan gunakan Chrome atau Edge.")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleSearch = (platform: "google" | "youtube") => {
    if (!query.trim()) return

    const searchUrl =
      platform === "google"
        ? `https://www.google.com/search?q=${encodeURIComponent(query)}`
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`

    // Save to history
    const newHistory = [
      {
        query,
        platform,
        timestamp: new Date(),
      },
      ...searchHistory.slice(0, 9),
    ] // Keep last 10 searches

    setSearchHistory(newHistory)
    localStorage.setItem("searchHistory", JSON.stringify(newHistory))

    // Open in new tab
    window.open(searchUrl, "_blank")
  }

  const handleKeyPress = (e: React.KeyboardEvent, platform: "google" | "youtube") => {
    if (e.key === "Enter") {
      handleSearch(platform)
    }
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem("searchHistory")
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Baru saja"
    if (diffMins < 60) return `${diffMins} menit lalu`
    if (diffHours < 24) return `${diffHours} jam lalu`
    if (diffDays < 7) return `${diffDays} hari lalu`
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Asisten Virtual
          </h1>
          <p className="text-muted-foreground">Cari di Google atau YouTube dengan suara atau teks</p>
        </div>

        {/* Search Card */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            {/* Voice Input Button */}
            <div className="flex justify-center mb-4">
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                className={`rounded-full w-16 h-16 ${isListening ? "animate-pulse" : ""}`}
                onClick={toggleVoiceInput}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
            </div>

            {isListening && (
              <p className="text-center text-sm text-muted-foreground mb-4 animate-pulse">Mendengarkan...</p>
            )}

            {/* Search Input */}
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Apa yang ingin Anda cari?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, "google")}
                className="text-lg h-12"
              />

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleSearch("google")}
                  disabled={!query.trim()}
                  className="h-12 bg-blue-600 hover:bg-blue-700"
                >
                  <Globe className="w-5 h-5 mr-2" />
                  Google
                </Button>
                <Button
                  onClick={() => handleSearch("youtube")}
                  disabled={!query.trim()}
                  className="h-12 bg-red-600 hover:bg-red-700"
                >
                  <Youtube className="w-5 h-5 mr-2" />
                  YouTube
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Riwayat Pencarian</h2>
                <Button variant="ghost" size="sm" onClick={clearHistory} className="text-muted-foreground">
                  Hapus
                </Button>
              </div>

              <div className="space-y-2">
                {searchHistory.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => {
                      setQuery(item.query)
                      handleSearch(item.platform as "google" | "youtube")
                    }}
                  >
                    {item.platform === "google" ? (
                      <Globe className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    ) : (
                      <Youtube className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.query}</p>
                      <p className="text-xs text-muted-foreground">{formatTimestamp(item.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <div className="mt-6 text-center text-sm text-muted-foreground space-y-1">
          <p>💡 Ketuk ikon mikrofon untuk pencarian suara</p>
          <p>⌨️ Atau ketik dan tekan Enter untuk mencari</p>
        </div>
      </div>
    </div>
  )
}
