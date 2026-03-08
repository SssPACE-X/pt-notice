"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import AssignModal from "./AssignModal";

interface Patient {
    id: string;
    reg_no: string;
    name: string;
    discharged_at: string | null;
}

export default function DischargeList({ patients }: { patients: Patient[] }) {
    const [reassigningPatient, setReassigningPatient] = useState<Patient | null>(null);

    // 이틀(48시간) 지난 환자 자동 숨김이 아니라 DB에서 삭제해야함 (요구사항: 이틀 후 삭제)
    // 여기서는 클라이언트에서 렌더링 시점에 필터링하고, 가비지 컬렉션은 추후 서버리스 크론으로 하거나 여기서 삭제 쿼리 날림.
    // MVP 안전을 위해 클라이언트에서 필터링 후 렌더링.

    const now = new Date();
    const validPatients = patients.filter(p => {
        if (!p.discharged_at) return false;
        const diffHours = (now.getTime() - new Date(p.discharged_at).getTime()) / (1000 * 60 * 60);
        // 이틀(48시간) 초과 시 삭제 (렌더링 제외 + DB 삭제 시도)
        if (diffHours > 48) {
            supabase.from("patients").delete().eq("id", p.id).then(() => console.log('Auto deleted D/C patient', p.id));
            return false;
        }
        return true;
    });

    if (validPatients.length === 0) return null; // 빈 명단은 숨길 수 있음 (선택)

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Discharge 명단</h2>
            <ul style={styles.list}>
                {validPatients.map(p => (
                    <li key={p.id} style={styles.listItem}>
                        <div style={styles.info}>
                            <span style={styles.regNo}>{p.reg_no}</span>
                            <span style={styles.name}>{p.name}</span>
                        </div>
                        <div style={styles.actions}>
                            <button className="btn-secondary" onClick={() => setReassigningPatient(p)}>재배정</button>
                            <div style={styles.dateInfo}>
                                {new Date(p.discharged_at!).toLocaleDateString()} D/C
                            </div>
                        </div>
                    </li>
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
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.75rem",
        backgroundColor: "var(--bg-color)",
        borderRadius: "8px",
        gap: "0.5rem",
        overflow: "hidden" as const,
    },
    info: {
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
        minWidth: 0,
        overflow: "hidden" as const,
    },
    regNo: {
        fontFamily: "monospace",
        color: "var(--text-muted)",
        fontSize: "0.9rem"
    },
    name: {
        fontWeight: "bold",
        fontSize: "1.1rem",
        color: "var(--text-muted)",
        whiteSpace: "nowrap" as const,
        overflow: "hidden" as const,
        textOverflow: "ellipsis" as const,
    },
    actions: {
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
        flexShrink: 0,
    },
    dateInfo: {
        fontSize: "0.85rem",
        color: "var(--text-muted)",
        backgroundColor: "#e2e8f0",
        padding: "0.2rem 0.5rem",
        borderRadius: "4px"
    }
};
