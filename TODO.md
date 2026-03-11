# Voice Chat Integration (AI Character)

## 1. Thêm nút Voice vào ChatMain

### Import

```javascript
import { useState } from "react";
import { VoiceChatModal } from "./VoiceChatModal";
```

### State

```javascript
const [isVoiceOpen, setIsVoiceOpen] = useState(false);
```

### Nút Voice trong Toolbar

Thêm nút này cạnh nút gửi tin nhắn hoặc trong header.

```jsx
<button
  onClick={() => setIsVoiceOpen(true)}
  disabled={!sessionId}
  className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:brightness-110 disabled:opacity-40"
  style={{
    background: "rgba(201,168,76,0.15)",
    border: "1px solid rgba(201,168,76,0.3)",
  }}
  title="Gọi thoại với nhân vật"
>
  {/* Phone icon */}
  <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(201,168,76,0.9)">
    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
  </svg>
</button>
```

### Thêm Voice Modal vào cuối JSX

```jsx
{
  isVoiceOpen && sessionId && (
    <VoiceChatModal
      character={character}
      sessionId={sessionId}
      contextId={contextId}
      onClose={() => setIsVoiceOpen(false)}
    />
  );
}
```

---

# 2. Backend Java (Spring Boot WebSocket)

## Dependency (pom.xml)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>

<!-- OpenAI Java SDK -->
<dependency>
    <groupId>com.theokanning.openai-gpt3-java</groupId>
    <artifactId>service</artifactId>
    <version>0.18.2</version>
</dependency>
```

---

# WebSocket Endpoint

```
ws://host:8080/Historical-tell/ws/voice/{sessionId}
```

### Query Params

```
characterId
contextId
```

---

# VoiceChatWebSocket Flow

## 1. onOpen

- Load session từ DB → lấy `messageHistory`
- Gọi AI Service tạo greeting message
- Gọi OpenAI TTS API
- Gửi transcript về client
- Stream audio

Ví dụ message:

```json
{ "type": "transcript_assistant", "text": "..." }
```

Sau đó gửi audio dạng binary.

Kết thúc audio:

```json
{ "type": "audio_end" }
```

---

# 2. onBinaryMessage (Audio từ Microphone)

Flow:

1. Buffer audio chunks
2. Khi detect silence hoặc đủ buffer thì xử lý

## STT (Whisper)

```
POST https://api.openai.com/v1/audio/transcriptions
```

Request:

```
file: audio.webm
model: whisper-1
language: vi
response_format: text
```

## Gửi transcript user

```json
{ "type": "transcript_user", "text": "..." }
```

## Gọi AI Chat

```
POST /v1/ai/chat
```

## Gửi transcript assistant

```json
{ "type": "transcript_assistant", "text": "..." }
```

---

# TTS (Text To Speech)

```
POST https://api.openai.com/v1/audio/speech
```

Request:

```
model: tts-1
voice: onyx
input: text response
response_format: mp3
speed: 0.9
```

Sau đó stream audio về client.

---

# VoiceChatWebSocketHandler Skeleton

```java
@Component
public class VoiceChatWebSocketHandler extends BinaryWebSocketHandler {

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {

        String sessionId = extractPathVar(session, "sessionId");
        String characterId = extractParam(session, "characterId");
        String contextId = extractParam(session, "contextId");

        voiceSessionStore.put(
            session.getId(),
            new VoiceContext(sessionId, characterId, contextId)
        );
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession wsSession, BinaryMessage message) {

        VoiceContext ctx = voiceSessionStore.get(wsSession.getId());
        ctx.audioBuffer.write(message.getPayload().array());

        processAudioChunk(wsSession, ctx);
    }

    @Override
    protected void handleTextMessage(WebSocketSession wsSession, TextMessage message) {

        JsonNode json = objectMapper.readTree(message.getPayload());
        String type = json.get("type").asText();

        if ("start_call".equals(type)) {
            sendGreeting(wsSession, voiceSessionStore.get(wsSession.getId()));
        }

        else if ("end_call".equals(type)) {
            wsSession.close();
        }
    }
}
```

---

# Greeting Flow

```java
private void sendGreeting(WebSocketSession ws, VoiceContext ctx) {

    String greeting = aiServiceClient.chat(
        ctx.characterId,
        ctx.contextId,
        "Hãy bắt đầu cuộc trò chuyện",
        List.of()
    );

    ws.sendMessage(new TextMessage(
        toJson("transcript_assistant", greeting)
    ));

    streamTTS(ws, greeting);

    ws.sendMessage(new TextMessage(
        toJson("audio_end", null)
    ));
}
```

---

# Process Audio

```java
private void processAudioChunk(WebSocketSession ws, VoiceContext ctx) {

    byte[] audio = ctx.audioBuffer.toByteArray();

    if (audio.length < MIN_AUDIO_SIZE) return;

    ctx.audioBuffer.reset();

    String transcript = whisperClient.transcribe(audio, "vi");

    if (transcript.isBlank()) return;

    ws.sendMessage(new TextMessage(
        toJson("transcript_user", transcript)
    ));

    ctx.history.add(new ChatMessage("user", transcript));

    String response = aiServiceClient.chat(
        ctx.characterId,
        ctx.contextId,
        transcript,
        ctx.history
    );

    ctx.history.add(new ChatMessage("assistant", response));

    ws.sendMessage(new TextMessage(
        toJson("transcript_assistant", response)
    ));

    streamTTS(ws, response);

    ws.sendMessage(new TextMessage(
        toJson("audio_end", null)
    ));

    messageService.saveVoiceMessages(
        ctx.dbSessionId,
        transcript,
        response
    );
}
```

---

# Stream TTS

```java
private void streamTTS(WebSocketSession ws, String text) {

    InputStream audioStream = openAiClient.createSpeech(
        TTSRequest.builder()
            .model("tts-1")
            .voice("onyx")
            .input(text)
            .speed(0.9f)
            .build()
    );

    byte[] buf = new byte[4096];
    int n;

    while ((n = audioStream.read(buf)) != -1) {
        ws.sendMessage(new BinaryMessage(Arrays.copyOf(buf, n)));
    }
}
```

---

# 3. WebSocket Config (Spring)

```java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired
    VoiceChatWebSocketHandler handler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {

        registry.addHandler(handler, "/ws/voice/{sessionId}")
                .setAllowedOrigins("*");
    }
}
```
