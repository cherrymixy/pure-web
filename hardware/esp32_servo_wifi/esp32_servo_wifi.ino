/*
  ESP32 DevKitC V4 (WROOM) - 휴대폰 웹으로 로봇 제어
  M4, M3 : ESP32에 직접 연결 (PWM 서보)
  M2     : ESP32에 직접 연결 (ST3215, 저항 연결 방식, 나중에 연결)
  M1, 영상: RP2350-PiZero에 연결 (영상 플레이어 펌웨어), ESP32가 UART로 명령 전달

  [준비]
  - 보드 매니저: "esp32 by Espressif Systems" → 보드: "ESP32 Dev Module"
  - 라이브러리: "ESP32Servo", SCServo (Waveshare ST3215 예제에 포함)

  [사용법]
  1. 휴대폰 와이파이 "Robot-ESP32" 연결 (비밀번호 12345678)
  2. 휴대폰 브라우저에서 192.168.4.1 접속
  3. PURE 웹: 노트북을 같은 와이파이에 연결 → npm run dev → 에디터 "Test on robot" → PURE (real robot)
     웹은 /pose?m1=..&m2=..&m3=..&m4=.. 를 초당 ~10번 보냄 (CORS 허용)

  [각도 기준] 모든 모터 공통: 0도 = 서보 중앙

  [모터 / 안전 범위] (이 범위 밖으로는 어떤 경우에도 명령을 보내지 않음)
  1번 M4 : PWM,     GPIO 26                    -45 ~ +45
  2번 M3 : PWM,     GPIO 25                    -60 ~ +5
  3번 M2 : ST3215,  GPIO 17 → 1kΩ → DATA       +40 ~ +80
  4번 M1 : HS-5085MG, RP2350 GPIO12 (목 좌우)  -45 ~ +45

  [RP2350 연결] (RP2350 펌웨어: video_player_m1.uf2)
  ESP32 GPIO 32 (TX) → RP2350 GPIO1 (UART0 RX)
  ESP32 GPIO 33 (RX) ← RP2350 GPIO0 (UART0 TX)
  GND 공통

  [RP2350으로 보내는 명령] 한 줄에 하나
  PING → PONG,  V <1~8> → 영상 재생 (F<번호> 응답),  m1 <각도> → 목 각도
*/

// ===== M2(ST3215) 사용 여부 =====
// 0: M2 없이 사용 (SCServo 라이브러리 없어도 업로드 가능)
// 1: M2 연결 후 사용 (SCServo 라이브러리 필요)
#define USE_M2 1
#define BUS_ADAPTER 1

#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>
#if USE_M2
#include <SCServo.h>
#endif

// ===== 와이파이 =====
const char* AP_SSID = "Robot-ESP32";
const char* AP_PASS = "12345678";

// ===== PWM 서보 =====
const int PIN_M4 = 26;
const int PIN_M3 = 25;
const int MIN_US = 500;
const int MAX_US = 2500;

// ===== 버스 서보 (ST3215, 저항 연결) =====
const int BUS_RX = 16;            // 저항 방식에서는 연결 안 해도 됨
const int BUS_TX = 17;            // → 1kΩ → DATA
const long BUS_BAUD = 1000000;
const int M2_ID = 1;
const int BUS_SPEED = 3400;
const int BUS_ACC = 100;

// ===== RP2350 연결 =====
const int LINK_TX = 32;
const int LINK_RX = 33;
const long LINK_BAUD = 115200;

// ===== 안전 범위 (절대 넘지 않음) =====
const float M4_MIN = -45, M4_MAX = 45;
const float M3_MIN = -60, M3_MAX = 5;
const float M2_MIN = 40,  M2_MAX = 80;
const float M1_MIN = -45, M1_MAX = 45;

// ===== 시작 각도 (반드시 안전 범위 안) =====
const float M4_HOME = 0;
const float M3_HOME = 0;
const float M2_HOME = 45;
const float M1_HOME = 0;

// ===== 동작 경로: {도착 각도, 이전 지점에서 걸리는 시간 ms} =====
struct Key { float angle; unsigned long ms; };

const Key PATH_M4[] = { {0, 0}, {45, 1500}, {-45, 3000}, {0, 1500} };
const Key PATH_M3[] = { {0, 0}, {-60, 3000}, {0, 3000} };
const Key PATH_M2[] = { {45, 0}, {80, 2000}, {45, 2000} };
// M1 목: 왼쪽 보고 잠깐 멈춤 → 오른쪽 보고 잠깐 멈춤 → 정면
const Key PATH_M1[] = { {0, 0}, {40, 1500}, {40, 800}, {-40, 3000}, {-40, 800}, {0, 1500} };

