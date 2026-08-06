# QMaster — UI Test Cases (Auth + Core CRUD)

เอกสารนี้ระบุ UI test cases ชุดแรกสำหรับทดสอบ QMaster ผ่านหน้าจอจริง (end-to-end)
ทุกเคสจะถูกโหลดเข้า QMaster project `QMS` และ automate ด้วย Playwright

- **System Under Test:** QMaster (`http://localhost:3000`)
- **Test Account:** `admin@example.com` / `admin1234`
- **Scope:** Authentication + Core CRUD flows
- **Automation:** Playwright (local) → ผลบันทึกกลับ QMaster ผ่าน reporter webhook

---

## สรุปรายการ

| ID | Title | Priority | Type |
|----|-------|----------|------|
| QMS-01 | Login ด้วย credential ที่ถูกต้อง | HIGH | Auth |
| QMS-02 | Login ด้วยรหัสผ่านผิด | HIGH | Auth (negative) |
| QMS-03 | สร้าง project ใหม่ | HIGH | CRUD |
| QMS-04 | เปิด project และเห็นรายการ test cases | MEDIUM | Read |
| QMS-05 | สร้าง test case ใหม่ | HIGH | CRUD |
| QMS-06 | แก้ไข test case ที่มีอยู่ | MEDIUM | CRUD |
| QMS-07 | สร้าง test run และเลือก cases | HIGH | Run |
| QMS-08 | Logout ออกจากระบบ | MEDIUM | Auth |

---

## QMS-01 — Login ด้วย credential ที่ถูกต้อง

- **Priority:** HIGH
- **Preconditions:** มี user `admin@example.com` อยู่ในระบบ, อยู่ที่หน้า `/login`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | เปิดหน้า `/login` | เห็นฟอร์ม "Welcome back" มีช่อง email + password |
| 2 | กรอก email = `admin@example.com` | ช่องรับค่าถูกต้อง |
| 3 | กรอก password = `admin1234` | ช่องแสดงเป็นจุด (masked) |
| 4 | กดปุ่ม "Sign in" | ถูก redirect ไปหน้า dashboard, เห็นเมนู Projects/Workspace/Dashboards |

**Pass criteria:** URL เปลี่ยนออกจาก `/login` และเห็น header ของแอป

---

## QMS-02 — Login ด้วยรหัสผ่านผิด

- **Priority:** HIGH
- **Preconditions:** อยู่ที่หน้า `/login`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | กรอก email = `admin@example.com` | — |
| 2 | กรอก password = `wrongpassword` | — |
| 3 | กดปุ่ม "Sign in" | ยังอยู่หน้า `/login` และเห็นข้อความ error |

**Pass criteria:** ไม่ถูก redirect เข้าระบบ + มี error message แสดง

---

## QMS-03 — สร้าง project ใหม่

- **Priority:** HIGH
- **Preconditions:** Login แล้ว, อยู่หน้า Projects

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | ไปหน้า Projects | เห็นรายการ project ที่มีอยู่ |
| 2 | กดปุ่มสร้าง project ใหม่ | เห็นฟอร์ม/dialog กรอกข้อมูล |
| 3 | กรอก name = `E2E Demo Project`, code = `E2E` | — |
| 4 | ยืนยันสร้าง | project ใหม่ปรากฏในรายการ |

**Pass criteria:** เห็น `E2E Demo Project` ใน project list

---

## QMS-04 — เปิด project และเห็นรายการ test cases

- **Priority:** MEDIUM
- **Preconditions:** Login แล้ว, มี project ที่มี test cases (เช่น ECO)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | คลิก project `ECO` จากรายการ | เข้าหน้า project overview |
| 2 | ไปที่ tab/ส่วน test cases | เห็นรายการ test cases ของ project นั้น |

**Pass criteria:** เห็น test case อย่างน้อย 1 รายการภายใต้ project

---

## QMS-05 — สร้าง test case ใหม่

- **Priority:** HIGH
- **Preconditions:** Login แล้ว, อยู่ใน project ที่มี suite

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | เปิด project แล้วไปที่ suite | เห็นปุ่มสร้าง test case |
| 2 | กดสร้าง test case | เห็นฟอร์มกรอก title/priority/severity |
| 3 | กรอก title = `E2E — verify checkout` | — |
| 4 | บันทึก | test case ใหม่ปรากฏในรายการ |

**Pass criteria:** เห็น test case `E2E — verify checkout` ในรายการ

---

## QMS-06 — แก้ไข test case ที่มีอยู่

- **Priority:** MEDIUM
- **Preconditions:** Login แล้ว, มี test case อยู่แล้ว

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | คลิก test case ที่มีอยู่ | เปิดหน้า/panel รายละเอียด |
| 2 | แก้ title เป็น `E2E — verify checkout (updated)` | — |
| 3 | บันทึก | title เปลี่ยนตามที่แก้ |

**Pass criteria:** เห็น title ใหม่หลัง reload

---

## QMS-07 — สร้าง test run และเลือก cases

- **Priority:** HIGH
- **Preconditions:** Login แล้ว, project มี test cases

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | ไปที่ส่วน Test Runs ของ project | เห็นปุ่มสร้าง run |
| 2 | กดสร้าง run | เห็นฟอร์มกรอก title + เลือก cases |
| 3 | กรอก title = `E2E Smoke Run`, เลือก cases | — |
| 4 | ยืนยัน | run ใหม่ถูกสร้าง มี cases อยู่ในสถานะ IN_PROGRESS |

**Pass criteria:** เห็น run `E2E Smoke Run` พร้อมรายการ cases

---

## QMS-08 — Logout ออกจากระบบ

- **Priority:** MEDIUM
- **Preconditions:** Login อยู่

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | เปิดเมนู user/profile | เห็นตัวเลือก Logout |
| 2 | กด Logout | ถูก redirect กลับหน้า `/login` |

**Pass criteria:** กลับมาที่หน้า `/login` และเข้าหน้า protected ไม่ได้

---

## Automation Mapping

แต่ละเคสถูกโหลดเข้า QMaster project `QMS` แล้ว (ผ่าน `scripts/load-ui-testcases.mjs`)
QMaster case ID จริงถูกบันทึกไว้ที่ **`e2e/case-map.json`** (Playwright อ่านไฟล์นี้เพื่อผูกผลกลับ)

| Doc ID | QMaster Case ID | Playwright Spec |
|--------|-----------------|-----------------|
| QMS-01 | ดู `e2e/case-map.json` | `e2e/auth.spec.ts` |
| QMS-02 | ดู `e2e/case-map.json` | `e2e/auth.spec.ts` |
| QMS-03 | ดู `e2e/case-map.json` | `e2e/projects.spec.ts` |
| QMS-04 | ดู `e2e/case-map.json` | `e2e/projects.spec.ts` |
| QMS-05 | ดู `e2e/case-map.json` | `e2e/cases.spec.ts` |
| QMS-06 | ดู `e2e/case-map.json` | `e2e/cases.spec.ts` |
| QMS-07 | ดู `e2e/case-map.json` | `e2e/runs.spec.ts` |
| QMS-08 | ดู `e2e/case-map.json` | `e2e/auth.spec.ts` |

> **โหลดใหม่:** `node --env-file=.env scripts/load-ui-testcases.mjs` (re-runnable — ลบของเก่าแล้วสร้างใหม่)
