<p align="center">
  <img src="assets/logo.svg" alt="BasisMedic" width="140" />
</p>

<h1 align="center"><img src="assets/logo.svg" alt="" width="34" align="absmiddle" /> BasisMedic</h1>

<p align="center"><i>วาง error log รับคำตอบที่ตรวจสอบแล้ว — ไม่เดา ไม่มั่ว</i></p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v1-FF4E45" alt="version v1">
  <img src="https://img.shields.io/github/last-commit/HighTower-s/BasisMedic?color=111114" alt="last commit">
  <br>
  <img src="https://img.shields.io/badge/python-3.12-3776AB?logo=python&logoColor=white" alt="python">
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white" alt="fastapi">
  <img src="https://img.shields.io/badge/Next.js-111114?logo=next.js&logoColor=white" alt="next.js">
</p>

<p align="center">🇹🇭 ภาษาไทย &middot; <a href="README.en.md">🇬🇧 English</a></p>

---

ระบบ RAG + agent ที่วัดผลและประเมินแล้ว สำหรับคัดกรองเหตุขัดข้อง (triage) ของ SAP Basis วาง error log
เข้าไป แล้วได้ผลลัพธ์ที่ตรวจสอบแล้วแบบมีโครงสร้าง — หมวดของเหตุขัดข้อง, transaction code ที่ต้องเปิดตามลำดับ,
ขั้นตอนตรวจสอบทีละขั้น, และ citation — หรือคำปฏิเสธที่ชัดเจนว่า "ไม่เกี่ยวข้อง" ทุก citation และทุก T-code
ถูกตรวจสอบด้วยโค้ดเทียบกับหลักฐานจริง ไม่เคยเชื่อจากโมเดลเฉยๆ repository นี้ครอบคลุม 3 Feature สำหรับโปรเจค
capstone ของมหาวิทยาลัย (*Building LLM-Powered Applications*):

- **Feature 1** — คลัง runbook, ชุดข้อมูลประเมินที่ gắn label ไว้, และ hybrid retrieval ที่วัดผลแล้ว
  (`search()`)
- **Feature 2** — triage agent: วง tool-calling loop ที่มีขอบเขตจำกัด สร้างต่อจาก `search()` ให้ผลลัพธ์
  `TriageResult` แบบมีโครงสร้างที่ตรวจสอบแล้ว วัดผลแบบ end-to-end เทียบกับ baseline ที่ระบุชื่อไว้
- **Feature 3** — FastAPI edge (`app/api.py`) และเว็บ UI แบบ Next.js (`web/`): หน้า landing page และ
  หน้าแชตสำหรับ triage เรียกใช้ pipeline ที่ตรวจสอบแล้วชุดเดียวกับที่ CLI ใช้

## ทำไมต้องทำโปรเจคนี้

ผู้ช่วย triage ที่ตอบผิดแบบมั่นใจนั้นแย่กว่าตัวที่บอกว่า "ไม่รู้" — ลำดับ T-code ที่ฟังดูสมเหตุสมผลแต่ผิด
แล้วถูกนำไปใช้ตอนตี 2 คือผลลัพธ์ที่แย่ที่สุดที่เป็นไปได้ โปรเจคนี้มีไว้เพื่อพิสูจน์ว่า retrieval ที่อยู่เบื้องหลัง
ผู้ช่วยตัวนี้ทำงานได้จริง วัดผลอย่างตรงไปตรงมาเทียบกับ baseline ที่ระบุชื่อไว้ ก่อนที่โมเดลภาษาใดๆ จะได้แตะ
ข้อมูลเลย — ยึดตามหลักการ 3 ข้อ: Evaluation-First (วัดผลก่อนเสมอ), Honest Reporting (รายงานตามจริง),
Grounded Answers Only (ตอบจากหลักฐานเท่านั้น)

## ติดตั้ง

```bash
uv sync
cp .env.example .env        # Windows: copy .env.example .env
# ใส่ OPENAI_API_KEY สำหรับโหมด dense/hybrid search; โหมด bm25 ไม่ต้องใช้ key เลย
```

## สร้าง index

