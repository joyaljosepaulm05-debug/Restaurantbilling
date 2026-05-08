"""
Piano Trainer  —  keybr-style piano learning app
=================================================
Requirements : Python 3.8+  (stdlib only — tkinter built-in)
Optional     : pip install pyaudio numpy   -> microphone + audio playback

Run:
    python piano_trainer.py
"""

import tkinter as tk
from tkinter import ttk, messagebox
import math, time, threading, random, array, collections

try:
    import pyaudio
    PYAUDIO_OK = True
except ImportError:
    PYAUDIO_OK = False

try:
    import numpy as np
    NUMPY_OK = True
except ImportError:
    NUMPY_OK = False

# ================================================================
#  Music theory
# ================================================================
NOTE_NAMES  = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]
WHITE_NOTES = ["C","D","E","F","G","A","B"]
NO_BLACK    = {"E","B"}


def _note_freq(name: str, octave: int) -> float:
    idx  = NOTE_NAMES.index(name)
    midi = (octave + 1) * 12 + idx
    return 440.0 * 2 ** ((midi - 69) / 12)


ALL_NOTES: dict = {}
for _oct in range(2, 7):
    for _n in NOTE_NAMES:
        ALL_NOTES["%s%d" % (_n, _oct)] = _note_freq(_n, _oct)


def freq_to_note(freq: float):
    if freq <= 0:
        return None
    midi    = 12 * math.log2(freq / 440.0) + 69
    rounded = round(midi)
    name    = NOTE_NAMES[rounded % 12]
    octave  = rounded // 12 - 1
    if octave < 1 or octave > 7:
        return None
    return "%s%d" % (name, octave)


def strip_oct(s: str) -> str:
    return s.rstrip("0123456789")


# ================================================================
#  Lessons
# ================================================================
def _make_lessons():
    return {
        "single_c": {
            "title": "C major — white keys",
            "tasks": [{"notes": [n + "4"], "label": "Play  " + n + "4"}
                      for n in WHITE_NOTES],
        },
        "chromatic": {
            "title": "Chromatic — all 12 notes",
            "tasks": [{"notes": [n + "4"], "label": "Play  " + n + "4"}
                      for n in NOTE_NAMES],
        },
        "c_major_scale": {
            "title": "C major scale",
            "tasks": [{"notes": ["C4","D4","E4","F4","G4","A4","B4","C5"],
                       "label": "C  D  E  F  G  A  B  C"}],
        },
        "intervals": {
            "title": "Common intervals",
            "tasks": [
                {"notes": ["C4","E4"], "label": "Major 3rd   C to E"},
                {"notes": ["C4","G4"], "label": "Perfect 5th  C to G"},
                {"notes": ["C4","F4"], "label": "Perfect 4th  C to F"},
                {"notes": ["C4","A4"], "label": "Major 6th   C to A"},
                {"notes": ["C4","D4"], "label": "Major 2nd   C to D"},
                {"notes": ["C4","B4"], "label": "Major 7th   C to B"},
            ],
        },
        "chords": {
            "title": "Chord tones (arpeggio)",
            "tasks": [
                {"notes": ["C4","E4","G4"], "label": "C major  C  E  G"},
                {"notes": ["F4","A4","C5"], "label": "F major  F  A  C"},
                {"notes": ["G4","B4","D5"], "label": "G major  G  B  D"},
                {"notes": ["A4","C5","E5"], "label": "A minor  A  C  E"},
                {"notes": ["D4","F4","A4"], "label": "D minor  D  F  A"},
            ],
        },
        "random_notes": {
            "title": "Random drill",
            "tasks": "random",
        },
    }


LESSONS      = _make_lessons()
LESSON_ORDER = list(LESSONS.keys())

KB_MAP = {
    "a":"C4","w":"C#4","s":"D4","e":"D#4","d":"E4",
    "f":"F4","t":"F#4","g":"G4","y":"G#4","h":"A4",
    "u":"A#4","j":"B4","k":"C5","o":"C#5","l":"D5",
}


