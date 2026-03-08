"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import AssignModal from "./AssignModal";

interface Patient {
    id: string;
    reg_no: string;
    name: string;
}

export default function WaitingList({ patients }: { patients: Patient[] }) {
    const [assigningPatient, setAssigningPatient] = useState<Patient | null>(null);

    const handleDelete = async (id: string) => {
        if (confirm("정말로 이 환자를 완전히 삭제하시겠습니까? (DB에서 삭제됩니다)")) {
            await supabase.from("patients").delete().eq("id", id);
        }
    };

    const handleEdit = async (p: Patient) => {
        const newName = prompt("환자 이름 수정:", p.name);
        if (newName === null) return; // 취소
        const newRegNo = prompt("등록번호 수정:", p.reg_no);
        if (newRegNo === null) return; // 취소

        if (!newName.trim() || !newRegNo.trim()) {
            alert("이름과 등록번호는 비워둘 수 없습니다.");
            return;
        }

        try {
            const { error } = await supabase
                .from("patients")
                .update({ name: newName.trim(), reg_no: newRegNo.trim() })
                .eq("id", p.id);
            if (error) throw error;
        } catch (err) {
            console.error("Edit error", err);
            alert("수정 중 오류가 발생했습니다.");
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>대기 명단</h2>
            {patients.length === 0 ? (
                <p style={styles.empty}>대기 중인 환자가 없습니다.</p>
            ) : (
                <ul style={styles.list}>
                    {patients.map(p => (
                        <li key={p.id} style={styles.listItem}>
                            <div style={styles.info}>
                                <span style={styles.regNo}>{p.reg_no}</span>
                                <span style={styles.name}>{p.name}</span>
                            </div>
                            <div style={styles.actions}>
                                <button className="btn-primary" style={styles.btnAssign} onClick={() => setAssigningPatient(p)}>배정</button>
                                <button className="btn-secondary" style={styles.btnEdit} onClick={() => handleEdit(p)}>수정</button>
                                <button className="btn-secondary" style={styles.btnDelete} onClick={() => handleDelete(p.id)}>삭제</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {assigningPatient && (
                <AssignModal
                    patient={assigningPatient}
                    onClose={() => setAssigningPatient(null)}
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
        gap: "0.5rem"
    },
    listItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.75rem",
        backgroundColor: "var(--bg-color)",
        borderRadius: "8px",
    },
    info: {
        display: "flex",
        gap: "1rem",
        alignItems: "center",
    },
    regNo: {
        fontFamily: "monospace",
        color: "var(--text-muted)",
        fontSize: "0.9rem"
    },
    name: {
        fontWeight: "bold",
        fontSize: "1.1rem"
    },
    actions: {
        display: "flex",
        gap: "0.5rem"
    },
    btnAssign: {
        padding: "0.3rem 0.6rem",
        fontSize: "0.85rem"
    },
    btnEdit: {
        padding: "0.3rem 0.6rem",
        fontSize: "0.85rem",
    },
    btnDelete: {
        padding: "0.3rem 0.6rem",
        fontSize: "0.85rem",
        color: "var(--danger)"
    },
    empty: {
        color: "var(--text-muted)",
        textAlign: "center" as const,
        padding: "2rem 0"
    }
};
