"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import AssignModal from "./AssignModal";

interface Patient {
    id: string;
    reg_no: string;
    name: string;
    discharged_at: string | null;
    discharge_memo?: string | null;
}

function DCRow({ patient, onReassign }: { patient: Patient; onReassign: (p: Patient) => void }) {
    const [memo, setMemo] = useState(patient.discharge_memo || "");
    const memoRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (document.activeElement !== memoRef.current) {
            setMemo(patient.discharge_memo || "");
        }
    }, [patient.discharge_memo]);

    const handleMemoSave = async (value: string) => {
        await supabase.from("patients").update({ discharge_memo: value }).eq("id", patient.id);
    };

    // m.d 형식 날짜
    const dcDate = patient.discharged_at
        ? (() => { const d = new Date(patient.discharged_at); return `${d.getMonth() + 1}.${d.getDate()}`; })()
        : "";

    return (
        <li style={styles.listItem}>
            <div style={styles.topRow}>
                <span style={styles.regNo}>{patient.reg_no}</span>
                <span style={styles.name}>{patient.name}</span>
                <button className="btn-secondary" style={styles.reassignBtn} onClick={() => onReassign(patient)}>재배정</button>
            </div>
            <div style={styles.bottomRow}>
                <span style={styles.dateTag}>{dcDate} D/C</span>
                <input
                    ref={memoRef}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="사유 입력"
                    onBlur={(e) => handleMemoSave(e.target.value)}
                    style={styles.memoInput}
                />
            </div>
        </li>
    );
}

export default function DischargeList({ patients }: { patients: Patient[] }) {
    const [reassigningPatient, setReassigningPatient] = useState<Patient | null>(null);

    const now = new Date();
    const validPatients = patients.filter(p => {
        if (!p.discharged_at) return false;
        const diffHours = (now.getTime() - new Date(p.discharged_at).getTime()) / (1000 * 60 * 60);
        if (diffHours > 48) {
            supabase.from("patients").delete().eq("id", p.id).then(() => console.log('Auto deleted D/C patient', p.id));
            return false;
        }
        return true;
    });

    if (validPatients.length === 0) return null;

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Discharge 명단</h2>
            <ul style={styles.list}>
                {validPatients.map(p => (
                    <DCRow key={p.id} patient={p} onReassign={setReassigningPatient} />
                ))}
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
        marginBottom: "2rem",
        opacity: 0.8
    },
    title: {
        fontSize: "1.2rem",
        marginBottom: "1rem",
        paddingBottom: "0.5rem",
        borderBottom: "2px solid var(--border-color)",
        color: "var(--text-muted)"
    },
    list: {
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column" as const,
        gap: "0.5rem"
    },
    listItem: {
        display: "flex",
        flexDirection: "column" as const,
        padding: "0.75rem",
        backgroundColor: "var(--bg-color)",
        borderRadius: "8px",
        gap: "0.5rem",
    },
    topRow: {
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
    },
    regNo: {
        fontFamily: "monospace",
        color: "var(--text-muted)",
        fontSize: "0.85rem",
        flexShrink: 0,
    },
    name: {
        fontWeight: "bold",
        fontSize: "1.05rem",
        color: "var(--text-muted)",
        flex: 1,
    },
    reassignBtn: {
        padding: "0.25rem 0.5rem",
        fontSize: "0.8rem",
        flexShrink: 0,
    },
    bottomRow: {
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
    },
    dateTag: {
        fontSize: "0.8rem",
        color: "var(--text-muted)",
        backgroundColor: "#e2e8f0",
        padding: "0.2rem 0.5rem",
        borderRadius: "4px",
        whiteSpace: "nowrap" as const,
        flexShrink: 0,
    },
    memoInput: {
        flex: 1,
        fontSize: "0.85rem",
        padding: "0.3rem 0.5rem",
        borderRadius: "4px",
        border: "1px solid var(--border-color)",
        backgroundColor: "#fff",
        minWidth: 0,
    },
};