# ================================================================
#  Audio synth
# ================================================================
class Synth:
    RATE = 22050

    def __init__(self):
        self._pa  = None
        self._out = None
        if PYAUDIO_OK:
            try:
                self._pa  = pyaudio.PyAudio()
                self._out = self._pa.open(
                    format=pyaudio.paInt16, channels=1,
                    rate=self.RATE, output=True,
                    frames_per_buffer=512)
            except Exception as exc:
                print("[Synth] output stream failed:", exc)
                self._pa = None

    def play(self, freq: float, duration: float = 0.45, volume: float = 0.20):
        if not freq or self._out is None:
            return
        threading.Thread(
            target=self._render, args=(freq, duration, volume), daemon=True
        ).start()

    def _render(self, freq, duration, volume):
        n      = int(self.RATE * duration)
        pi2    = 2 * math.pi
        inv_n  = 1.0 / max(n, 1)
        buf    = array.array("h")
        for i in range(n):
            t     = i / self.RATE
            decay = math.exp(-4.0 * i * inv_n)
            v  = math.sin(pi2 * freq * t)
            v += 0.45 * math.sin(pi2 * freq * 2 * t)
            v += 0.20 * math.sin(pi2 * freq * 3 * t)
            v += 0.10 * math.sin(pi2 * freq * 4 * t)
            s  = int(v * decay * volume * 32767)
            buf.append(max(-32767, min(32767, s)))
        try:
            self._out.write(buf.tobytes())
        except Exception:
            pass


