"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface AssignModalProps {
    patient: { id: string; name: string; schedule?: string | null; status?: string };
    onClose: () => void;
    isReassign?: boolean;
}

export default function AssignModal({ patient, onClose, isReassign = false }: AssignModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAssign = async (schedule: "mon_wed" | "tue_thu" | "dc") => {
        setIsSubmitting(true);
        try {
            const isDC = schedule === "dc";
            const updates = {
                status: isDC ? "discharged" : "assigned",
                schedule: schedule,
                assigned_at: new Date().toISOString(),
                ...(isDC && { discharged_at: new Date().toISOString() })
            };

            const { error } = await supabase
                .from("patients")
                .update(updates)
                .eq("id", patient.id);

            if (error) throw error;
            onClose();
        } catch (err) {
            console.error("Assign error", err);
            alert("배정 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWaiting = async () => {
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from("patients")
                .update({
                    status: "waiting",
                    schedule: null,
                    assigned_at: null,
                    discharged_at: null
                })
                .eq("id", patient.id);
            if (error) throw error;
            onClose();
        } catch (err) {
            console.error("Return to waiting error", err);
            alert("대기 명단 복구 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAlreadyWaiting = patient.status === "waiting";

    return (
        <div style={styles.overlay}>
            <div style={styles.modal} className="animate-fade-in">
                <h2 style={styles.title}>
                    {patient.name} 환자 {isReassign ? "재배정" : "배정"}
                </h2>
                <div style={styles.grid}>
                    <button
                        style={{ ...styles.btn, backgroundColor: "#4f46e5", color: "#fff" }}
                        onClick={() => handleAssign("mon_wed")}
                        disabled={isSubmitting || patient.schedule === "mon_wed"}
                    >
                        월/수 배정
                    </button>
                    <button
                        style={{ ...styles.btn, backgroundColor: "#0ea5e9", color: "#fff" }}
                        onClick={() => handleAssign("tue_thu")}
                        disabled={isSubmitting || patient.schedule === "tue_thu"}
                    >
                        화/목 배정
                    </button>
                    <button
                        style={{ ...styles.btn, backgroundColor: "#ef4444", color: "#fff" }}
                        onClick={() => handleAssign("dc")}
                        disabled={isSubmitting || patient.schedule === "dc"}
                    >
                        D/C 명단
                    </button>
                    <button
                        style={{ ...styles.btn, backgroundColor: "#f59e0b", color: "#fff", ...(isAlreadyWaiting ? { opacity: 0.4 } : {}) }}
                        onClick={handleWaiting}
                        disabled={isSubmitting || isAlreadyWaiting}
                    >
                        대기 명단
                    </button>
                </div>
                <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
                    <button className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed" as const,
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "1rem",
    },
    modal: {
        backgroundColor: "var(--card-bg)",
        padding: "1.5rem",
        borderRadius: "12px",
        width: "100%",
        maxWidth: "350px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    },
    title: {
        marginTop: 0,
        marginBottom: "1.5rem",
        fontSize: "1.2rem",
        textAlign: "center" as const
    },
    grid: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "0.75rem"
    },
    btn: {
        padding: "1rem",
        borderRadius: "8px",
        fontSize: "1rem",
        fontWeight: "bold",
        cursor: "pointer",
        border: "none",
        opacity: 0.9,
        transition: "transform 0.1s, opacity 0.2s"
    }
};
