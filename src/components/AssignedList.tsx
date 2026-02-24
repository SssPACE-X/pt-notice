"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AssignModal from "./AssignModal";

interface Patient {
    id: string;
    reg_no: string;
    name: string;
    ward_room: string | null;
    diagnosis: string | null;
    schedule: string | null;
}

interface TreatmentCheck {
    id: string;
    patient_id: string;
    check_date: string;
    check_state: "none" | "done" | "missed";
    missed_reason: string | null;
}

interface AssignedListProps {
    title: string;
    scheduleKey: "mon_wed" | "tue_thu";
    patients: Patient[];
    checks: TreatmentCheck[];
}

// 09시 기준 shift date 계산
function getShiftDate() {
    const now = new Date();
    if (now.getHours() < 9) {
        now.setDate(now.getDate() - 1);
    }
    // 한국 시간(KST) 보정
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    return kstDate.toISOString().split("T")[0];
}

export default function AssignedList({ title, scheduleKey, patients, checks }: AssignedListProps) {
    const [reassigningPatient, setReassigningPatient] = useState<Patient | null>(null);
    const shiftDate = getShiftDate();

    // 병동/호실 번호 기준 정렬 로직 (ex. 76.08.01)
    const sortedPatients = [...patients].sort((a, b) => {
        const wA = a.ward_room || "0";
        const wB = b.ward_room || "0";

        const partsA = wA.split('.').map(n => parseInt(n || "0", 10));
        const partsB = wB.split('.').map(n => parseInt(n || "0", 10));

        const len = Math.max(partsA.length, partsB.length);
        for (let i = 0; i < len; i++) {
            const numA = partsA[i] || 0;
            const numB = partsB[i] || 0;
            if (numA !== numB) {
                return numA - numB;
            }
        }
        return 0;
    });

    const handleCheckboxClick = async (patientId: string) => {
        const existingCheck = checks.find(c => c.patient_id === patientId && c.check_date === shiftDate);

        let nextState: "none" | "done" | "missed" = "done";
        if (existingCheck?.check_state === "done") nextState = "missed";
        else if (existingCheck?.check_state === "missed") nextState = "none";

        if (existingCheck) {
            if (nextState === "none") {
                await supabase.from("treatment_checks").delete().eq("id", existingCheck.id);
            } else {
                await supabase.from("treatment_checks").update({ check_state: nextState }).eq("id", existingCheck.id);
            }
        } else {
            await supabase.from("treatment_checks").insert([{
                patient_id: patientId,
                check_date: shiftDate,
                check_state: nextState
            }]);
        }
    };

    const handleUpdatePatient = async (patientId: string, field: "ward_room" | "diagnosis", value: string) => {
        await supabase.from("patients").update({ [field]: value }).eq("id", patientId);
    };

    const handleUpdateReason = async (checkId: string, reason: string) => {
        await supabase.from("treatment_checks").update({ missed_reason: reason }).eq("id", checkId);
    };

    return (
        <div style={styles.container}>
            <h2 style={{ ...styles.title, borderColor: scheduleKey === "mon_wed" ? "var(--primary)" : "#0ea5e9" }}>
                {title} 명단
            </h2>
            <ul style={styles.list}>
                {sortedPatients.map(p => {
                    const check = checks.find(c => c.patient_id === p.id && c.check_date === shiftDate);
                    const state = check?.check_state || "none";

                    return (
                        <li key={p.id} style={styles.card}>
                            <div style={styles.mainRow}>
                                {/* 1. 체크박스 영역 */}
                                <div
                                    style={{ ...styles.checkbox, ...(state === "done" ? styles.checkV : state === "missed" ? styles.checkX : {}) }}
                                    onClick={() => handleCheckboxClick(p.id)}
                                >
                                    {state === "done" ? "V" : state === "missed" ? "X" : ""}
                                </div>

                                {/* 2. 이름 (클릭 시 재배정) */}
                                <div
                                    style={styles.name}
                                    onClick={() => setReassigningPatient(p)}
                                >
                                    {p.name}
                                </div>

                                {/* 3. 병동/호실 */}
                                <input
                                    defaultValue={p.ward_room || ""}
                                    placeholder="병동.호실 (ex 76.01)"
                                    pattern="[0-9.]+"
                                    onBlur={(e) => {
                                        // 입력값 숫자/점만 필터링 저장
                                        const val = e.target.value.replace(/[^0-9.]/g, '');
                                        e.target.value = val;
                                        handleUpdatePatient(p.id, "ward_room", val)
                                    }}
                                    style={styles.wardInput}
                                />

                                {/* 4. 질환명 */}
                                <input
                                    defaultValue={p.diagnosis || ""}
                                    placeholder="질환명 입력"
                                    onBlur={(e) => handleUpdatePatient(p.id, "diagnosis", e.target.value)}
                                    style={styles.diagInput}
                                />
                            </div>

                            {/* X 상태 시 사유 입력란 등장 */}
                            {state === "missed" && check && (
                                <div style={styles.reasonRow} className="animate-fade-in">
                                    <span style={styles.reasonLabel}>↳ 미시행 사유:</span>
                                    <input
                                        defaultValue={check.missed_reason || ""}
                                        placeholder="사유를 입력하세요 (예: 거부, 외출 등)"
                                        onBlur={(e) => handleUpdateReason(check.id, e.target.value)}
                                        style={styles.reasonInput}
                                    />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>

            {reassigningPatient && (
                <AssignModal
                    patient={reassigningPatient}
                    onClose={() => setReassigningPatient(null)}
                    isReassign
                />
            )}
        </div>
    );
}

const styles = {
    container: {
        backgroundColor: "var(--card-bg)",
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
        marginBottom: "2rem"
    },
    title: {
        fontSize: "1.2rem",
        marginBottom: "1rem",
        paddingBottom: "0.5rem",
        borderBottom: "2px solid var(--border-color)",
    },
    list: {
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column" as const,
        gap: "0.75rem"
    },
    card: {
        display: "flex",
        flexDirection: "column" as const,
        padding: "0.75rem",
        backgroundColor: "var(--bg-color)",
        borderRadius: "8px",
        border: "1px solid var(--border-color)",
    },
    mainRow: {
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        flexWrap: "wrap" as const,
    },
    checkbox: {
        width: "32px",
        height: "32px",
        border: "2px solid var(--border-color)",
        borderRadius: "8px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "1.2rem",
        fontWeight: "bold",
        cursor: "pointer",
        backgroundColor: "#fff",
        userSelect: "none" as const,
        transition: "all 0.2s"
    },
    checkV: {
        backgroundColor: "var(--success)",
        borderColor: "var(--success)",
        color: "#fff"
    },
    checkX: {
        backgroundColor: "var(--danger)",
        borderColor: "var(--danger)",
        color: "#fff"
    },
    name: {
        fontWeight: "bold",
        fontSize: "1.05rem",
        minWidth: "60px",
        cursor: "pointer",
        color: "var(--primary)",
        textDecoration: "underline",
        textUnderlineOffset: "4px"
    },
    wardInput: {
        width: "120px",
        flexShrink: 0
    },
    diagInput: {
        flex: 1,
        minWidth: "150px"
    },
    reasonRow: {
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        marginTop: "0.75rem",
        paddingTop: "0.75rem",
        borderTop: "1px dashed var(--border-color)",
        marginLeft: "2rem"
    },
    reasonLabel: {
        color: "var(--danger)",
        fontWeight: 500,
        fontSize: "0.9rem",
        whiteSpace: "nowrap" as const
    },
    reasonInput: {
        flex: 1,
        borderColor: "var(--danger)"
    }
};