```bash
uv run python -m app.cli ingest --strategy fixed     # พร้อม embeddings (ต้องมี OPENAI_API_KEY)
uv run python -m app.cli ingest --strategy fixed --no-embed   # bm25 อย่างเดียว ไม่ต้องต่อเน็ต
```

การ rebuild เป็นแบบ atomic — ถ้า build ล้มเหลว (เช่น gateway ล่มระหว่างทำ embed) index เดิมจะยังอยู่ครบ
Embeddings ถูก cache ไว้บน disk (`data/cache/`, อยู่ใน .gitignore) โดย key ตามเนื้อหา ดังนั้นถ้า rebuild
โดยที่ corpus ไม่เปลี่ยนจะไม่เสียค่าเรียก gateway เลย

## ค้นหา (Search)

```bash
uv run python -m app.cli search --file examples/tsv_dump.log --mode hybrid
uv run python -m app.cli search "วาง log หรือคำอธิบายแบบข้อความอิสระที่นี่"
uv run python -m app.cli search --file examples/hana_disk_full.log --mode hybrid   # ตัวอย่างการปฏิเสธ
```

`--mode` เลือกได้เป็น `bm25` (ไม่ต่อเน็ต), `dense`, หรือ `hybrid` (ค่า default) ผลลัพธ์ที่ผ่านเกณฑ์
ความเกี่ยวข้องจะคืนสูงสุด 3 รายการ แต่ละรายการมี address แบบ `doc_id#section` ที่ชี้ไปยังเนื้อหา corpus จริง
log ที่ corpus ไม่ครอบคลุมจะคืนค่า `NO_RELEVANT_RUNBOOK` พร้อม exit code 0 — การปฏิเสธที่ถูกต้องถือเป็น
ความสำเร็จ ไม่ใช่ข้อผิดพลาด

## Triage (Feature 2)

```bash
uv run python -m app.cli triage --file examples/tsv_dump.log --show-trace
uv run python -m app.cli triage "วาง log ที่นี่"
uv run python -m app.cli triage --file examples/hana_disk_full.log   # ตัวอย่างการปฏิเสธ บังคับไว้ในโค้ด
```

tool-calling loop ของตัวเอง (`search_runbook`, `lookup_tcode`; `MAX_STEPS=5`, อ่านอย่างเดียว, อยู่ใน
allow-list) จะรวบรวมหลักฐาน จากนั้นเรียก formatter แบบไม่มี tools เพื่อสร้างผลลัพธ์แบบมีโครงสร้าง พร้อมวง
ซ่อมแซม (repair loop) ที่จำกัดจำนวนรอบ และ fallback ที่แน่นอนเมื่อหมดรอบ ก่อนส่งผลลัพธ์กลับ:
ทุก citation ถูกตรวจสอบกับหลักฐานที่ค้นเจอจริงในคำขอนั้น (citation ที่กุขึ้นมาจะถูกตัดทิ้ง), ทุก T-code
ถูกตรวจสอบกับ allow-list (ตัวที่ไม่ผ่านจะถูก flag ไว้ ไม่ใช่เชื่อไปเฉยๆ), และถ้า retrieval ไม่เจออะไรเลย
category จะถูกบังคับเป็น `out_of_scope` ด้วยโค้ด — ไม่ปล่อยให้โมเดลตัดสินใจเอง `--show-trace` จะพิมพ์
tool call ทุกตัวที่เรียกไปยัง stderr เพื่อช่วยวินิจฉัยเวลาเจอคำตอบที่ดูแปลกๆ

## ประเมินผล (Evaluate)

```bash
uv run python -m eval.run_all
```

คำสั่งเดียว ไม่มี argument โดยตั้งใจ (matrix ของการทดลองอยู่ในโค้ด ดังนั้นตัวเลขที่ commit ไว้จะตรงกับ
matrix ที่ commit ไว้เสมอ) รันตามลำดับ:

- **E1** — เทียบ chunking แบบ fixed-800/150 ธรรมดา กับแบบ section-aligned ก่อนเข้า gate เลือกผู้ชนะจาก
  **dev split เท่านั้น**