#define LEN(x) (sizeof(x) / sizeof(x[0]))

// ===== 모터 상태 =====
enum Kind { KIND_PWM, KIND_BUS, KIND_REMOTE };

struct Motor {
  const char* name;
  const char* key;    // 웹/명령용 이름 (m1 ~ m4)
  Kind kind;
  Servo servo;        // PWM
  int busId;          // BUS
  int lastPos;        // BUS: 마지막으로 보낸 위치값
  float lastSent;     // REMOTE: 마지막으로 보낸 각도
  float minA, maxA;
  float home;
  const Key* path;
  int n;
  Key single[1];
  float cur;
  float fromAngle;
  float introMs;
  float vt;
  bool playing;
};

Motor m4, m3, m2, m1;
#if USE_M2
Motor* motors[] = { &m4, &m3, &m2, &m1 };
SMS_STS bus;
#else
Motor* motors[] = { &m4, &m3, &m1 };
#endif
const int NUM_MOTORS = sizeof(motors) / sizeof(motors[0]);
float speedFactor = 1.0;
unsigned long lastTick = 0;

// RP2350 연결 상태
String linkBuf;
unsigned long lastPing = 0;
unsigned long lastPong = 0;
int curVideo = 0;        // RP2350이 마지막으로 확인해 준 영상 번호 (0 = 아직 없음)
int badVideo = 0;        // RP2350에 없는 영상 번호를 요청했을 때

WebServer server(80);

// ===== 계산 =====
float ease(float t) { return 0.5 - 0.5 * cos(PI * t); }

float loopAngle(const Key* p, int n, unsigned long t) {
  if (n < 2) return p[0].angle;
  unsigned long total = 0;
  for (int i = 1; i < n; i++) total += p[i].ms;
  t %= total;
  for (int i = 1; i < n; i++) {
    if (t < p[i].ms) {
      float r = ease((float)t / p[i].ms);
      return p[i - 1].angle + (p[i].angle - p[i - 1].angle) * r;
    }
    t -= p[i].ms;
  }
  return p[n - 1].angle;
}

int angleToPos(float rel) {
  return constrain(2048 + (int)lround(rel * 4096.0 / 360.0), 0, 4095);
}

void flushBus() {
#if USE_M2
  while (Serial2.available()) Serial2.read();
#endif
}

// 모든 출력은 여기를 거침 → 안전 범위 밖으로는 절대 명령이 나가지 않음
void writeSafe(Motor& m, float rel) {
  rel = constrain(rel, m.minA, m.maxA);
  m.cur = rel;
  switch (m.kind) {
    case KIND_PWM: {
      int us = MIN_US + (rel + 90.0) * (MAX_US - MIN_US) / 180.0;
      m.servo.writeMicroseconds(us);
      break;
    }
    case KIND_BUS: {
      int pos = angleToPos(rel);
      if (pos != m.lastPos) {
#if USE_M2
        bus.WritePosEx(m.busId, pos, BUS_SPEED, BUS_ACC);
        flushBus();
#endif
        m.lastPos = pos;
      }
      break;
    }
    case KIND_REMOTE: {
      if (fabs(rel - m.lastSent) >= 0.3) {
        Serial1.printf("%s %.1f\n", m.key, rel);
        m.lastSent = rel;
      }
      break;
    }
  }
}

void startPath(Motor& m, const Key* p, int n) {
  m.path = p;
  m.n = n;
  m.fromAngle = m.cur;
  float target = constrain(p[0].angle, m.minA, m.maxA);
  m.introMs = fabs(target - m.cur) / 90.0 * 1500.0;
  m.vt = 0;
  m.playing = true;
}

void goTo(Motor& m, float angle) {
  m.single[0].angle = constrain(angle, m.minA, m.maxA);
  m.single[0].ms = 0;
  startPath(m, m.single, 1);
}

void stopMotor(Motor& m) { m.playing = false; }

void updateMotor(Motor& m, float dt) {
  if (!m.playing) return;
  m.vt += dt;
  float a;
  if (m.introMs > 0 && m.vt < m.introMs) {
    a = m.fromAngle + (m.path[0].angle - m.fromAngle) * ease(m.vt / m.introMs);
  } else {
    a = loopAngle(m.path, m.n, (unsigned long)(m.vt - m.introMs));
    if (m.n < 2) m.playing = false;
  }
  writeSafe(m, a);
}