# ================================================================
#  Pitch detector  (YIN-lite with numpy, decimated autocorr fallback)
# ================================================================
class PitchDetector:
    """
    Stateful detector.  Call process() with each raw PCM chunk.
    Returns a note string only when a new, stable onset is confirmed.

    Key anti-noise measures
    -----------------------
    * RMS_THRESHOLD  — ignores ambient hiss / room noise
    * NOTE_HOLD      — note must be stable for ~200 ms before firing
    * SILENCE_RESET  — re-arms only after silence, prevents re-triggering
                       the same sustained note over and over
    * Octave fold    — mic octave errors (C3 vs C4) are forgiven when
                       matching against the task
    """
    RATE          = 44100
    CHUNK         = 4096         # ~93 ms
    RMS_THRESHOLD = 0.04         # 0..1 normalised RMS gate
    YIN_THRESH    = 0.25         # aperiodicity threshold
    NOTE_HOLD     = 0.20         # seconds stable before firing
    SILENCE_RESET = 0.35         # seconds silent before re-arming
    CONF_MIN      = 0.50         # discard if best autocorr < this fraction of max

    def __init__(self):
        self._stable_note  = None
        self._stable_start = 0.0
        self._last_fired   = None
        self._silence_from = 0.0
        self._armed        = True

    def process(self, raw_bytes: bytes):
        samples = array.array("h", raw_bytes)
        n       = len(samples)
        rms     = math.sqrt(sum(s * s for s in samples) / n) / 32768.0
        now     = time.monotonic()

        # ── silence gate ──────────────────────────────────
        if rms < self.RMS_THRESHOLD:
            if self._stable_note is not None:
                self._silence_from = now
            self._stable_note = None
            if now - self._silence_from > self.SILENCE_RESET:
                self._armed      = True
                self._last_fired = None    # allow same note again after silence
            return None

        # ── pitch estimate ─────────────────────────────────
        freq = self._yin(samples, n) if NUMPY_OK else self._autocorr(samples, n)
        if freq is None:
            return None
        note = freq_to_note(freq)
        if note is None:
            return None

        # ── stability check ────────────────────────────────
        if note != self._stable_note:
            self._stable_note  = note
            self._stable_start = now
            return None
        if now - self._stable_start < self.NOTE_HOLD:
            return None

        # ── onset gate ─────────────────────────────────────
        if not self._armed:
            return None
        if strip_oct(note) == strip_oct(self._last_fired or ""):
            return None

        self._armed      = False
        self._last_fired = note
        return note

    # ── numpy YIN ─────────────────────────────────────────
    def _yin(self, samples, n):
        x    = np.frombuffer(bytes(samples.tobytes()), dtype=np.int16).astype(np.float32)
        x   /= 32768.0
        half = n // 2

        diff = np.zeros(half, dtype=np.float32)
        for tau in range(1, half):
            tmp         = x[:half] - x[tau:tau + half]
            diff[tau]   = float(np.dot(tmp, tmp))

        cmnd    = np.ones(half, dtype=np.float32)
        running = 0.0
        for tau in range(1, half):
            running     += diff[tau]
            cmnd[tau]    = diff[tau] * tau / running if running > 0 else 1.0

        for tau in range(2, half - 1):
            if cmnd[tau] < self.YIN_THRESH:
                a  = float(cmnd[tau - 1])
                b  = float(cmnd[tau])
                c  = float(cmnd[tau + 1])
                denom = a - 2*b + c
                t0 = tau + (a - c) / (2 * denom + 1e-9) / 2 if abs(denom) > 1e-9 else tau
                if t0 < 2:
                    continue
                freq = self.RATE / t0
                if 50 < freq < 2000:
                    return freq
        return None

    # ── pure-python autocorr (fast: only piano frequency range) ──
    def _autocorr(self, samples, n):
        tau_min = max(1, int(self.RATE / 2000))
        tau_max = min(int(self.RATE / 50), n // 2)
        buf     = [s / 32768.0 for s in samples]
        e0      = sum(b * b for b in buf[:n // 2])
        if e0 < 1e-6:
            return None
        best_tau, best_val = 0, -1.0
        for tau in range(tau_min, tau_max, 2):     # step 2 for speed
            s = sum(buf[i] * buf[i + tau] for i in range(n - tau))
            if s > best_val:
                best_val, best_tau = s, tau
        if best_tau == 0 or best_val / e0 < self.CONF_MIN:
            return None
        freq = self.RATE / best_tau
        return freq if 50 < freq < 2000 else None


# ================================================================
#  Mic listener  (background thread, thread-safe callbacks)
# ================================================================
class MicListener:
    RATE  = 44100
    CHUNK = 4096

    def __init__(self, on_note, on_volume):
        self._on_note   = on_note
        self._on_volume = on_volume
        self._running   = False
        self._detector  = PitchDetector()

    def start(self) -> bool:
        if not PYAUDIO_OK:
            return False
        self._running = True
        threading.Thread(target=self._loop, daemon=True).start()
        return True

    def stop(self):
        self._running = False

    def _loop(self):
        pa     = pyaudio.PyAudio()
        stream = None
        try:
            stream = pa.open(
                format=pyaudio.paInt16, channels=1,
                rate=self.RATE, input=True,
                frames_per_buffer=self.CHUNK)
            while self._running:
                try:
                    raw = stream.read(self.CHUNK, exception_on_overflow=False)
                except OSError:
                    time.sleep(0.01)
                    continue
                # volume meter
                samp = array.array("h", raw)
                rms  = math.sqrt(sum(s*s for s in samp) / len(samp)) / 32768.0
                self._on_volume(min(1.0, rms * 6))
                # pitch
                note = self._detector.process(raw)
                if note:
                    self._on_note(note)
        except Exception as exc:
            print("[MicListener] Error:", exc)
        finally:
            if stream:
                try:
                    stream.stop_stream()
                    stream.close()
                except Exception:
                    pass
            try:
                pa.terminate()
            except Exception:
                pass


# ================================================================
#  Main window
# ================================================================
class PianoTrainer(tk.Tk):
    KEY_W   = 46
    KEY_H_W = 140
    KEY_H_B = 88
    KEY_B_W = 28
    OCTAVES = [3, 4, 5]

    C_BG        = "#F8F7F4"
    C_PANEL     = "#FFFFFF"
    C_BORDER    = "#D3D1C7"
    C_ACCENT    = "#378ADD"
    C_HIGHLIGHT = "#B5D4F4"
    C_TEXT      = "#2C2C2A"
    C_MUTED     = "#888780"
    C_CORRECT_K = "#C0DD97"
    C_WRONG_K   = "#F7C1C1"
    C_WRONG_HI  = "#F7C1C1"

    def __init__(self):
        super().__init__()
        self.title("Piano Trainer")
        self.configure(bg=self.C_BG)
        self.resizable(True, True)
        self.minsize(720, 620)

        self.synth    = Synth()
        self.mic      = None
        self.mic_on   = False
        self._volume  = 0.0
        self._note_q  = collections.deque(maxlen=8)

        self.lesson_key = LESSON_ORDER[0]
        self.task_list  = []
        self.task_idx   = 0
        self.seq_idx    = 0
        self.score = self.streak = self.correct = self.total = 0

        self._white_ids = {}
        self._black_ids = {}

        self._build_ui()
        self._load_lesson(self.lesson_key)
        self.bind("<KeyPress>", self._on_keypress)
        self.focus_set()
        self._poll_notes()    # start safe polling loop

    # ─────────────────────────────────────────────
    #  Build UI
    # ─────────────────────────────────────────────
    def _build_ui(self):
        # Top bar
        top = tk.Frame(self, bg=self.C_BG)
        top.pack(fill="x", padx=16, pady=(14, 4))
        tk.Label(top, text="Piano Trainer",
                 font=("Helvetica", 20, "bold"),
                 bg=self.C_BG, fg=self.C_TEXT).pack(side="left")
        self.lbl_level = tk.Label(top, text="Level 1 - Beginner",
                                  font=("Helvetica", 11),
                                  bg="#E6F1FB", fg="#0C447C",
                                  padx=10, pady=4)
        self.lbl_level.pack(side="right")

        # Stats
        sf = tk.Frame(self, bg=self.C_BG)
        sf.pack(fill="x", padx=16, pady=(0, 8))
        self._svars = {}
        for label, key, init in [
            ("Score","score","0"), ("Streak","streak","0"),
            ("Accuracy","accuracy","--"), ("Notes","total","0"),
        ]:
            col = tk.Frame(sf, bg="#F1EFE8",
                           highlightthickness=1,
                           highlightbackground=self.C_BORDER)
            col.pack(side="left", expand=True, fill="x", padx=4)
            tk.Label(col, text=label, font=("Helvetica", 10),
                     bg="#F1EFE8", fg=self.C_MUTED).pack(pady=(6,0))
            v = tk.StringVar(value=init)
            self._svars[key] = v
            tk.Label(col, textvariable=v,
                     font=("Helvetica", 22, "bold"),
                     bg="#F1EFE8", fg=self.C_TEXT).pack(pady=(0,6))

        # Lesson picker
        lf = tk.Frame(self, bg=self.C_BG)
        lf.pack(fill="x", padx=16, pady=(0, 6))
        tk.Label(lf, text="Lesson:", font=("Helvetica", 11),
                 bg=self.C_BG, fg=self.C_MUTED).pack(side="left", padx=(0,6))
        self._lesson_var = tk.StringVar()
        choices = [LESSONS[k]["title"] for k in LESSON_ORDER]
        cb = ttk.Combobox(lf, textvariable=self._lesson_var,
                          values=choices, state="readonly",
                          width=30, font=("Helvetica", 11))
        cb.current(0)
        cb.pack(side="left")
        cb.bind("<<ComboboxSelected>>", self._on_lesson_change)

        # Task panel
        tp = tk.Frame(self, bg=self.C_PANEL,
                      highlightthickness=1,
                      highlightbackground=self.C_BORDER)
        tp.pack(fill="x", padx=16, pady=(0, 8))
        self.lbl_task = tk.Label(tp, text="",
                                 font=("Helvetica", 13, "bold"),
                                 bg=self.C_PANEL, fg=self.C_TEXT, anchor="w")
        self.lbl_task.pack(fill="x", padx=12, pady=(10, 4))
        self.seq_frame = tk.Frame(tp, bg=self.C_PANEL)
        self.seq_frame.pack(fill="x", padx=12, pady=(0, 4))
        self._prog = tk.Canvas(tp, height=5, bg="#E8E6E0",
                               bd=0, highlightthickness=0)
        self._prog.pack(fill="x", padx=12, pady=(0, 10))
        self._prog.bind("<Configure>", lambda _: self._draw_progress())

        # Mic row
        mf = tk.Frame(self, bg=self.C_BG)
        mf.pack(fill="x", padx=16, pady=(0, 6))
        self.btn_mic = tk.Button(
            mf, text="Use microphone",
            font=("Helvetica", 11), command=self._toggle_mic,
            bg=self.C_PANEL, fg=self.C_TEXT,
            relief="flat", bd=0, padx=12, pady=6,
            highlightthickness=1, highlightbackground=self.C_BORDER,
            cursor="hand2", activebackground="#E6F1FB")
        self.btn_mic.pack(side="left", padx=(0,8))
        self.lbl_mic_info = tk.Label(
            mf, text="Mic off  |  use keyboard (A-L) or click the piano",
            font=("Helvetica", 10), bg=self.C_BG, fg=self.C_MUTED)
        self.lbl_mic_info.pack(side="left")
        self.lbl_detected = tk.Label(
            mf, text="", font=("Helvetica", 14, "bold"),
            bg="#E6F1FB", fg="#0C447C", padx=10, pady=2, width=4)
        self._vol_c = tk.Canvas(mf, width=80, height=10,
                                bg="#E8E6E0", bd=0,
                                highlightthickness=1,
                                highlightbackground=self.C_BORDER)

        # Piano canvas
        n_white  = len(self.OCTAVES) * 7
        canvas_w = n_white * self.KEY_W + 2
        self.piano = tk.Canvas(self, width=canvas_w,
                               height=self.KEY_H_W + 12,
                               bg="#E0DED8", bd=0, highlightthickness=0)
        self.piano.pack(padx=16, pady=(0, 10))
        self._build_piano()

        # Control buttons
        cf = tk.Frame(self, bg=self.C_BG)
        cf.pack(fill="x", padx=16, pady=(0, 6))
        for text, cmd in [
            ("Hear target", self._play_target),
            ("Skip task",   self._skip_task),
            ("Reset",       self._reset_stats),
        ]:
            tk.Button(cf, text=text, font=("Helvetica", 11), command=cmd,
                      bg=self.C_PANEL, fg=self.C_TEXT,
                      relief="flat", bd=0, padx=12, pady=6,
                      highlightthickness=1, highlightbackground=self.C_BORDER,
                      cursor="hand2", activebackground="#E6F1FB"
                      ).pack(side="left", padx=(0,6))

        tk.Label(self,
                 text="Keyboard shortcuts:  A W S E D  F T G Y H U J  K O L",
                 font=("Courier", 9), bg=self.C_BG,
                 fg=self.C_MUTED).pack(pady=(0, 8))

    # ─────────────────────────────────────────────
    #  Piano canvas
    # ─────────────────────────────────────────────
    def _build_piano(self):
        c = self.piano
        c.delete("all")
        self._white_ids.clear()
        self._black_ids.clear()

        # White keys
        x = 1
        for oct in self.OCTAVES:
            for note in WHITE_NOTES:
                ns  = note + str(oct)
                rid = c.create_rectangle(
                    x, 1, x + self.KEY_W - 1, self.KEY_H_W,
                    fill="white", outline=self.C_BORDER, width=1,
                    tags=("key", ns))
                c.create_text(
                    x + self.KEY_W // 2, self.KEY_H_W - 10,
                    text=ns, font=("Helvetica", 8),
                    fill=self.C_MUTED, tags=("lbl_" + ns,))
                self._white_ids[ns] = rid
                for tag in (ns, "lbl_" + ns):
                    c.tag_bind(tag, "<Button-1>",
                               lambda e, n=ns: self._on_key_click(n))
                x += self.KEY_W

        # Black keys
        x = 1
        for oct in self.OCTAVES:
            wx = x
            for note in WHITE_NOTES:
                if note not in NO_BLACK:
                    sharp = note + "#" + str(oct)
                    bx    = wx + self.KEY_W - self.KEY_B_W // 2
                    bid   = c.create_rectangle(
                        bx, 1, bx + self.KEY_B_W, self.KEY_H_B,
                        fill="#2C2C2A", outline="#111", width=1,
                        tags=("key", sharp))
                    self._black_ids[sharp] = bid
                    c.tag_bind(sharp, "<Button-1>",
                               lambda e, n=sharp: self._on_key_click(n))
                wx += self.KEY_W
            x += self.KEY_W * 7

    def _color_key(self, note_str: str, color: str):
        if note_str in self._black_ids:
            self.piano.itemconfig(self._black_ids[note_str], fill=color)
        elif note_str in self._white_ids:
            self.piano.itemconfig(self._white_ids[note_str], fill=color)

    def _reset_key(self, note_str: str):
        default = "#2C2C2A" if note_str in self._black_ids else "white"
        self._color_key(note_str, default)

    # ─────────────────────────────────────────────
    #  Lesson / task management
    # ─────────────────────────────────────────────
    def _load_lesson(self, key: str):
        self.lesson_key = key
        data = LESSONS[key]
        if data["tasks"] == "random":
            self.task_list = [
                {"notes": [random.choice(NOTE_NAMES) + "4"],
                 "label": "Random — hit the highlighted key"}
                for _ in range(30)
            ]
        else:
            self.task_list = data["tasks"] * 3
        self.task_idx = 0
        self.seq_idx  = 0
        self._render_task()

    def _render_task(self):
        for n in list(self._white_ids) + list(self._black_ids):
            self._reset_key(n)

        if not self.task_list:
            return
        if self.task_idx >= len(self.task_list):
            self.task_idx = 0

        task  = self.task_list[self.task_idx]
        notes = task["notes"]
        self.lbl_task.config(text=task["label"])

        for w in self.seq_frame.winfo_children():
            w.destroy()
        for i, n in enumerate(notes):
            label = strip_oct(n)
            if i < self.seq_idx:
                bg, fg = "#C0DD97", "#3B6D11"
            elif i == self.seq_idx:
                bg, fg = self.C_HIGHLIGHT, "#0C447C"
            else:
                bg, fg = "#F1EFE8", self.C_MUTED
            tk.Label(self.seq_frame, text=label,
                     font=("Helvetica", 13, "bold"),
                     bg=bg, fg=fg, width=3, pady=4
                     ).pack(side="left", padx=3)

        self._draw_progress()
        if self.seq_idx < len(notes):
            self._color_key(notes[self.seq_idx], self.C_HIGHLIGHT)

    def _draw_progress(self, pct=None):
        c = self._prog
        w = c.winfo_width()
        c.delete("all")
        c.create_rectangle(0, 0, w, 5, fill="#E8E6E0", outline="")
        if pct is None:
            task = self.task_list[self.task_idx] if self.task_list else None
            pct  = self.seq_idx / len(task["notes"]) if task else 0.0
        c.create_rectangle(0, 0, int(w * pct), 5,
                           fill=self.C_ACCENT, outline="")

    # ─────────────────────────────────────────────
    #  Input handling
    # ─────────────────────────────────────────────
    def _on_key_click(self, note_str: str):
        self.synth.play(ALL_NOTES.get(note_str, 0))
        self._handle_input(note_str)

    def _on_keypress(self, event: tk.Event):
        k = event.keysym.lower()
        if len(k) == 1 and k in KB_MAP:
            note = KB_MAP[k]
            self._color_key(note, "#D3D1C7")
            self.after(100, lambda: self._reset_key(note))
            self.synth.play(ALL_NOTES.get(note, 0))
            self._handle_input(note)

    def _handle_input(self, note_str: str):
        if not self.task_list:
            return
        task   = self.task_list[self.task_idx]
        notes  = task["notes"]
        target = notes[self.seq_idx]

        # Ignore octave when matching — mic often drifts by one octave
        hit = strip_oct(target) == strip_oct(note_str)

        self.total += 1
        if hit:
            self.correct += 1
            self.streak  += 1
            self.score   += 10 + min(self.streak, 20)
            self._color_key(target, self.C_CORRECT_K)
            self.after(300, lambda: self._reset_key(target))
            self.seq_idx += 1
            if self.seq_idx >= len(notes):
                self.seq_idx  = 0
                self.task_idx = (self.task_idx + 1) % len(self.task_list)
                self.after(450, self._render_task)
            else:
                self._render_task()
        else:
            self.streak = 0
            self.score  = max(0, self.score - 5)
            self._color_key(target, self.C_WRONG_K)
            self.after(350, lambda: self._color_key(target, self.C_HIGHLIGHT))

        self._update_stats()

    # ─────────────────────────────────────────────
    #  Stats
    # ─────────────────────────────────────────────
    def _update_stats(self):
        self._svars["score"].set(str(self.score))
        self._svars["streak"].set(str(self.streak))
        self._svars["total"].set(str(self.total))
        if self.total:
            self._svars["accuracy"].set("%d%%" % round(self.correct / self.total * 100))
        else:
            self._svars["accuracy"].set("--")
        if   self.score < 100:  lvl = "Level 1 - Beginner"
        elif self.score < 350:  lvl = "Level 2 - Learner"
        elif self.score < 800:  lvl = "Level 3 - Intermediate"
        elif self.score < 1800: lvl = "Level 4 - Advanced"
        else:                   lvl = "Level 5 - Expert"
        self.lbl_level.config(text=lvl)

    # ─────────────────────────────────────────────
    #  Audio helpers
    # ─────────────────────────────────────────────
    def _play_target(self):
        if not self.task_list:
            return
        note = self.task_list[self.task_idx]["notes"][self.seq_idx]
        self.synth.play(ALL_NOTES.get(note, 0), duration=0.6)

    # ─────────────────────────────────────────────
    #  Microphone
    # ─────────────────────────────────────────────
    def _toggle_mic(self):
        if self.mic_on:
            self._stop_mic()
        else:
            self._start_mic()

    def _start_mic(self):
        if not PYAUDIO_OK:
            messagebox.showinfo(
                "PyAudio needed",
                "Microphone detection requires PyAudio.\n\n"
                "Install it:\n    pip install pyaudio\n\n"
                "You can still use keyboard or mouse input.")
            return

        def _on_note(n):
            self._note_q.append(n)     # deque append is thread-safe in CPython

        def _on_vol(v):
            self._volume = v           # float write is atomic in CPython

        self.mic = MicListener(on_note=_on_note, on_volume=_on_vol)
        if not self.mic.start():
            messagebox.showerror("Mic error", "Could not open microphone.")
            return

        self.mic_on = True
        self.btn_mic.config(text="Stop mic", bg="#FCEBEB",
                            highlightbackground="#E24B4A")
        self.lbl_mic_info.config(text="Mic active — play your piano!")
        self.lbl_detected.pack(side="left", padx=6)
        self._vol_c.pack(side="left", padx=4)
        self._vol_update()

    def _stop_mic(self):
        if self.mic:
            self.mic.stop()
            self.mic = None
        self.mic_on   = False
        self._volume  = 0.0
        self.btn_mic.config(text="Use microphone",
                            bg=self.C_PANEL,
                            highlightbackground=self.C_BORDER)
        self.lbl_mic_info.config(
            text="Mic off  |  use keyboard (A-L) or click the piano")
        self.lbl_detected.pack_forget()
        self._vol_c.pack_forget()

    def _poll_notes(self):
        """Drain note queue on the main thread every 40 ms."""
        while self._note_q:
            note = self._note_q.popleft()
            self.lbl_detected.config(text=strip_oct(note))
            self._handle_input(note)
        self.after(40, self._poll_notes)

    def _vol_update(self):
        if not self.mic_on:
            return
        c = self._vol_c
        w = c.winfo_width() or 80
        c.delete("all")
        c.create_rectangle(0, 0, int(w * self._volume), 10,
                           fill="#1D9E75", outline="")
        self.after(50, self._vol_update)

    # ─────────────────────────────────────────────
    #  Lesson / controls
    # ─────────────────────────────────────────────
    def _on_lesson_change(self, _=None):
        title = self._lesson_var.get()
        for k in LESSON_ORDER:
            if LESSONS[k]["title"] == title:
                self.seq_idx = 0
                self._load_lesson(k)
                break

    def _skip_task(self):
        self.seq_idx  = 0
        self.task_idx = (self.task_idx + 1) % max(1, len(self.task_list))
        self._render_task()

    def _reset_stats(self):
        self.score = self.streak = self.correct = self.total = 0
        self.task_idx = self.seq_idx = 0
        self._update_stats()
        self._render_task()


# ================================================================
#  Entry point
# ================================================================
if __name__ == "__main__":
    app = PianoTrainer()
    app.mainloop()