- **E2** — เทียบ bm25 vs dense vs hybrid บนตัวชนะจาก E1 ก่อนเข้า gate เทียบกับ baseline ที่ระบุชื่อ 2 ตัว
- **E3** — sweep หาค่า `MIN_SCORE` บน **dev split เท่านั้น** (ห้ามแตะ test set โดยกลไก —
  `sweep_min_score("test")` จะ raise error)
- ผลลัพธ์ **headline** บน test set ที่ threshold ที่เลือกไว้ หลังผ่าน gate แล้ว
- **E4** — triage agent เต็มรูปแบบเทียบกับ baseline ที่ระบุชื่อ 2 ตัว (`E-NoRAG`: ไม่มี retrieval เลย;
  `E-ClassicRAG`: ค้นครั้งเดียวแบบไม่ใช่ agent ไม่มี loop) แบบ end-to-end ผ่าน verification pipeline
  เดียวกันทั้งหมด
- `eval/results/failures.jsonl` — ทุกเคสที่ผิด/fallback/ไม่ผ่าน verify ทั้งระดับ retrieval และ agent
  พร้อมระบุประเภทความผิดพลาด

ทุกตัวเลขถูกเขียนลง `eval/results/*.json` คู่กับ config ที่ใช้สร้างตัวเลขนั้นเป๊ะๆ (`corpus_sha`,
`git_commit`, mode, chunk strategy/`k`/`min_score` สำหรับ retrieval, `max_steps`/`repair_attempts`/
`chat_model` สำหรับ agent) รันซ้ำสองครั้ง — ผลลัพธ์ระดับ verification ทั้งของ retrieval และ agent จะ
เหมือนกันทุก byte เพราะ agent ใช้ cache แบบ content-addressed สำหรับ chat-completion
(`data/chat_cache/`, อยู่ใน .gitignore) เลียนแบบ cache ของ embedding

## ผลลัพธ์ (test split, หลังผ่าน gate, การตั้งค่า headline)

ตารางเต็มพร้อม delta เทียบ baseline, dev sweep, breakdown ตามระดับความยาก, คำตัดสิน, และ Limitations:
**[`eval/results/results.md`](eval/results/results.md)** ตัวเลข headline ล่าสุดที่วัดได้:

| metric | ค่า |
|---|---|
| mode / chunking / min_score | `hybrid` / `fixed` / `0.60` (วัดทั้ง 3 ค่าจริง ไม่ได้เดา — ดู results.md) |
| recall@3 (หลังผ่าน gate) | 0.808 |
| MRR (หลังผ่าน gate) | 0.788 |
| ความแม่นยำของ out-of-scope gate | 1.000 |
| อัตราปฏิเสธผิด (false refusal rate) | 0.154 |

ก่อนเข้า gate hybrid ชนะ baseline ที่ระบุชื่อทั้งคู่บน test split (recall@3 0.962 เทียบกับ R-BM25 ที่
0.846 และ R-Dense-naive ที่ 0.942) เกณฑ์ความเกี่ยวข้อง 0.60 — เลือกจาก dev sweep ไม่ได้เดา — คือสิ่งที่
ทำให้ปฏิเสธ query ที่ไม่เกี่ยวข้องได้ถูกต้อง (ยืนยันด้วย log แจ้งเตือน HANA log-volume ที่ค่า default
0.40 เดิมที่ไม่ผ่านการ validate เคยปล่อยให้ผ่านมา) แลกมาด้วยอัตราปฏิเสธผิด 0.154 ในเคสยากที่อยู่ใน scope
แต่ไม่มีรหัส error ตรงๆ — รายงานไว้ตามจริง ไม่ปิดบัง

### End-to-end (Feature 2, test split, n=30)

| config | category_accuracy | tcode_recall | unverified_claim_rate | valid_output_rate |
|---|---|---|---|---|
| E-NoRAG (ไม่มี retrieval) | 0.600 | 0.154 | 0.767 | 0.933 |
| E-ClassicRAG (ค้นครั้งเดียว ไม่มี loop) | 0.700 | 0.442 | 0.767 | 1.000 |
| **agent** (bounded loop เต็มรูปแบบ) | 0.567 | 0.365 | 0.467 | 0.967 |