// ===== 웹 페이지 =====
const char PAGE[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>로봇 제어</title>
<style>
  body { font-family: sans-serif; background:#111; color:#eee; margin:0; padding:20px; }
  h1 { font-size:22px; text-align:center; margin-bottom:4px; }
  h2 { font-size:16px; margin:24px 0 6px; color:#aaa; }
  button { display:block; width:100%; padding:16px; margin:8px 0; font-size:17px;
           border:none; border-radius:12px; background:#2d6cdf; color:#fff; }
  button:active { opacity:0.6; }
  .row { display:flex; gap:8px; }
  .row button { flex:1; background:#444; }
  .home { background:#3a3a3a; }
  .stop { background:#c0392b; font-weight:bold; }
  .vid { background:#7a4fd1; }
  .vid.on { background:#b98cff; color:#111; font-weight:bold; }
  .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
  .grid button { margin:0; }
  input[type=range] { width:100%; height:32px; }
  .val { float:right; color:#fff; }
  #link { text-align:center; font-size:14px; color:#888; }
  #msg { margin-top:14px; color:#8f8; text-align:center; min-height:20px; }
</style>
</head>
<body>
<h1>로봇 제어</h1>
<div id="link">RP2350 확인 중…</div>

<button class="stop" onclick="cmd('stop')">정지</button>

<h2>동작</h2>
<button onclick="cmd('m4')">동작 1 : 1번 M4 반복</button>
<button onclick="cmd('m3')">동작 2 : 2번 M3 반복</button>
%M2BTN%
<button onclick="cmd('m1')">동작 4 : 4번 M1 목 좌우</button>
<button onclick="cmd('all')">동작 5 : 전체</button>
<button class="home" onclick="cmd('home')">원점</button>

<h2>표정 영상 <span class="val" id="vnow"></span></h2>
<div class="grid">
  <button class="vid" id="vb1" onclick="vid(1)">1</button>
  <button class="vid" id="vb2" onclick="vid(2)">2</button>
  <button class="vid" id="vb3" onclick="vid(3)">3</button>
  <button class="vid" id="vb4" onclick="vid(4)">4</button>
  <button class="vid" id="vb5" onclick="vid(5)">5</button>
  <button class="vid" id="vb6" onclick="vid(6)">6</button>
  <button class="vid" id="vb7" onclick="vid(7)">7</button>
  <button class="vid" id="vb8" onclick="vid(8)">8</button>
</div>

%SLIDERS%

<h2>속도 <span class="val">x<span id="sv">1.0</span></span></h2>
<input type="range" min="0.3" max="2" step="0.1" value="1"
       oninput="sv.textContent=this.value" onchange="get('/speed?v='+this.value)">

<div id="msg"></div>

<script>
function get(u){ return fetch(u).then(r=>r.text()).then(t=>{msg.textContent=t; return t;}).catch(()=>msg.textContent='연결 실패'); }
function cmd(c){ get('/cmd?c='+c); }
function setM(m,v){ get('/set?m='+m+'&v='+v); }
function nudge(m,d){
  const s = document.getElementById('s_'+m);
  let v = Math.min(+s.max, Math.max(+s.min, +s.value + d));
  s.value = v;
  document.getElementById('v_'+m).textContent = v;
  setM(m, v);
}
function vid(n){ get('/video?n='+n); setTimeout(poll, 300); }
function poll(){
  fetch('/status').then(r=>r.text()).then(t=>{
    const [ok, cur, bad] = t.split(',').map(Number);
    link.textContent = ok ? 'RP2350 연결됨' : 'RP2350 연결 안 됨';
    link.style.color = ok ? '#8f8' : '#f88';
    for (let i = 1; i <= 8; i++) document.getElementById('vb'+i).classList.toggle('on', i == cur);
    vnow.textContent = bad ? (bad + '번 영상 없음') : (cur ? ('재생 중: ' + cur + '번') : '');
  }).catch(()=>{ link.textContent='ESP32 연결 끊김'; link.style.color='#f88'; });
}
poll(); setInterval(poll, 2000);
</script>
</body>
</html>
)rawliteral";

String sliderHtml(const char* label, const Motor& m) {
  String key = m.key;
  String mn = String((int)m.minA), mx = String((int)m.maxA), hv = String((int)m.cur);
  String h;
  h += "<h2>" + String(label) + " <span class='val'><span id='v_" + key + "'>" + hv +
       "</span>° (" + mn + " ~ " + mx + ")</span></h2>";
  h += "<input type='range' id='s_" + key + "' min='" + mn + "' max='" + mx +
       "' step='1' value='" + hv + "' oninput=\"document.getElementById('v_" + key +
       "').textContent=this.value\" onchange=\"setM('" + key + "',this.value)\">";
  h += "<div class='row'>";
  const int steps[] = { -5, -1, 1, 5 };
  for (int s : steps) {
    h += "<button onclick=\"nudge('" + key + "'," + String(s) + ")\">" +
         (s > 0 ? "+" : "") + String(s) + "°</button>";
  }
  h += "</div>";
  return h;
}

void handleRoot() {
  String page = FPSTR(PAGE);
  String sliders = sliderHtml("1번 M4", m4) +
                   sliderHtml("2번 M3", m3) +
                   (USE_M2 ? sliderHtml("3번 M2", m2) : String("")) +
                   sliderHtml("4번 M1 (목)", m1);
  page.replace("%SLIDERS%", sliders);
  page.replace("%M2BTN%", USE_M2 ? "<button onclick=\"cmd('m2')\">동작 3 : 3번 M2 반복</button>" : "");
  server.send(200, "text/html; charset=utf-8", page);
}

Motor* motorByKey(const String& k) {
  for (int i = 0; i < NUM_MOTORS; i++)
    if (k == motors[i]->key) return motors[i];
  return nullptr;
}

void handleCmd() {
  String c = server.arg("c");
  String res;
  if (c == "m4")        { startPath(m4, PATH_M4, LEN(PATH_M4)); res = "동작 1 : M4 실행"; }
  else if (c == "m3")   { startPath(m3, PATH_M3, LEN(PATH_M3)); res = "동작 2 : M3 실행"; }
  else if (c == "m2" && USE_M2) { startPath(m2, PATH_M2, LEN(PATH_M2)); res = "동작 3 : M2 실행"; }
  else if (c == "m1")   { startPath(m1, PATH_M1, LEN(PATH_M1)); res = "동작 4 : M1 실행"; }
  else if (c == "all")  { startPath(m4, PATH_M4, LEN(PATH_M4));
                          startPath(m3, PATH_M3, LEN(PATH_M3));
                          if (USE_M2) startPath(m2, PATH_M2, LEN(PATH_M2));
                          startPath(m1, PATH_M1, LEN(PATH_M1)); res = "동작 5 : 전체 실행"; }
  else if (c == "home") { for (int i = 0; i < NUM_MOTORS; i++) goTo(*motors[i], motors[i]->home); res = "원점 이동"; }
  else if (c == "stop") { for (int i = 0; i < NUM_MOTORS; i++) stopMotor(*motors[i]); res = "정지"; }
  else res = "알 수 없는 명령";
  Serial.println(res);
  server.send(200, "text/plain; charset=utf-8", res);
}

void handleSet() {
  Motor* mot = motorByKey(server.arg("m"));
  if (!mot) { server.send(400, "text/plain; charset=utf-8", "모터 없음"); return; }
  float t = constrain(server.arg("v").toFloat(), mot->minA, mot->maxA);
  goTo(*mot, t);
  String res = String(mot->name) + " → " + String((int)t) + "도";
  Serial.println(res);
  server.send(200, "text/plain; charset=utf-8", res);
}

// PURE 웹 실시간 재생: 받은 모터만 그 각도로 (안전 범위는 goTo/writeSafe에서 다시 자름)
void handlePose() {
  int n = 0;
  for (int i = 0; i < NUM_MOTORS; i++) {
    Motor& m = *motors[i];
    if (!server.hasArg(m.key)) continue;
    goTo(m, server.arg(m.key).toFloat());
    n++;
  }
  server.send(n ? 200 : 400, "text/plain; charset=utf-8", n ? "ok" : "모터 없음");
}

void handleSpeed() {
  speedFactor = constrain(server.arg("v").toFloat(), 0.3, 2.0);
  server.send(200, "text/plain; charset=utf-8", "속도 x" + String(speedFactor, 1));
}

void handleVideo() {
  int n = constrain(server.arg("n").toInt(), 1, 8);
  Serial1.printf("V %d\n", n);
  Serial.printf("영상 %d 요청\n", n);
  server.send(200, "text/plain; charset=utf-8", "영상 " + String(n) + " 요청");
}

// "연결(1/0),현재 영상,없는 영상"
void handleStatus() {
  bool ok = (lastPong != 0) && (millis() - lastPong < 3000);
  server.send(200, "text/plain",
              String(ok ? 1 : 0) + "," + String(curVideo) + "," + String(badVideo));
}

// ===== RP2350 연결 처리 =====
void serviceLink(unsigned long now) {
  while (Serial1.available()) {
    char c = Serial1.read();
    if (c == '\n') {
      linkBuf.trim();
      if (linkBuf == "PONG") lastPong = now;
      else if (linkBuf.startsWith("F")) { curVideo = linkBuf.substring(1).toInt(); badVideo = 0; lastPong = now; }
      else if (linkBuf.startsWith("E")) { badVideo = linkBuf.substring(1).toInt(); lastPong = now; }
      else if (linkBuf.length()) { Serial.print("RP2350: "); Serial.println(linkBuf); }
      linkBuf = "";
    } else if (linkBuf.length() < 60) {
      linkBuf += c;
    }
  }
  if (now - lastPing >= 1000) {
    Serial1.print("PING\n");
    // RP2350이 재부팅됐거나 명령을 놓쳤을 때를 대비해 현재 각도를 다시 보냄
    Serial1.printf("%s %.1f\n", m1.key, m1.cur);
    lastPing = now;
  }
}

// ===== 초기화 =====
void initCommon(Motor& m, const char* name, const char* key, Kind kind,
                float minA, float maxA, float home) {
  m.name = name;
  m.key = key;
  m.kind = kind;
  m.minA = minA;
  m.maxA = maxA;
  m.home = constrain(home, minA, maxA);
  m.cur = m.home;
  m.playing = false;
}

void initPwmMotor(Motor& m, const char* name, const char* key, int pin,
                  float minA, float maxA, float home) {
  initCommon(m, name, key, KIND_PWM, minA, maxA, home);
  m.servo.setPeriodHertz(50);
  m.servo.attach(pin, MIN_US, MAX_US);
  writeSafe(m, m.home);
}

void initBusMotor(Motor& m, const char* name, const char* key, int id,
                  float minA, float maxA, float home) {
  initCommon(m, name, key, KIND_BUS, minA, maxA, home);
  m.busId = id;
  // 저항 방식은 현재 위치를 읽을 수 없으므로 아주 천천히 시작 각도로 이동
  m.lastPos = angleToPos(m.home);
#if USE_M2
  bus.WritePosEx(id, m.lastPos, 300, 20);
  flushBus();
#endif
}

void initRemoteMotor(Motor& m, const char* name, const char* key,
                     float minA, float maxA, float home) {
  initCommon(m, name, key, KIND_REMOTE, minA, maxA, home);
  m.lastSent = -999;
  writeSafe(m, m.home);
}

void setup() {
  Serial.begin(115200);

#if USE_M2
  Serial2.begin(BUS_BAUD, SERIAL_8N1, BUS_RX, BUS_TX);
  bus.pSerial = &Serial2;
  bus.Level = 0;   // 저항 방식: 응답을 기다리지 않음
#endif

  Serial1.begin(LINK_BAUD, SERIAL_8N1, LINK_RX, LINK_TX);
  delay(500);

  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  initPwmMotor(m4, "1번 M4", "m4", PIN_M4, M4_MIN, M4_MAX, M4_HOME);
  initPwmMotor(m3, "2번 M3", "m3", PIN_M3, M3_MIN, M3_MAX, M3_HOME);
  initBusMotor(m2, "3번 M2", "m2", M2_ID, M2_MIN, M2_MAX, M2_HOME);
  initRemoteMotor(m1, "4번 M1", "m1", M1_MIN, M1_MAX, M1_HOME);
  Serial.println("초기화 완료");

  WiFi.softAP(AP_SSID, AP_PASS);
  Serial.print("와이파이: ");
  Serial.println(AP_SSID);
  Serial.print("주소: http://");
  Serial.println(WiFi.softAPIP());

  server.enableCORS(true);   // PURE 웹(노트북 localhost)에서 fetch 허용
  server.on("/", handleRoot);
  server.on("/pose", handlePose);
  server.on("/cmd", handleCmd);
  server.on("/set", handleSet);
  server.on("/speed", handleSpeed);
  server.on("/video", handleVideo);
  server.on("/status", handleStatus);
  server.begin();

  lastTick = millis();
}

void loop() {
  server.handleClient();

  unsigned long now = millis();
  serviceLink(now);

  if (now - lastTick >= 20) {
    float dt = (now - lastTick) * speedFactor;
    lastTick = now;
    for (int i = 0; i < NUM_MOTORS; i++) updateMotor(*motors[i], dt);
  }
}