**พูดตรงๆ ไม่ปรุงแต่ง**: agent เต็มรูปแบบ **ไม่** ชนะ baseline ที่ระบุชื่อทั้งคู่ในแง่ category accuracy
หรือ T-code recall — `E-ClassicRAG` ซึ่งค้นแบบ non-agentic ครั้งเดียว ได้คะแนนสูงกว่าทั้งสองด้าน แต่ agent
ชนะใน `unverified_claim_rate` (0.467 เทียบกับ 0.767 ของ baseline ทั้งคู่): มันระมัดระวังในสิ่งที่ยืนยัน
มากกว่าอย่างชัดเจน แม้จะตอบถูกน้อยกว่าโดยรวมก็ตาม นี่คือข้อค้นพบจริงเกี่ยวกับความน่าเชื่อถือในการใช้ tool
ของโมเดลขนาดเล็กตัวนี้ ไม่ใช่ข้อบกพร่องของ verification layer — ดู `eval/results/results.md` § Limitations

## ความหน่วงในการค้นหา (SC-013)

วัดบนเครื่องของผู้พัฒนา โหมด `--mode hybrid` (round trip หนึ่งครั้งไปยัง gateway สำหรับ embed query ซึ่ง
เป็นต้นทุนหลัก): **โดยทั่วไป 1.4–1.5 วินาที** ต่ำกว่าเป้าหมาย 3 วินาทีสำหรับการใช้งานแบบ interactive
สบายๆ มีค่า outlier หนึ่งครั้งที่ 7.2 วินาทีจากการตอบสนองช้าของ gateway — รายงานไว้ตามจริงแทนที่จะกลบไว้
เพราะเป็น latency tail ที่เกิดขึ้นจริงแม้จะไม่บ่อย `--mode bm25` ไม่มีการเรียกเน็ตเวิร์กเลย เวลาส่วนใหญ่
มาจากการ startup ของ Python/`uv` (ประมาณ 2.1 วินาทีตอน cold start) ไม่ใช่จากการค้นหาเอง

## ข้อจำกัด (Limitations)

- log ของทุกเคสประเมินเป็นข้อมูล **สังเคราะห์ (synthetic)** เขียนให้คล้ายรูปแบบ error จริงของ SAP Basis
- corpus ครอบคลุมแค่ 16 runbook ใน 8 หมวดเหตุขัดข้องเท่านั้น สิ่งที่อยู่นอกขอบเขตนี้ไม่มีทางได้คำตอบถูก
  เลยไม่ว่าคุณภาพของ retrieval จะดีแค่ไหน
- มี bias จากผู้เขียนคนเดียวทั้งใน runbook และ label ของชุดข้อมูลประเมิน
- BM25 tokenizer (`[A-Za-z0-9_/]+`) ตัดคำภาษาไทยไม่ได้ — query ภาษาไทยจึงพึ่งพาฝั่ง dense/embedding
  ทั้งหมด
- citation ใน `sources` ของ agent มักว่างเปล่าแม้ trace จะแสดงว่าใช้หลักฐานที่ค้นเจอจริง — เป็นช่องว่างด้าน
  วินัยการอ้างอิงของโมเดล `gemma-4-E4B-it` ไม่ใช่บั๊กของ verification (citation ที่**กุขึ้นมา**ถูกจับได้และ
  ตัดทิ้งอย่างน่าเชื่อถือ แต่ citation ที่**ถูกละไว้**ยังไม่ถูก flag เป็น failure mode แยกต่างหากในตอนนี้)
- log ที่อธิบายปัญหา 2 อย่างพร้อมกันจะได้ category เดียว — schema ไม่รองรับ multi-label จัดการโดยไม่ crash
  และรายงานไว้เป็นข้อค้นพบที่ทราบอยู่แล้ว (spec SC-010) ไม่ปิดบัง

รายละเอียดเต็ม: [`eval/results/results.md`](eval/results/results.md) § Limitations

## เว็บ UI (Feature 3)

```bash
uv sync --extra api
uv run uvicorn app.api:app --port 8000          # terminal 1 — backend
cd web && npm install && npm run dev             # terminal 2 — http://localhost:3000
```

Next.js dev server จะ proxy `/api/*` ไปยัง FastAPI backend ที่ `:8000` (same-origin ไม่ต้องตั้ง CORS —
ดู `web/next.config.ts`) `/` คือหน้า landing page, `/triage` คือหน้าแชต ทั้งคู่เรียกใช้ pipeline `triage()`
ที่ตรวจสอบแล้วชุดเดียวกับที่ CLI ใช้

### Deploy (Render + Vercel)

Backend กับ frontend deploy แยกกัน อยู่คนละ origin — ต่างจาก local dev ที่ใช้ `localhost` ร่วมกันได้
จึงต้องมี 2 ตัวแปรเชื่อมช่องว่างนี้: `API_BASE_URL` (frontend → backend) และ `ALLOWED_ORIGINS`
(CORS allow-list ของ backend เพราะตอนนี้ frontend เรียกไปอีก origin หนึ่ง แทนที่จะเป็น same-origin ผ่าน
dev proxy)

**1. Backend บน Render** — `render.yaml` ที่ root ของ repo คือ blueprint พร้อมใช้
(New → Blueprint → เลือก repo นี้) ตั้งค่า env var เหล่านี้ใน Render dashboard หลังสร้างเสร็จ:
- `OPENAI_API_KEY`, `OPENAI_BASE_URL` — ใช้ค่าเดียวกับ `.env` ในเครื่อง
- `ALLOWED_ORIGINS` — URL ของ Vercel จากขั้นตอนที่ 2 (ตั้งหลังทำขั้นตอน 2 เสร็จ เมื่อรู้ URL แล้ว; Render
  จะ redeploy ให้เองอัตโนมัติเมื่อ env var เปลี่ยน)

จด URL ของ backend ที่ได้ (`https://<name>.onrender.com`) ไว้หลัง deploy เสร็จ

**2. Frontend บน Vercel** — New Project → import repo นี้ → ตั้ง **Root Directory** เป็น `web`
เพิ่ม env var ตัวนี้ก่อน deploy ครั้งแรก:
- `API_BASE_URL` — URL ของ Render จากขั้นตอนที่ 1 (เช่น `https://basismedic-api.onrender.com`)

**3. ปิดวงให้ครบ** — กลับไปที่ Render แล้วตั้ง `ALLOWED_ORIGINS` เป็น URL ของ Vercel (เช่น
`https://basismedic.vercel.app`) คั่นด้วย comma ถ้ามีมากกว่า 1 URL (เช่น preview URL)

Render free tier จะ sleep เมื่อไม่มีคนใช้งาน — request แรกหลังจากเงียบไปสักพักอาจใช้เวลา 10–30 วินาที
กว่าจะตื่น ถือเป็นเรื่องปกติ ไม่ใช่บั๊ก

## โครงสร้างโปรเจค

```
app/            config, llm (chat + embed, ตัวเดียวที่เรียก gateway), normalize, cli, api (Feature 3 edge),
                retrieval/ (Feature 1), agent/ (Feature 2: tools, loop, formatter, verify, fallback),
                triage_service.py (จุดเข้า service ของ Feature 2)
data/           runbooks/, tcodes.json, index/ (สร้างไว้แล้ว, commit ไว้), cache/ + chat_cache/ (สร้างเอง, ไม่ commit)
eval/           cases_dev.jsonl, cases_test.jsonl, schema, metrics, run_retrieval, run_e2e, run_all, results/
examples/       ตัวอย่าง log สำหรับคำสั่งด้านบน (ไม่ใช่เนื้อหา runbook)
tests/          offline, mock gateway — uv run pytest
web/            Next.js app (landing page + triage chat), เรียกใช้ app/api.py
```

## สิ่งที่อยู่นอกขอบเขต

การสนทนาแบบหลายรอบ (multi-turn), การเชื่อมต่อกับระบบ SAP จริง, และการสั่งแก้ไขปัญหาใดๆ
